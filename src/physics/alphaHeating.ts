export interface AlphaHeatingResult {
  pAlphaExtract: number;
  pAlphaHeat: number;
  pExternal: number;
  isSelfSustained: boolean;
  fMax: number;
  heatingCoverage: number;
}

export function computeAlphaHeating(
  pAlpha: number,
  fAlpha: number,
  pRequired: number
): AlphaHeatingResult {
  const pAlphaExtract = pAlpha * fAlpha;
  const pAlphaHeat = pAlpha * (1 - fAlpha);
  const pExternal = Math.max(0, pRequired - pAlphaHeat);
  const isSelfSustained = pAlphaHeat >= pRequired;
  const fMax = 1 - pRequired / pAlpha;
  const heatingCoverage = pRequired > 0 ? pAlphaHeat / pRequired : Infinity;

  return {
    pAlphaExtract,
    pAlphaHeat,
    pExternal,
    isSelfSustained,
    fMax,
    heatingCoverage,
  };
}

export function sweepExtractionRate(
  pAlpha: number,
  pRequired: number,
  fs: number[] = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0]
): { fAlpha: number; extract: number; heat: number; external: number; sustained: boolean }[] {
  return fs.map((f) => {
    const r = computeAlphaHeating(pAlpha, f, pRequired);
    return {
      fAlpha: f,
      extract: r.pAlphaExtract,
      heat: r.pAlphaHeat,
      external: r.pExternal,
      sustained: r.isSelfSustained,
    };
  });
}