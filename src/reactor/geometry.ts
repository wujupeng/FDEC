export type ReactorType = 'tokamak' | 'linear' | 'mirror' | 'frc';

export interface ReactorGeometry {
  type: ReactorType;
  name: string;
  coreRadius: number;
  coreLength: number;
  exhaustLength: number;
  exhaustHalfAngle: number;
  converterRadius: number;
  converterDistance: number;
  bFieldCore: number;
  bFieldExhaust: number;
  volume: number;
  surfaceArea: number;
  description: string;
}

export const ReactorGeometries: ReactorGeometry[] = [
  {
    type: 'tokamak',
    name: '托卡马克',
    coreRadius: 2.0,
    coreLength: 12.0,
    exhaustLength: 3.0,
    exhaustHalfAngle: 10,
    converterRadius: 1.5,
    converterDistance: 5.0,
    bFieldCore: 5.0,
    bFieldExhaust: 8.0,
    volume: Math.PI * 2.0 * 2.0 * 12.0,
    surfaceArea: 2 * Math.PI * 2.0 * 12.0 + 2 * Math.PI * 2.0 * 2.0,
    description: '环形约束，磁场强，但粒子引出困难，需偏滤器+排气通道',
  },
  {
    type: 'linear',
    name: '直线型',
    coreRadius: 0.5,
    coreLength: 8.0,
    exhaustLength: 4.0,
    exhaustHalfAngle: 20,
    converterRadius: 1.0,
    converterDistance: 4.0,
    bFieldCore: 3.0,
    bFieldExhaust: 6.0,
    volume: Math.PI * 0.5 * 0.5 * 8.0,
    surfaceArea: 2 * Math.PI * 0.5 * 8.0 + 2 * Math.PI * 0.5 * 0.5,
    description: '两端开放，粒子自然沿轴向排出，最适合直接能量转换',
  },
  {
    type: 'mirror',
    name: '磁镜',
    coreRadius: 0.8,
    coreLength: 6.0,
    exhaustLength: 3.0,
    exhaustHalfAngle: 15,
    converterRadius: 1.2,
    converterDistance: 4.5,
    bFieldCore: 4.0,
    bFieldExhaust: 10.0,
    volume: Math.PI * 0.8 * 0.8 * 6.0,
    surfaceArea: 2 * Math.PI * 0.8 * 6.0 + 2 * Math.PI * 0.8 * 0.8,
    description: '两端高磁场形成磁镜，损失锥粒子逃逸至转换器',
  },
  {
    type: 'frc',
    name: 'FRC',
    coreRadius: 1.0,
    coreLength: 5.0,
    exhaustLength: 2.5,
    exhaustHalfAngle: 25,
    converterRadius: 1.5,
    converterDistance: 3.5,
    bFieldCore: 2.0,
    bFieldExhaust: 5.0,
    volume: Math.PI * 1.0 * 1.0 * 5.0,
    surfaceArea: 2 * Math.PI * 1.0 * 5.0 + 2 * Math.PI * 1.0 * 1.0,
    description: '场反位形，自然两端开放，粒子排出效率高',
  },
];

export function getGeometry(type: ReactorType): ReactorGeometry {
  return ReactorGeometries.find((g) => g.type === type) ?? ReactorGeometries[0];
}