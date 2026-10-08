import { EField, BField, vMag2 } from '../core';
import { PhysicalConstants } from '../../physics/constants';
import { ParticleState, TrajectorySample } from './ParticleState';
import { borisStep } from './BorisPusher';
import { relativisticBorisStep } from './RelativisticBoris';

export type IntegratorMode = 'classical' | 'relativistic';

export interface IntegratorConfig {
  mode: IntegratorMode;
  dt: number;
  maxSteps: number;
  eField: EField;
  bField: BField;
}

export interface SingleParticleResult {
  trajectory: TrajectorySample[];
  finalState: ParticleState;
  energyDrift: number;
  steps: number;
}

function computeEnergy(particle: ParticleState, relativistic: boolean): number {
  if (relativistic) {
    const c = PhysicalConstants.c;
    const gamma = 1 / Math.sqrt(1 - vMag2(particle.vel) / (c * c));
    return (gamma - 1) * particle.mass * c * c;
  }
  return 0.5 * particle.mass * vMag2(particle.vel);
}

export function integrateParticle(
  particle: ParticleState,
  config: IntegratorConfig,
  shouldStop?: (p: ParticleState, step: number) => boolean
): SingleParticleResult {
  const trajectory: TrajectorySample[] = [];
  const relativistic = config.mode === 'relativistic';
  let p: ParticleState = { ...particle, pos: { ...particle.pos }, vel: { ...particle.vel } };

  const e0 = computeEnergy(p, relativistic);
  trajectory.push({
    step: 0,
    t: 0,
    pos: { ...p.pos },
    vel: { ...p.vel },
    energy: e0,
    fate: p.fate,
  });

  for (let step = 1; step <= config.maxSteps; step++) {
    const result = relativistic
      ? relativisticBorisStep(p, config.eField, config.bField, config.dt)
      : borisStep(p, config.eField, config.bField, config.dt);

    p.pos = result.pos;
    p.vel = result.vel;
    p.t = step * config.dt;
    p.stepsAlive = step;

    const energy = computeEnergy(p, relativistic);
    trajectory.push({
      step,
      t: p.t,
      pos: { ...p.pos },
      vel: { ...p.vel },
      energy,
      fate: p.fate,
    });

    if (shouldStop && shouldStop(p, step)) {
      break;
    }
  }

  const eFinal = computeEnergy(p, relativistic);
  const energyDrift = e0 > 0 ? Math.abs(eFinal - e0) / e0 : 0;

  return { trajectory, finalState: p, energyDrift, steps: trajectory.length - 1 };
}