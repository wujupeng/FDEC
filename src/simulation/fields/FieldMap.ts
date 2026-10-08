import { Vec3, EField, BField, vMag } from '../core';

export interface FieldSample {
  pos: Vec3;
  E: Vec3;
  B: Vec3;
  eMag: number;
  bMag: number;
}

export interface FieldMapConfig {
  xRange: [number, number];
  yRange: [number, number];
  zRange: [number, number];
  resolution: number;
}

export function sampleFieldLine(
  eField: EField,
  bField: BField,
  axis: 'x' | 'y' | 'z',
  range: [number, number],
  resolution: number,
  fixedPos: Vec3
): FieldSample[] {
  const samples: FieldSample[] = [];
  const [min, max] = range;
  const count = Math.max(2, resolution);

  for (let i = 0; i <= count; i++) {
    const t = min + (max - min) * (i / count);
    const pos = { ...fixedPos, [axis]: t };
    const E = eField.E(pos);
    const B = bField.B(pos);
    samples.push({
      pos,
      E,
      B,
      eMag: vMag(E),
      bMag: vMag(B),
    });
  }
  return samples;
}

export function sampleFieldCrossSection(
  eField: EField,
  bField: BField,
  axes: ['x' | 'y' | 'z', 'x' | 'y' | 'z'],
  ranges: [[number, number], [number, number]],
  resolution: number,
  fixedValue: number
): FieldSample[][] {
  const [ax1, ax2] = axes;
  const [r1, r2] = ranges;
  const count = Math.max(2, resolution);
  const grid: FieldSample[][] = [];

  for (let i = 0; i <= count; i++) {
    const row: FieldSample[] = [];
    const v1 = r1[0] + (r1[1] - r1[0]) * (i / count);
    for (let j = 0; j <= count; j++) {
      const v2 = r2[0] + (r2[1] - r2[0]) * (j / count);
      const pos: Vec3 = { x: 0, y: 0, z: 0 };
      pos[ax1] = v1;
      pos[ax2] = v2;
      const otherAxis = (['x', 'y', 'z'] as const).find(a => a !== ax1 && a !== ax2)!;
      pos[otherAxis] = fixedValue;

      const E = eField.E(pos);
      const B = bField.B(pos);
      row.push({ pos, E, B, eMag: vMag(E), bMag: vMag(B) });
    }
    grid.push(row);
  }
  return grid;
}