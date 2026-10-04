import type { ValidationReport, ValidationResult, ValidationStatus, ConfidenceLevel } from './types';
import { confidenceToLevel, overallStatus } from './types';
import type { ReactorModelResult } from '../reactor/reactorModel';
import { validateEnergyConservation, validatePowerBalance } from './energy';
import { validateChargeConservation, validateChargeCircuit } from './charge';
import { validateParticleConservation, validateReactionStoichiometry } from './particle';
import { validateMomentumConservation, validateAlphaEmissionAngle } from './momentum';
import type { UncertaintyReport } from './types';
import { getReaction } from '../fuels/fuelRegistry';

export function runValidation(
  model: ReactorModelResult,
  uncertainty?: UncertaintyReport
): ValidationReport {
  const results: ValidationResult[] = [];

  results.push(validateEnergyConservation(model.energyLedger));
  results.push(validatePowerBalance(model.energyLedger));

  results.push(validateChargeConservation(model.particleLedger));
  results.push(validateChargeCircuit(model.particleLedger));

  results.push(...validateParticleConservation(model.particleLedger));
  results.push(validateReactionStoichiometry(model.particleLedger));

  const reaction = model.energyLedger.fuel.includes('D-T') ? 'DT'
    : model.energyLedger.fuel.includes('D-³He') ? 'DHe3'
    : model.energyLedger.fuel.includes('p-B') ? 'PB11'
    : 'DT';

  results.push(validateMomentumConservation(getReactionForKey(reaction)));
  results.push(validateAlphaEmissionAngle(getReactionForKey(reaction)));

  if (uncertainty) {
    const netUnc = uncertainty.netPowerDist.uncertaintyPercent;

    const viableFrac = uncertainty.viableFraction;

    results.push({
      id: 'uncertainty-pnet',
      name: 'P_net 不确定性',
      status: netUnc < 15 ? 'PASS' : netUnc < 30 ? 'WARN' : 'FAIL',
      value: netUnc,
      limit: 30,
      message: `Monte Carlo ${uncertainty.samples} 次：σ/μ=${netUnc.toFixed(1)}%，P10=${uncertainty.netPowerDist.p10.toFixed(0)} MW，P90=${uncertainty.netPowerDist.p90.toFixed(0)} MW`,
      confidence: viableFrac,
      confidenceLevel: confidenceToLevel(viableFrac),
      modelLevel: 2,
      category: 'engineering',
    });

    results.push({
      id: 'uncertainty-viability',
      name: '方案可行性概率',
      status: viableFrac > 0.9 ? 'PASS' : viableFrac > 0.5 ? 'WARN' : 'FAIL',
      value: viableFrac * 100,
      limit: 50,
      message: `${(viableFrac * 100).toFixed(1)}% 的 Monte Carlo 样本净电为正`,
      confidence: viableFrac,
      confidenceLevel: confidenceToLevel(viableFrac),
      modelLevel: 2,
      category: 'engineering',
    });
  }

  const status = overallStatus(results);
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const warnCount = results.filter((r) => r.status === 'WARN').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / results.length;
  const confidenceLevel = confidenceToLevel(avgConfidence);

  const minModelLevel = Math.min(...results.map((r) => r.modelLevel));
  const modelClassification = classifyModel(status, confidenceLevel, minModelLevel);

  const summary = status === 'PASS'
    ? warnCount === 0
      ? `全部 ${results.length} 项物理校验通过，模型置信度 ${confidenceLevel}`
      : `${passCount} 项通过 / ${warnCount} 项警告 / 0 项失败，置信度 ${confidenceLevel}`
    : `${passCount} 项通过 / ${warnCount} 项警告 / ${failCount} 项失败 — ${modelClassification}`;

  return {
    results,
    overallStatus: status,
    overallConfidence: avgConfidence,
    overallConfidenceLevel: confidenceLevel,
    modelClassification,
    passCount,
    warnCount,
    failCount,
    summary,
  };
}

function classifyModel(status: ValidationStatus, confidence: ConfidenceLevel, modelLevel: number): string {
  if (status === 'FAIL') return '❌ MODEL FAILED — 存在物理违反';
  if (modelLevel >= 3 && confidence === 'HIGH') return '🟢 VALIDATED MODEL — 实验校验';
  if (modelLevel >= 2 && confidence !== 'LOW') return '🟡 NUMERICAL MODEL — 数值模拟';
  if (modelLevel >= 1) return '🟡 ANALYTICAL MODEL — 解析计算';
  return '🔴 CONCEPTUAL MODEL — 概念模型';
}


function getReactionForKey(key: string) {
  return getReaction(key);
}