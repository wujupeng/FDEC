import { FusionEnergies, UnitFactors, AlphaCharge } from './constants';

export interface FusionSourceResult {
  fusionPower: number;
  reactionRate: number;
  alphaRate: number;
  neutronRate: number;
  alphaPower: number;
  neutronPower: number;
  alphaFraction: number;
  neutronFraction: number;
}

export interface AlphaElectricalResult {
  alphaCurrent: number;
  alphaVoltage: number;
  idealDecPower: number;
  powerCheck: number;
}

export function computeFusionSource(fusionPower: number): FusionSourceResult {
  const EfJ = FusionEnergies.DT.total * UnitFactors.MeV;
  const reactionRate = fusionPower / EfJ;
  const alphaFraction = FusionEnergies.DT.alpha / FusionEnergies.DT.total;
  const neutronFraction = FusionEnergies.DT.neutron / FusionEnergies.DT.total;

  return {
    fusionPower,
    reactionRate,
    alphaRate: reactionRate,
    neutronRate: reactionRate,
    alphaPower: fusionPower * alphaFraction,
    neutronPower: fusionPower * neutronFraction,
    alphaFraction,
    neutronFraction,
  };
}

export function computeAlphaElectrical(fusionPower: number): AlphaElectricalResult {
  const source = computeFusionSource(fusionPower);
  const alphaCurrent = source.alphaRate * AlphaCharge;
  const alphaVoltage =
    (FusionEnergies.DT.alpha * UnitFactors.MeV) / AlphaCharge;
  const idealDecPower = source.alphaPower;
  const powerCheck = alphaCurrent * alphaVoltage;

  return {
    alphaCurrent,
    alphaVoltage,
    idealDecPower,
    powerCheck,
  };
}

export function alphaElectricPower(fusionPower: number, etaAlpha: number): number {
  return computeFusionSource(fusionPower).alphaPower * etaAlpha;
}

export function efficiencySweep(
  fusionPower: number,
  etas: number[] = [0.1, 0.3, 0.5, 0.7, 0.9, 1.0]
): { eta: number; power: number }[] {
  return etas.map((eta) => ({ eta, power: alphaElectricPower(fusionPower, eta) }));
}