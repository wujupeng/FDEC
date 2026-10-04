import { PhysicalConstants, AlphaCharge } from './constants';

export interface ChildLangmuirResult {
  currentDensity: number;
  totalCurrent: number;
  requiredArea: number;
  isLimited: boolean;
}

export function childLangmuirCurrentDensity(
  voltage: number,
  gapDistance: number,
  particleCharge: number = AlphaCharge,
  particleMass: number = PhysicalConstants.mAlpha
): number {
  if (voltage <= 0 || gapDistance <= 0) return 0;
  const { epsilon0 } = PhysicalConstants;
  const J =
    (4 / 9) *
    epsilon0 *
    Math.sqrt((2 * particleCharge) / particleMass) *
    Math.pow(voltage, 1.5) /
    Math.pow(gapDistance, 2);
  return J;
}

export function computeSpaceCharge(
  voltage: number,
  gapDistance: number,
  collectionArea: number,
  requiredCurrent: number
): ChildLangmuirResult {
  const currentDensity = childLangmuirCurrentDensity(voltage, gapDistance);
  const totalCurrent = currentDensity * collectionArea;
  const requiredArea =
    currentDensity > 0 ? requiredCurrent / currentDensity : Infinity;

  return {
    currentDensity,
    totalCurrent,
    requiredArea,
    isLimited: totalCurrent < requiredCurrent,
  };
}

export function sweepGapDistance(
  voltage: number,
  gapDistances: number[],
  requiredCurrent: number
): { gap: number; maxCurrentDensity: number; requiredArea: number }[] {
  return gapDistances.map((gap) => {
    const J = childLangmuirCurrentDensity(voltage, gap);
    return {
      gap,
      maxCurrentDensity: J,
      requiredArea: J > 0 ? requiredCurrent / J : Infinity,
    };
  });
}