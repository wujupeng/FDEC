import { PhysicalConstants } from '../core';
import { TrajectorySample } from '../particle/ParticleState';

export interface AnalyticalOrbit {
  larmorRadius: number;
  cyclotronFreq: number;
  cyclotronPeriod: number;
  velocity: number;
  gamma: number;
}

export function analyticalOrbit(
  mass: number,
  charge: number,
  energyJ: number,
  bField: number,
  relativistic: boolean = false
): AnalyticalOrbit {
  const c = PhysicalConstants.c;
  let velocity: number;
  let gamma = 1;

  if (relativistic) {
    gamma = 1 + energyJ / (mass * c * c);
    velocity = c * Math.sqrt(1 - 1 / (gamma * gamma));
  } else {
    velocity = Math.sqrt((2 * energyJ) / mass);
  }

  const larmorRadius = (gamma * mass * velocity) / (Math.abs(charge) * bField);
  const cyclotronFreq = (Math.abs(charge) * bField) / (2 * Math.PI * gamma * mass);
  const cyclotronPeriod = 1 / cyclotronFreq;

  return { larmorRadius, cyclotronFreq, cyclotronPeriod, velocity, gamma };
}

export interface OrbitComparison {
  analyticalRadius: number;
  numericalRadius: number;
  errorPercent: number;
  isValid: boolean;
}

export function measureOrbitRadius(trajectory: TrajectorySample[]): number {
  if (trajectory.length < 3) return 0;
  let cx = 0, cy = 0, count = 0;
  const maxSamples = Math.min(trajectory.length, 200);
  for (let i = 0; i < maxSamples; i++) {
    cx += trajectory[i].pos.x;
    cy += trajectory[i].pos.y;
    count++;
  }
  cx /= count;
  cy /= count;

  let maxR = 0;
  for (let i = 0; i < maxSamples; i++) {
    const r = Math.sqrt(
      (trajectory[i].pos.x - cx) ** 2 + (trajectory[i].pos.y - cy) ** 2
    );
    if (r > maxR) maxR = r;
  }
  return maxR;
}

export function compareOrbit(
  trajectory: TrajectorySample[],
  analytical: AnalyticalOrbit
): OrbitComparison {
  const numericalRadius = measureOrbitRadius(trajectory);
  const errorPercent = analytical.larmorRadius > 0
    ? Math.abs(numericalRadius - analytical.larmorRadius) / analytical.larmorRadius * 100
    : 0;

  return {
    analyticalRadius: analytical.larmorRadius,
    numericalRadius,
    errorPercent,
    isValid: errorPercent < 5,
  };
}

export interface EnergyConservationCheck {
  initialEnergy: number;
  finalEnergy: number;
  driftPercent: number;
  isConserved: boolean;
}

export function checkEnergyConservation(
  trajectory: TrajectorySample[]
): EnergyConservationCheck {
  if (trajectory.length < 2) {
    return { initialEnergy: 0, finalEnergy: 0, driftPercent: 0, isConserved: true };
  }
  const initialEnergy = trajectory[0].energy;
  const finalEnergy = trajectory[trajectory.length - 1].energy;
  const driftPercent = initialEnergy > 0
    ? Math.abs(finalEnergy - initialEnergy) / initialEnergy * 100
    : 0;

  return {
    initialEnergy,
    finalEnergy,
    driftPercent,
    isConserved: driftPercent < 1,
  };
}