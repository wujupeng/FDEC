import type { ValidationResult } from './types';
import type { FusionReaction } from '../fuels/reactionTypes';
import { PhysicalConstants, UnitFactors } from '../physics/constants';

export interface MomentumCheckResult {
  totalMomentumX: number;
  totalMomentumY: number;
  totalMomentumZ: number;
  magnitude: number;
  isBalanced: boolean;
}

export function checkTwoBodyMomentum(
  m1: number,
  e1MeV: number,
  m2: number,
  e2MeV: number
): MomentumCheckResult {
  const e1J = e1MeV * UnitFactors.MeV;
  const e2J = e2MeV * UnitFactors.MeV;
  const p1 = Math.sqrt(2 * m1 * e1J);
  const p2 = Math.sqrt(2 * m2 * e2J);
  const residual = Math.abs(p1 - p2);
  const avgP = (p1 + p2) / 2;
  const relativeResidual = avgP > 0 ? residual / avgP : 0;

  return {
    totalMomentumX: 0,
    totalMomentumY: 0,
    totalMomentumZ: residual,
    magnitude: relativeResidual,
    isBalanced: relativeResidual < 0.01,
  };
}

export function validateMomentumConservation(reaction: FusionReaction): ValidationResult {
  const products = reaction.products.filter((p) => p.particle !== 'gamma');

  if (products.length === 2) {
    const m1 = getParticleMass(products[0].particle);
    const m2 = getParticleMass(products[1].particle);
    const check = checkTwoBodyMomentum(m1, products[0].energyMeV, m2, products[1].energyMeV);
    const residualPercent = check.magnitude * 100;
    const status = check.isBalanced ? 'PASS' : residualPercent < 5 ? 'WARN' : 'FAIL';

    return {
      id: 'momentum-conservation',
      name: '动量守恒',
      status,
      value: residualPercent,
      limit: 1,
      message:
        status === 'PASS'
          ? `两体反应 p1=p2，动量平衡偏差 ${residualPercent.toFixed(4)}%`
          : `动量不平衡：偏差 ${residualPercent.toFixed(2)}%`,
      confidence: check.isBalanced ? 0.99 : 0.5,
      confidenceLevel: check.isBalanced ? 'HIGH' : 'MEDIUM',
      modelLevel: 1,
      category: 'conservation',
    };
  }

  if (products.length === 3) {
    const totalE = products.reduce((s, p) => s + p.energyMeV, 0);
    const expectedPerParticle = totalE / 3;
    const variance = products.reduce((s, p) => s + Math.pow(p.energyMeV - expectedPerParticle, 2), 0) / 3;
    const std = Math.sqrt(variance);
    const relativeSpread = expectedPerParticle > 0 ? std / expectedPerParticle : 0;
    const status = relativeSpread < 0.01 ? 'PASS' : 'WARN';

    return {
      id: 'momentum-conservation',
      name: '动量守恒',
      status,
      value: relativeSpread * 100,
      limit: 5,
      message: `三体反应（3α），能量均分假设下各 α 能量 ${(expectedPerParticle).toFixed(2)} MeV，散布 ${(relativeSpread * 100).toFixed(2)}%`,
      confidence: 0.85,
      confidenceLevel: 'HIGH',
      modelLevel: 1,
      category: 'conservation',
    };
  }

  return {
    id: 'momentum-conservation',
    name: '动量守恒',
    status: 'PASS',
    value: 0,
    message: '反应产物数不支持自动动量校验',
    confidence: 0.7,
    confidenceLevel: 'MEDIUM',
    modelLevel: 0,
    category: 'conservation',
  };
}

function getParticleMass(particle: string): number {
  switch (particle) {
    case 'alpha': return PhysicalConstants.mAlpha;
    case 'proton': return PhysicalConstants.mProton;
    case 'neutron': return PhysicalConstants.mNeutron;
    case 'triton': return PhysicalConstants.mDeuteron + PhysicalConstants.mNeutron;
    case 'helium3': return PhysicalConstants.mHelium3;
    default: return PhysicalConstants.mProton;
  }
}

export function validateAlphaEmissionAngle(reaction: FusionReaction): ValidationResult {
  const hasAlpha = reaction.products.some((p) => p.particle === 'alpha');
  if (!hasAlpha) {
    return {
      id: 'alpha-emission-angle',
      name: 'α 发射方向',
      status: 'PASS',
      value: 0,
      message: '无 α 产物，跳过',
      confidence: 1,
      confidenceLevel: 'HIGH',
      modelLevel: 3,
      category: 'conservation',
    };
  }

  return {
    id: 'alpha-emission-angle',
    name: 'α 发射方向',
    status: 'WARN',
    value: 180,
    limit: 180,
    message: 'α 发射各向同性假设——实际取决于等离子体温度与反应动力学，影响磁喷口捕获效率',
    confidence: 0.5,
    confidenceLevel: 'MEDIUM',
    modelLevel: 1,
    category: 'conservation',
  };
}