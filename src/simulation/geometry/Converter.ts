import { Vec3 } from '../core';

export interface ConverterConfig {
  innerRadius: number;
  outerRadius: number;
  zPosition: number;
  thickness: number;
  axis: 'z' | 'x';
}

export class Converter {
  innerRadius: number;
  outerRadius: number;
  zPosition: number;
  thickness: number;
  axis: 'z' | 'x';

  constructor(config: ConverterConfig) {
    this.innerRadius = config.innerRadius;
    this.outerRadius = config.outerRadius;
    this.zPosition = config.zPosition;
    this.thickness = config.thickness;
    this.axis = config.axis;
  }

  contains(pos: Vec3): boolean {
    let r: number;
    let axial: number;
    if (this.axis === 'z') {
      r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      axial = pos.z;
    } else {
      r = Math.sqrt(pos.y * pos.y + pos.z * pos.z);
      axial = pos.x;
    }
    const inRadial = r >= this.innerRadius && r <= this.outerRadius;
    const inAxial = axial >= this.zPosition - this.thickness / 2 && axial <= this.zPosition + this.thickness / 2;
    return inRadial && inAxial;
  }

  crossed(posPrev: Vec3, posCurr: Vec3): boolean {
    return !this.contains(posPrev) && this.contains(posCurr);
  }
}