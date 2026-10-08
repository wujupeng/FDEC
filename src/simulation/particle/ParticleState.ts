import { Vec3, ParticleSpecies, getSpecies, kineticEnergy, relativisticEnergy } from '../core';

export type ParticleFate = 'FLYING' | 'DEC_CAPTURED' | 'WALL_HIT' | 'ESCAPED' | 'INVALID';

export interface ParticleState {
  id: number;
  species: ParticleSpecies;
  charge: number;
  mass: number;
  pos: Vec3;
  vel: Vec3;
  t: number;
  energy0: number;
  fate: ParticleFate;
  stepsAlive: number;
  wallHitPos?: Vec3;
  capturedPos?: Vec3;
  escapedPos?: Vec3;
}

export interface TrajectorySample {
  step: number;
  t: number;
  pos: Vec3;
  vel: Vec3;
  energy: number;
  fate: ParticleFate;
}

export function createParticle(
  id: number,
  species: ParticleSpecies,
  pos: Vec3,
  vel: Vec3,
  relativistic: boolean = false
): ParticleState {
  const props = getSpecies(species);

  const energy0 = relativistic
    ? relativisticEnergy(props.mass, vel)
    : kineticEnergy(props.mass, vel);
  return {
    id,
    species,
    charge: props.charge,
    mass: props.mass,
    pos: { ...pos },
    vel: { ...vel },
    t: 0,
    energy0,
    fate: 'FLYING',
    stepsAlive: 0,
  };
}