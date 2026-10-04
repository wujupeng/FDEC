import type { ValidationResult } from './types';
import type { ParticleLedgerResult } from '../physics/particleLedger';

export function validateParticleConservation(ledger: ParticleLedgerResult): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const entry of ledger.entries) {
    const produced = entry.productionRate;
    const accounted = entry.captureRate + entry.escapeRate + entry.depositedRate;
    const residual = produced > 0 ? Math.abs(produced - accounted) / produced : 0;
    const status = residual < 0.001 ? 'PASS' : residual < 0.01 ? 'WARN' : 'FAIL';
    const confidence = residual < 0.001 ? 0.95 : 0.5;

    results.push({
      id: `particle-conservation-${entry.particle}`,
      name: `粒子守恒: ${entry.name} (${entry.symbol})`,
      status,
      value: residual * 100,
      limit: 0.1,
      message:
        status === 'PASS'
          ? `${entry.symbol}: 产生=${produced.toExponential(2)} = 捕获+逃逸+沉积=${accounted.toExponential(2)}`
          : `${entry.symbol} 粒子不闭合：残差 ${(residual * 100).toFixed(2)}%`,
      confidence,
      confidenceLevel: confidence >= 0.8 ? 'HIGH' : 'MEDIUM',
      modelLevel: 1,
      category: 'conservation',
    });
  }

  return results;
}

export function validateReactionStoichiometry(ledger: ParticleLedgerResult): ValidationResult {
  const alphaEntry = ledger.entries.find((e) => e.particle === 'alpha');
  const neutronEntry = ledger.entries.find((e) => e.particle === 'neutron');

  if (!alphaEntry || !neutronEntry) {
    return {
      id: 'stoichiometry',
      name: '反应化学计量',
      status: 'PASS',
      value: 0,
      message: '非 D-T 反应或无中子产物，化学计量自动满足',
      confidence: 0.9,
      confidenceLevel: 'HIGH',
      modelLevel: 3,
      category: 'conservation',
    };
  }

  const ratio = alphaEntry.productionRate / neutronEntry.productionRate;
  const residual = Math.abs(ratio - 1);
  const status = residual < 0.001 ? 'PASS' : 'WARN';

  return {
    id: 'stoichiometry',
    name: '反应化学计量 D+T→α+n',
    status,
    value: ratio,
    limit: 1,
    message: `N_α/N_n = ${ratio.toFixed(6)}，理想值 1.0（D-T 每反应产生 1α + 1n）`,
    confidence: 0.99,
    confidenceLevel: 'HIGH',
    modelLevel: 3,
    category: 'conservation',
  };
}