import { Vec3 } from '../core';
import { ReactorGeometry } from '../geometry/ReactorGeometry';
import { ParticleFate } from '../particle/ParticleState';

export interface BoundaryCheckResult {
  fate: ParticleFate;
  hitPos?: Vec3;
  energyDeposited: number;
}

export function checkBoundary(
  posPrev: Vec3,
  posCurr: Vec3,
  energy: number,
  geometry: ReactorGeometry
): BoundaryCheckResult {
  if (geometry.converter.crossed(posPrev, posCurr)) {
    return {
      fate: 'DEC_CAPTURED',
      hitPos: { ...posCurr },
      energyDeposited: energy,
    };
  }

  if (geometry.wall.crossed(posPrev, posCurr)) {
    return {
      fate: 'WALL_HIT',
      hitPos: geometry.wall.hitPosition(posPrev, posCurr),
      energyDeposited: energy,
    };
  }

  if (geometry.isEscaped(posCurr)) {
    return {
      fate: 'ESCAPED',
      hitPos: { ...posCurr },
      energyDeposited: 0,
    };
  }

  return { fate: 'FLYING', energyDeposited: 0 };
}