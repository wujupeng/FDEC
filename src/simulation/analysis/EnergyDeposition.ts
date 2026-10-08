import { BatchTransportResult } from '../transport/ParticleTransport';


export interface EnergyDepositionResult {
  totalInitial: number;
  captured: number;
  wall: number;
  escaped: number;
  other: number;
  captureFraction: number;
  wallFraction: number;
  escapeFraction: number;
  otherFraction: number;
  conservationError: number;
  powerCapturedMW: number;
  powerWallMW: number;
  powerEscapedMW: number;
}

export function computeEnergyDeposition(
  batch: BatchTransportResult,
  fusionPowerMW: number = 1000
): EnergyDepositionResult {

  const totalInitial = batch.totalEnergyInitial;
  const captured = batch.totalEnergyCaptured;
  const wall = batch.totalEnergyWall;
  const escaped = batch.totalEnergyEscaped;
  const other = Math.max(0, totalInitial - captured - wall - escaped);
  const conservationError = totalInitial > 0
    ? Math.abs(totalInitial - captured - wall - escaped - other) / totalInitial
    : 0;

  const scale = fusionPowerMW * 1e6 / (totalInitial || 1);

  return {
    totalInitial,
    captured,
    wall,
    escaped,
    other,
    captureFraction: totalInitial > 0 ? captured / totalInitial : 0,
    wallFraction: totalInitial > 0 ? wall / totalInitial : 0,
    escapeFraction: totalInitial > 0 ? escaped / totalInitial : 0,
    otherFraction: totalInitial > 0 ? other / totalInitial : 0,
    conservationError,
    powerCapturedMW: captured * scale / 1e6,
    powerWallMW: wall * scale / 1e6,
    powerEscapedMW: escaped * scale / 1e6,
  };
}