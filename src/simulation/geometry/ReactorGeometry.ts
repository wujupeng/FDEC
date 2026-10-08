import { Vec3 } from '../core';
import { FusionCore, FusionCoreConfig } from './FusionCore';
import { Converter, ConverterConfig } from './Converter';
import { Wall, WallConfig } from './Wall';

export interface ReactorGeometryConfig {
  core: FusionCoreConfig;
  converter: ConverterConfig;
  wall: WallConfig;
  escapeRadius: number;
  escapeZMax: number;
  escapeZMin: number;
}

export class ReactorGeometry {
  core: FusionCore;
  converter: Converter;
  wall: Wall;
  escapeRadius: number;
  escapeZMax: number;
  escapeZMin: number;

  constructor(config: ReactorGeometryConfig) {
    this.core = new FusionCore(config.core);
    this.converter = new Converter(config.converter);
    this.wall = new Wall(config.wall);
    this.escapeRadius = config.escapeRadius;
    this.escapeZMax = config.escapeZMax;
    this.escapeZMin = config.escapeZMin;
  }

  isEscaped(pos: Vec3): boolean {
    const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    return r > this.escapeRadius || pos.z > this.escapeZMax || pos.z < this.escapeZMin;
  }

  isInside(pos: Vec3): boolean {
    const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    return r <= this.escapeRadius && pos.z <= this.escapeZMax && pos.z >= this.escapeZMin;
  }
}

export function createSimpleGeometry(): ReactorGeometry {
  return new ReactorGeometry({
    core: { radius: 0.05, length: 0.2, center: { x: 0, y: 0, z: 0 } },
    converter: { innerRadius: 0.08, outerRadius: 0.15, zPosition: 0.3, thickness: 0.02, axis: 'z' },
    wall: { radius: 0.2, zMin: -0.3, zMax: 0.5, axis: 'z' },
    escapeRadius: 0.3,
    escapeZMax: 0.6,
    escapeZMin: -0.4,
  });
}