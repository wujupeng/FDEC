import { PhysicalConstants, AlphaCharge } from './constants';
import { childLangmuirCurrentDensity } from './childLangmuir';

export interface SpaceChargeRatioResult {
  jRequired: number;
  jCl: number;
  rSc: number;
  status: 'safe' | 'marginal' | 'limited';
}

export function computeSpaceChargeRatio(
  requiredCurrent: number,
  collectionArea: number,
  voltage: number,
  gapDistance: number
): SpaceChargeRatioResult {
  const jRequired = collectionArea > 0 ? requiredCurrent / collectionArea : Infinity;
  const jCl = childLangmuirCurrentDensity(voltage, gapDistance, AlphaCharge, PhysicalConstants.mAlpha);
  const rSc = jCl > 0 ? jRequired / jCl : Infinity;
  const status: SpaceChargeRatioResult['status'] =
    rSc < 0.5 ? 'safe' : rSc < 1 ? 'marginal' : 'limited';
  return { jRequired, jCl, rSc, status };
}

export interface OperatingMapPoint {
  voltage: number;
  gap: number;
  rSc: number;
  eField: number;
  safe: boolean;
}

export function sweepOperatingMap(
  voltages: number[],
  gaps: number[],
  requiredCurrent: number,
  collectionArea: number
): OperatingMapPoint[] {
  const points: OperatingMapPoint[] = [];
  for (const v of voltages) {
    for (const d of gaps) {
      const r = computeSpaceChargeRatio(requiredCurrent, collectionArea, v, d);
      points.push({
        voltage: v,
        gap: d,
        rSc: r.rSc,
        eField: v / d,
        safe: r.rSc < 1,
      });
    }
  }
  return points;
}

export function findOperatingBoundary(
  voltages: number[],
  gaps: number[],
  requiredCurrent: number,
  collectionArea: number
): { voltage: number; gapBoundary: number }[] {
  const boundaries: { voltage: number; gapBoundary: number }[] = [];
  for (const v of voltages) {
    let prevSafe = false;
    let boundary = NaN;
    for (const d of gaps) {
      const r = computeSpaceChargeRatio(requiredCurrent, collectionArea, v, d);
      if (prevSafe && r.rSc >= 1) {
        boundary = d;
        break;
      }
      prevSafe = r.rSc < 1;
    }
    if (!isNaN(boundary)) boundaries.push({ voltage: v, gapBoundary: boundary });
  }
  return boundaries;
}