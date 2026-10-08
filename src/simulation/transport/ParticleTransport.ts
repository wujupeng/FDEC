import { EField, BField, vMag2 } from '../core';
import { PhysicalConstants } from '../../physics/constants';
import { ParticleState, TrajectorySample } from '../particle/ParticleState';
import { borisStep } from '../particle/BorisPusher';
import { relativisticBorisStep } from '../particle/RelativisticBoris';
import { ReactorGeometry } from '../geometry/ReactorGeometry';
import { checkBoundary } from './Boundary';

export type TransportMode = 'classical' | 'relativistic';

export interface TransportConfig {
  mode: TransportMode;
  dt: number;
  maxSteps: number;
  eField: EField;
  bField: BField;
  geometry: ReactorGeometry;
  recordTrajectory: boolean;
  trajectoryStride: number;
}

export interface TransportResult {
  particle: ParticleState;
  trajectory: TrajectorySample[];
  energyInitial: number;
  energyFinal: number;
  energyDeposited: number;
  stepsAlive: number;
}

function computeEnergy(p: ParticleState, relativistic: boolean): number {
  if (relativistic) {
    const c = PhysicalConstants.c;
    const gamma = 1 / Math.sqrt(1 - vMag2(p.vel) / (c * c));
    return (gamma - 1) * p.mass * c * c;
  }
  return 0.5 * p.mass * vMag2(p.vel);
}

export function transportParticle(
  particle: ParticleState,
  config: TransportConfig
): TransportResult {
  const relativistic = config.mode === 'relativistic';
  const trajectory: TrajectorySample[] = [];

  let p: ParticleState = {
    ...particle,
    pos: { ...particle.pos },
    vel: { ...particle.vel },
  };

  const energyInitial = computeEnergy(p, relativistic);
  let energyDeposited = 0;

  if (config.recordTrajectory) {
    trajectory.push({
      step: 0, t: 0, pos: { ...p.pos }, vel: { ...p.vel },
      energy: energyInitial, fate: p.fate,
    });
  }

  for (let step = 1; step <= config.maxSteps; step++) {
    const posPrev = { ...p.pos };

    const result = relativistic
      ? relativisticBorisStep(p, config.eField, config.bField, config.dt)
      : borisStep(p, config.eField, config.bField, config.dt);

    p.pos = result.pos;
    p.vel = result.vel;
    p.t = step * config.dt;
    p.stepsAlive = step;

    const energy = computeEnergy(p, relativistic);

    const boundary = checkBoundary(posPrev, p.pos, energy, config.geometry);

    if (boundary.fate !== 'FLYING') {
      p.fate = boundary.fate;
      energyDeposited += boundary.energyDeposited;
      if (boundary.hitPos) {
        if (boundary.fate === 'DEC_CAPTURED') p.capturedPos = boundary.hitPos;
        if (boundary.fate === 'WALL_HIT') p.wallHitPos = boundary.hitPos;
        if (boundary.fate === 'ESCAPED') p.escapedPos = boundary.hitPos;
      }
      if (config.recordTrajectory) {
        trajectory.push({
          step, t: p.t, pos: { ...p.pos }, vel: { ...p.vel },
          energy, fate: p.fate,
        });
      }
      break;
    }

    if (config.recordTrajectory && step % config.trajectoryStride === 0) {
      trajectory.push({
        step, t: p.t, pos: { ...p.pos }, vel: { ...p.vel },
        energy, fate: p.fate,
      });
    }
  }

  const energyFinal = computeEnergy(p, relativistic);

  return {
    particle: p,
    trajectory,
    energyInitial,
    energyFinal,
    energyDeposited,
    stepsAlive: p.stepsAlive,
  };
}

export interface BatchTransportConfig extends TransportConfig {
  recordTrajectory: false;
}

export interface BatchTransportResult {
  results: TransportResult[];
  captured: number;
  wallHit: number;
  escaped: number;
  flying: number;
  totalEnergyCaptured: number;
  totalEnergyWall: number;
  totalEnergyEscaped: number;
  totalEnergyInitial: number;
  maxStepsReached: number;
}

export function transportBatch(
  particles: ParticleState[],
  config: TransportConfig
): BatchTransportResult {
  const results: TransportResult[] = [];
  let captured = 0, wallHit = 0, escaped = 0, flying = 0, maxStepsReached = 0;
  let totalEnergyCaptured = 0, totalEnergyWall = 0, totalEnergyEscaped = 0, totalEnergyInitial = 0;

  const batchConfig: TransportConfig = { ...config, recordTrajectory: false };

  for (const particle of particles) {
    const result = transportParticle(particle, batchConfig);
    results.push(result);
    totalEnergyInitial += result.energyInitial;

    switch (result.particle.fate) {
      case 'DEC_CAPTURED':
        captured++;
        totalEnergyCaptured += result.energyDeposited;
        break;
      case 'WALL_HIT':
        wallHit++;
        totalEnergyWall += result.energyDeposited;
        break;
      case 'ESCAPED':
        escaped++;
        totalEnergyEscaped += result.energyFinal;
        break;
      case 'FLYING':
        flying++;
        maxStepsReached++;
        break;
    }
  }

  return {
    results, captured, wallHit, escaped, flying,
    totalEnergyCaptured, totalEnergyWall, totalEnergyEscaped, totalEnergyInitial,
    maxStepsReached,
  };
}