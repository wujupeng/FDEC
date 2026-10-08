import { PhysicalConstants } from '../physics/constants';

export { PhysicalConstants };

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const vec = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const vecZero = (): Vec3 => ({ x: 0, y: 0, z: 0 });

export function vAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vSub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vScale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function vDot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vCross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function vMag(a: Vec3): number {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}

export function vMag2(a: Vec3): number {
  return a.x * a.x + a.y * a.y + a.z * a.z;
}

export function vNorm(a: Vec3): Vec3 {
  const m = vMag(a);
  return m > 0 ? vScale(a, 1 / m) : vecZero();
}

export function vDist(a: Vec3, b: Vec3): number {
  return vMag(vSub(a, b));
}

export interface EField {
  E(pos: Vec3): Vec3;
  potential(pos: Vec3): number;
}

export interface BField {
  B(pos: Vec3): Vec3;
}

export type ParticleSpecies = 'alpha' | 'proton' | 'deuteron' | 'he3' | 'boron11' | 'electron';

export interface SpeciesProperties {
  species: ParticleSpecies;
  charge: number;
  mass: number;
  label: string;
}

export function getSpecies(species: ParticleSpecies): SpeciesProperties {
  const e = PhysicalConstants.e;
  switch (species) {
    case 'alpha':
      return { species, charge: 2 * e, mass: PhysicalConstants.mAlpha, label: 'α (³He⁴²+)' };
    case 'proton':
      return { species, charge: e, mass: PhysicalConstants.mProton, label: 'p (H¹+)' };
    case 'deuteron':
      return { species, charge: e, mass: PhysicalConstants.mDeuteron, label: 'D (H²+)' };
    case 'he3':
      return { species, charge: 2 * e, mass: PhysicalConstants.mHelium3, label: '³He²+' };
    case 'boron11':
      return { species, charge: 5 * e, mass: PhysicalConstants.mBoron11, label: '¹¹B⁵+' };
    case 'electron':
      return { species, charge: -e, mass: 9.1093837015e-31, label: 'e⁻' };
  }
}

export function kineticEnergy(mass: number, vel: Vec3): number {
  return 0.5 * mass * vMag2(vel);
}

export function relativisticGamma(vel: Vec3): number {
  const c = PhysicalConstants.c;
  const beta2 = vMag2(vel) / (c * c);
  if (beta2 >= 1) return 1e6;
  return 1 / Math.sqrt(1 - beta2);
}

export function relativisticEnergy(mass: number, vel: Vec3): number {
  const c = PhysicalConstants.c;
  const gamma = relativisticGamma(vel);
  return (gamma - 1) * mass * c * c;
}

export function energyToVelocity(mass: number, energyJ: number, relativistic: boolean): number {
  const c = PhysicalConstants.c;
  if (relativistic) {
    const gamma = 1 + energyJ / (mass * c * c);
    return c * Math.sqrt(1 - 1 / (gamma * gamma));
  }
  return Math.sqrt((2 * energyJ) / mass);
}