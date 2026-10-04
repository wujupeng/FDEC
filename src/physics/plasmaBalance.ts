import type { FusionReaction } from '../fuels/reactionTypes';
import { UnitFactors, PhysicalConstants } from './constants';

export interface PlasmaBalanceResult {
  pAlphaHeating: number;
  pRadiationBremsstrahlung: number;
  pRadiationSynchrotron: number;
  pTransport: number;
  pConduction: number;
  pTotalLoss: number;
  pExternalRequired: number;
  selfSustained: boolean;
  margin: number;
  qFactor: number;
  tripleProduct: number;
  ignitionMargin: number;
}

export interface PlasmaBalanceInput {
  reaction: FusionReaction;
  fusionPower: number;
  fAlphaExtract: number;
  temperatureKeV: number;
  densityM3: number;
  energyConfinementTime: number;
  bField: number;
}

function bremsstrahlungPower(
  density: number,
  temperatureKeV: number,
  zEff: number,
  volume: number
): number {
  const Te = temperatureKeV * 1e3 * PhysicalConstants.e;
  const coeff = 1.69e-38;
  return coeff * zEff * density * density * Math.sqrt(Te) * volume;
}

function synchrotronPower(
  density: number,
  temperatureKeV: number,
  bField: number,
  volume: number
): number {
  const Te = temperatureKeV * 1e3 * PhysicalConstants.e;
  const meC2 = 0.511e6 * PhysicalConstants.e;
  const coeff = 6.21e-17;
  return coeff * density * Te * Math.pow(bField, 2) * (Te / meC2) * volume;
}

export function computePlasmaBalance(input: PlasmaBalanceInput): PlasmaBalanceResult {
  const {
    reaction,
    fusionPower,
    fAlphaExtract,
    temperatureKeV,
    densityM3,
    energyConfinementTime,
    bField,
  } = input;

  const pAlphaHeating = fusionPower * reaction.chargedEnergyFraction * (1 - fAlphaExtract);

  const EfJ = reaction.totalEnergyMeV * UnitFactors.MeV;
  const reactionRate = fusionPower / EfJ;
  const volume = reactionRate > 0 && densityM3 > 0
    ? fusionPower / (densityM3 * densityM3 * energyConfinementTime * EfJ * 1e-22)
    : 1;

  const zEff = reaction.key === 'PB11' ? 5 : reaction.key === 'DHe3' ? 2.5 : 1.5;
  const pBrem = bremsstrahlungPower(densityM3, temperatureKeV, zEff, volume);
  const pSync = synchrotronPower(densityM3, temperatureKeV, bField, volume);

  const pTransport = fusionPower * 0.05;
  const pConduction = fusionPower * 0.02;

  const pTotalLoss = pBrem + pSync + pTransport + pConduction;
  const pExternalRequired = Math.max(0, pTotalLoss - pAlphaHeating);
  const margin = pAlphaHeating - pTotalLoss;
  const selfSustained = margin >= 0;

  const qFactor = pTotalLoss > 0 ? pAlphaHeating / pTotalLoss : Infinity;

  const tripleProduct = densityM3 * temperatureKeV * energyConfinementTime;

  const ignitionMargin = (temperatureKeV - reaction.ignitionTemperatureKeV) / reaction.ignitionTemperatureKeV;

  return {
    pAlphaHeating,
    pRadiationBremsstrahlung: pBrem,
    pRadiationSynchrotron: pSync,
    pTransport,
    pConduction,
    pTotalLoss,
    pExternalRequired,
    selfSustained,
    margin,
    qFactor,
    tripleProduct,
    ignitionMargin,
  };
}