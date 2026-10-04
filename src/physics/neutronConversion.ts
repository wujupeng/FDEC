export interface NeutronConversionResult {
  pCaptured: number;
  pTransferred: number;
  pElectric: number;
  pLost: number;
  overallEfficiency: number;
}

export function computeNeutronConversion(
  pNeutron: number,
  etaCapture: number,
  etaTransfer: number,
  etaDec: number
): NeutronConversionResult {
  const pCaptured = pNeutron * etaCapture;
  const pTransferred = pCaptured * etaTransfer;
  const pElectric = pTransferred * etaDec;
  const pLost = pNeutron - pElectric;
  const overallEfficiency = etaCapture * etaTransfer * etaDec;

  return { pCaptured, pTransferred, pElectric, pLost, overallEfficiency };
}