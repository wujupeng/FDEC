import { Vec3, EField, vecZero } from '../core';

export type EFieldType = 'none' | 'uniform' | 'parallelPlate' | 'coaxial';

export interface UniformEConfig {
  field: Vec3;
}

export function createUniformE(config: UniformEConfig): EField {
  return {
    E: () => ({ ...config.field }),
    potential: (pos: Vec3) => -(config.field.x * pos.x + config.field.y * pos.y + config.field.z * pos.z),
  };
}

export interface ParallelPlateConfig {
  voltage: number;
  gap: number;
  zStart: number;
}

export function createParallelPlateE(config: ParallelPlateConfig): EField {
  const E0 = config.voltage / config.gap;
  return {
    E: (pos: Vec3) => {
      if (pos.z >= config.zStart && pos.z <= config.zStart + config.gap) {
        return { x: 0, y: 0, z: -E0 };
      }
      return vecZero();
    },
    potential: (pos: Vec3) => {
      if (pos.z < config.zStart) return config.voltage;
      if (pos.z > config.zStart + config.gap) return 0;
      return config.voltage * (1 - (pos.z - config.zStart) / config.gap);
    },
  };
}

export interface CoaxialEConfig {
  voltage: number;
  innerRadius: number;
  outerRadius: number;
  axis: 'z' | 'x';
  center: Vec3;
}

export function createCoaxialE(config: CoaxialEConfig): EField {
  const { voltage, innerRadius: a, outerRadius: b, axis, center } = config;
  const lnRatio = Math.log(b / a);

  return {
    E: (pos: Vec3) => {
      let r: number;
      let dir: Vec3;
      if (axis === 'z') {
        const dx = pos.x - center.x;
        const dy = pos.y - center.y;
        r = Math.sqrt(dx * dx + dy * dy);
        dir = r > 0 ? { x: dx / r, y: dy / r, z: 0 } : vecZero();
      } else {
        const dy = pos.y - center.y;
        const dz = pos.z - center.z;
        r = Math.sqrt(dy * dy + dz * dz);
        dir = r > 0 ? { x: 0, y: dy / r, z: dz / r } : vecZero();
      }
      if (r < a || r > b) return vecZero();
      const Er = voltage / (r * lnRatio);
      return { x: Er * dir.x, y: Er * dir.y, z: Er * dir.z };
    },
    potential: (pos: Vec3) => {
      let r: number;
      if (axis === 'z') {
        r = Math.sqrt((pos.x - center.x) ** 2 + (pos.y - center.y) ** 2);
      } else {
        r = Math.sqrt((pos.y - center.y) ** 2 + (pos.z - center.z) ** 2);
      }
      if (r < a) return voltage;
      if (r > b) return 0;
      return voltage * Math.log(b / r) / lnRatio;
    },
  };
}

export function createNoE(): EField {
  return { E: () => vecZero(), potential: () => 0 };
}