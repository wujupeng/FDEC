import { BatchTransportResult } from '../transport/ParticleTransport';
import { FateStats, computeFateStats } from './ParticleFate';
import { EnergyDepositionResult, computeEnergyDeposition } from './EnergyDeposition';

export interface CaptureEfficiencyResult {
  particleCaptureRate: number;
  energyCaptureRate: number;
  particleWallRate: number;
  particleEscapeRate: number;
  energyWallFraction: number;
  energyEscapeFraction: number;
  stats: FateStats;
  deposition: EnergyDepositionResult;
  note: string;
}

export function computeCaptureEfficiency(
  batch: BatchTransportResult,
  fusionPowerMW: number = 1000
): CaptureEfficiencyResult {
  const stats = computeFateStats(batch);
  const deposition = computeEnergyDeposition(batch, fusionPowerMW);

  return {
    particleCaptureRate: stats.captureFraction,
    energyCaptureRate: deposition.captureFraction,
    particleWallRate: stats.wallFraction,
    particleEscapeRate: stats.escapeFraction,
    energyWallFraction: deposition.wallFraction,
    energyEscapeFraction: deposition.escapeFraction,
    stats,
    deposition,
    note: '粒子捕获率和能量捕获率是不同物理量：前者按粒子数计，后者按能量加权计。',
  };
}