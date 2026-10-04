import type { ValidationResult } from './types';
import type { EnergyLedgerResult } from '../physics/energyLedger';

export function validateEnergyConservation(ledger: EnergyLedgerResult): ValidationResult {
  const error = ledger.conservationError;
  const errorPercent = error * 100;
  const status = error < 0.001 ? 'PASS' : error < 0.01 ? 'WARN' : 'FAIL';
  const confidence = error < 0.001 ? 0.99 : error < 0.01 ? 0.7 : 0.2;

  return {
    id: 'energy-conservation',
    name: '能量守恒',
    status,
    value: errorPercent,
    limit: 0.1,
    message:
      status === 'PASS'
        ? `P_fusion = P_electric + P_loss + P_radiation + P_escape，偏差 ${errorPercent.toFixed(4)}%`
        : status === 'WARN'
          ? `能量守恒偏差 ${errorPercent.toFixed(2)}%，存在计算近似`
          : `❌ 能量守恒失败：偏差 ${errorPercent.toFixed(2)}%，P_in ≠ P_out`,
    confidence,
    confidenceLevel: confidence >= 0.8 ? 'HIGH' : confidence >= 0.4 ? 'MEDIUM' : 'LOW',
    modelLevel: 1,
    category: 'conservation',
  };
}

export function validatePowerBalance(ledger: EnergyLedgerResult): ValidationResult {
  const pIn = ledger.fusionPower;
  const pOut = ledger.pGrossElectric + ledger.pConversionLoss + ledger.pPlasmaHeating + ledger.pEscaping + ledger.pRadiation;
  const residual = Math.abs(pIn - pOut) / pIn;
  const status = residual < 0.01 ? 'PASS' : residual < 0.05 ? 'WARN' : 'FAIL';

  return {
    id: 'power-balance',
    name: '功率平衡',
    status,
    value: residual * 100,
    limit: 1,
    message: `P_in=${(pIn / 1e6).toFixed(1)} MW, P_out=${(pOut / 1e6).toFixed(1)} MW, 残差 ${(residual * 100).toFixed(3)}%`,
    confidence: residual < 0.01 ? 0.95 : 0.5,
    confidenceLevel: residual < 0.01 ? 'HIGH' : 'MEDIUM',
    modelLevel: 1,
    category: 'conservation',
  };
}