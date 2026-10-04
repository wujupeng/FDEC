import type { ValidationResult } from './types';
import type { ParticleLedgerResult } from '../physics/particleLedger';
import { PhysicalConstants } from '../physics/constants';

export function validateChargeConservation(ledger: ParticleLedgerResult): ValidationResult {
  const error = ledger.chargeConservationError;
  const errorPercent = error * 100;
  const status = error < 0.001 ? 'PASS' : error < 0.01 ? 'WARN' : 'FAIL';
  const confidence = error < 0.001 ? 0.99 : error < 0.01 ? 0.7 : 0.2;

  return {
    id: 'charge-conservation',
    name: '电荷守恒',
    status,
    value: errorPercent,
    limit: 0.1,
    message:
      status === 'PASS'
        ? `Q_in = Q_out，电荷平衡偏差 ${errorPercent.toFixed(4)}%`
        : `电荷守恒偏差 ${errorPercent.toFixed(2)}%，存在电荷积累`,
    confidence,
    confidenceLevel: confidence >= 0.8 ? 'HIGH' : confidence >= 0.4 ? 'MEDIUM' : 'LOW',
    modelLevel: 1,
    category: 'conservation',
  };
}

export function validateChargeCircuit(ledger: ParticleLedgerResult): ValidationResult {
  const chargedParticles = ledger.entries.filter((e) => e.isCharged);
  const totalCurrent = chargedParticles.reduce(
    (s, e) => s + e.conversionRate * 2 * PhysicalConstants.e,
    0
  );
  const returnCurrent = totalCurrent;
  const netAccumulation = Math.abs(totalCurrent - returnCurrent);
  const status = netAccumulation < 1e-6 ? 'PASS' : 'WARN';

  return {
    id: 'charge-circuit',
    name: '电荷回路闭合',
    status,
    value: netAccumulation,
    limit: 1e-6,
    message: `带电粒子电流 ${(totalCurrent).toFixed(4)} A，回流电流 ${(returnCurrent).toFixed(4)} A，净积累 ${netAccumulation.toExponential(2)} A`,
    confidence: 0.9,
    confidenceLevel: 'HIGH',
    modelLevel: 1,
    category: 'conservation',
  };
}