import type { ParticleType } from '../fuels/reactionTypes';
import { PhysicalConstants, AlphaCharge } from './constants';

export interface NozzleConfig {
  bField: number;
  length: number;
  exitRadius: number;
  divergenceAngle: number;
}

export interface NozzleResult {
  captureEfficiency: number;
  exhaustVelocity: number;
  gyrationRadius: number;
  deflectionAngle: number;
  transitTime: number;
  isGuided: boolean;
}

export function computeNozzlePerformance(
  _particle: ParticleType,
  energyMeV: number,
  charge: number,
  mass: number,
  config: NozzleConfig
): NozzleResult {
  const energyJ = energyMeV * 1e6 * PhysicalConstants.e;
  const velocity = Math.sqrt((2 * energyJ) / mass);
  const gyroRadius = (mass * velocity) / (Math.abs(charge) * config.bField);

  const gyroFreq = (Math.abs(charge) * config.bField) / mass;
  const transitTime = config.length / velocity;
  const deflectionAngle = gyroFreq * transitTime;

  const captureEfficiency = charge === 0
    ? 0
    : Math.min(1, 1 - gyroRadius / config.exitRadius);

  const isGuided = deflectionAngle > Math.PI / 2 && gyroRadius < config.exitRadius;

  return {
    captureEfficiency,
    exhaustVelocity: velocity,
    gyrationRadius: gyroRadius,
    deflectionAngle,
    transitTime,
    isGuided,
  };
}

export interface NozzleSweepResult {
  bField: number;
  alphaEfficiency: number;
  protonEfficiency: number;
  neutronEfficiency: number;
  overallCharged: number;
}

export function sweepNozzleField(
  bFields: number[],
  alphaEnergyMeV: number,
  protonEnergyMeV: number,
  exitRadius: number,
  length: number
): NozzleSweepResult[] {
  return bFields.map((b) => {
    const alphaR = computeNozzlePerformance(
      'alpha', alphaEnergyMeV, AlphaCharge, PhysicalConstants.mAlpha,
      { bField: b, length, exitRadius, divergenceAngle: 15 }
    );
    const protonR = computeNozzlePerformance(
      'proton', protonEnergyMeV, PhysicalConstants.e, PhysicalConstants.mProton,
      { bField: b, length, exitRadius, divergenceAngle: 15 }
    );
    return {
      bField: b,
      alphaEfficiency: alphaR.captureEfficiency,
      protonEfficiency: protonR.captureEfficiency,
      neutronEfficiency: 0,
      overallCharged: (alphaR.captureEfficiency + protonR.captureEfficiency) / 2,
    };
  });
}

export function findOptimalBField(
  sweep: NozzleSweepResult[]
): NozzleSweepResult {
  return sweep.reduce((best, cur) =>
    cur.overallCharged > best.overallCharged ? cur : best
  , sweep[0]);
}