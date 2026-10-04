import { PhysicalConstants, AlphaCharge, UnitFactors, FusionEnergies } from './constants';

export interface LarmorResult {
  velocity: number;
  beta: number;
  larmorRadius: number;
  cyclotronFreq: number;
  cyclotronPeriod: number;
  isNonRelativistic: boolean;
}

export function computeAlphaOrbit(bField: number): LarmorResult {
  const E = FusionEnergies.DT.alpha * UnitFactors.MeV;
  const m = PhysicalConstants.mAlpha;
  const q = AlphaCharge;
  const c = PhysicalConstants.c;

  const velocity = Math.sqrt((2 * E) / m);
  const beta = velocity / c;
  const larmorRadius = (m * velocity) / (q * bField);
  const cyclotronFreq = (q * bField) / (2 * Math.PI * m);
  const cyclotronPeriod = 1 / cyclotronFreq;
  const isNonRelativistic = beta < 0.1;

  return {
    velocity,
    beta,
    larmorRadius,
    cyclotronFreq,
    cyclotronPeriod,
    isNonRelativistic,
  };
}

export function sweepMagneticField(
  bs: number[] = [1, 2, 5, 10, 20, 50]
): { b: number; radius: number; freq: number }[] {
  return bs.map((b) => {
    const r = computeAlphaOrbit(b);
    return { b, radius: r.larmorRadius, freq: r.cyclotronFreq };
  });
}