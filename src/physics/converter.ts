export interface DirectConverterResult {
  pAlphaDec: number;
  pNeutronDec: number;
  pSecondary: number;
  pElectric: number;
  alphaFraction: number;
  neutronFraction: number;
}

export function computeDirectConverter(
  pAlphaDec: number,
  pNeutronDec: number,
  pSecondary: number = 0
): DirectConverterResult {
  const pElectric = pAlphaDec + pNeutronDec + pSecondary;
  const alphaFraction = pElectric > 0 ? pAlphaDec / pElectric : 0;
  const neutronFraction = pElectric > 0 ? pNeutronDec / pElectric : 0;

  return { pAlphaDec, pNeutronDec, pSecondary, pElectric, alphaFraction, neutronFraction };
}