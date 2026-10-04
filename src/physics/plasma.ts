export interface PlasmaConfinementResult {
  mFactor: number;
  margin: number;
  isSelfSustained: boolean;
  isCritical: boolean;
  status: 'surplus' | 'critical' | 'unsustained';
  fMaxExtract: number;
}

export function computePlasmaConfinement(
  pAlphaHeat: number,
  pExternal: number,
  pLoss: number
): PlasmaConfinementResult {
  const mFactor = pLoss > 0 ? (pAlphaHeat + pExternal) / pLoss : Infinity;
  const margin = pAlphaHeat + pExternal - pLoss;
  const isSelfSustained = mFactor >= 1;
  const isCritical = Math.abs(mFactor - 1) < 0.02;
  const status: PlasmaConfinementResult['status'] = isCritical
    ? 'critical'
    : mFactor > 1
      ? 'surplus'
      : 'unsustained';

  return { mFactor, margin, isSelfSustained, isCritical, status, fMaxExtract: 0 };
}

export function maxExtractionRate(pAlpha: number, pLoss: number): number {
  if (pAlpha <= 0) return 0;
  return Math.max(0, 1 - pLoss / pAlpha);
}

export function sweepExtractionVsSustain(
  pAlpha: number,
  pLoss: number,
  etaDec: number,
  fs: number[] = [0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0]
): {
  fExtract: number;
  pDec: number;
  pHeat: number;
  mFactor: number;
  sustained: boolean;
  netDec: number;
}[] {
  return fs.map((f) => {
    const pHeat = pAlpha * (1 - f);
    const pDec = pAlpha * f * etaDec;
    const m = pLoss > 0 ? pHeat / pLoss : Infinity;
    return {
      fExtract: f,
      pDec,
      pHeat,
      mFactor: m,
      sustained: m >= 1,
      netDec: pDec,
    };
  });
}