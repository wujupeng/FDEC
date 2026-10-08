import { Vec3, BField, vecZero } from '../core';

export type BFieldType = 'none' | 'uniform' | 'nozzle';

export interface UniformBConfig {
  field: Vec3;
}

export function createUniformB(config: UniformBConfig): BField {
  return { B: () => ({ ...config.field }) };
}

export function createNoB(): BField {
  return { B: () => vecZero() };
}

export interface NozzleBConfig {
  B0: number;
  zCenter: number;
  width: number;
  expansionRatio: number;
}

export function createNozzleB(config: NozzleBConfig): BField {
  const { B0, zCenter, width, expansionRatio } = config;

  return {
    B: (pos: Vec3) => {
      const dz = pos.z - zCenter;
      const f = 1 + (expansionRatio - 1) * 0.5 * (1 + Math.tanh(dz / width));
      const Bz = B0 / f;

      const dfDz = (expansionRatio - 1) * 0.5 * (1 / width) * (1 - Math.tanh(dz / width) ** 2);
      const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      const Br = r > 0 ? -0.5 * B0 * dfDz * r / (f * f) : 0;

      if (r > 0) {
        return {
          x: Br * pos.x / r,
          y: Br * pos.y / r,
          z: Bz,
        };
      }
      return { x: 0, y: 0, z: Bz };
    },
  };
}