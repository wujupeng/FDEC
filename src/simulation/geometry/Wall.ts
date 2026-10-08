import { Vec3 } from '../core';

export interface WallConfig {
  radius: number;
  zMin: number;
  zMax: number;
  axis: 'z' | 'x';
}

export class Wall {
  radius: number;
  zMin: number;
  zMax: number;
  axis: 'z' | 'x';

  constructor(config: WallConfig) {
    this.radius = config.radius;
    this.zMin = config.zMin;
    this.zMax = config.zMax;
    this.axis = config.axis;
  }

  isHit(pos: Vec3): boolean {
    let r: number;
    let axial: number;
    if (this.axis === 'z') {
      r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      axial = pos.z;
    } else {
      r = Math.sqrt(pos.y * pos.y + pos.z * pos.z);
      axial = pos.x;
    }
    return r >= this.radius && axial >= this.zMin && axial <= this.zMax;
  }

  crossed(posPrev: Vec3, posCurr: Vec3): boolean {
    return !this.isHit(posPrev) && this.isHit(posCurr);
  }

  hitPosition(posPrev: Vec3, posCurr: Vec3): Vec3 {
    const t = this.estimateCrossingT(posPrev, posCurr);
    return {
      x: posPrev.x + t * (posCurr.x - posPrev.x),
      y: posPrev.y + t * (posCurr.y - posPrev.y),
      z: posPrev.z + t * (posCurr.z - posPrev.z),
    };
  }

  private estimateCrossingT(posPrev: Vec3, posCurr: Vec3): number {
    let rPrev: number, rCurr: number;
    if (this.axis === 'z') {
      rPrev = Math.sqrt(posPrev.x * posPrev.x + posPrev.y * posPrev.y);
      rCurr = Math.sqrt(posCurr.x * posCurr.x + posCurr.y * posCurr.y);
    } else {
      rPrev = Math.sqrt(posPrev.y * posPrev.y + posPrev.z * posPrev.z);
      rCurr = Math.sqrt(posCurr.y * posCurr.y + posCurr.z * posCurr.z);
    }
    if (rCurr === rPrev) return 0;
    return (this.radius - rPrev) / (rCurr - rPrev);
  }
}