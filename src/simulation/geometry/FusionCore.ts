import { Vec3 } from '../core';

export interface FusionCoreConfig {
  radius: number;
  length: number;
  center: Vec3;
}

export class FusionCore {
  radius: number;
  length: number;
  center: Vec3;

  constructor(config: FusionCoreConfig) {
    this.radius = config.radius;
    this.length = config.length;
    this.center = config.center;
  }

  contains(pos: Vec3): boolean {
    const r = Math.sqrt((pos.x - this.center.x) ** 2 + (pos.y - this.center.y) ** 2);
    const dz = Math.abs(pos.z - this.center.z);
    return r <= this.radius && dz <= this.length / 2;
  }

  surfaceArea(): number {
    return 2 * Math.PI * this.radius * this.length + 2 * Math.PI * this.radius * this.radius;
  }

  volume(): number {
    return Math.PI * this.radius * this.radius * this.length;
  }
}