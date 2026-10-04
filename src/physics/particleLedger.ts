import type { FusionReaction, ParticleType } from '../fuels/reactionTypes';
import { ParticleDatabase } from '../fuels/reactionTypes';
import { UnitFactors, PhysicalConstants } from './constants';

export interface ParticleLedgerEntry {
  particle: ParticleType;
  name: string;
  symbol: string;
  isCharged: boolean;
  productionRate: number;
  captureRate: number;
  escapeRate: number;
  conversionRate: number;
  depositedRate: number;
  energyPerParticleMeV: number;
  powerProduced: number;
  powerCaptured: number;
  powerElectric: number;
}

export interface ParticleLedgerInput {
  reaction: FusionReaction;
  fusionPower: number;
  fAlphaExtract: number;
  etaAlphaCapture: number;
  etaAlphaDec: number;
  etaNeutronCapture: number;
  etaNeutronConversion: number;
  etaNeutronDec: number;
}

export interface ParticleLedgerResult {
  fuel: string;
  fusionPower: number;
  reactionRate: number;
  entries: ParticleLedgerEntry[];
  totalProductionRate: number;
  totalCaptureRate: number;
  totalEscapeRate: number;
  totalConversionRate: number;
  chargeConservationError: number;
  isChargeConserved: boolean;
}

export function computeParticleLedger(input: ParticleLedgerInput): ParticleLedgerResult {
  const {
    reaction,
    fusionPower,
    fAlphaExtract,
    etaAlphaCapture,
    etaAlphaDec,
    etaNeutronCapture,
    etaNeutronConversion,
    etaNeutronDec,
  } = input;

  const EfJ = reaction.totalEnergyMeV * UnitFactors.MeV;
  const rate = fusionPower / EfJ;

  const particleMap = new Map<ParticleType, {
    productionRate: number;
    energyMeV: number;
    isCharged: boolean;
  }>();

  for (const prod of reaction.products) {
    const info = ParticleDatabase[prod.particle];
    const existing = particleMap.get(prod.particle);
    const prodRate = rate * (prod.energyFraction > 0 ? 1 : 0);
    if (existing) {
      existing.productionRate += prodRate;
      existing.energyMeV += prod.energyMeV;
    } else {
      particleMap.set(prod.particle, {
        productionRate: prodRate,
        energyMeV: prod.energyMeV,
        isCharged: info.isCharged,
      });
    }
  }

  for (const side of reaction.sideReactions) {
    const sideRate = rate * side.probability;
    for (const prod of side.products) {
      const info = ParticleDatabase[prod.particle];
      const existing = particleMap.get(prod.particle);
      if (existing) {
        existing.productionRate += sideRate;
        existing.energyMeV += prod.energyMeV;
      } else {
        particleMap.set(prod.particle, {
          productionRate: sideRate,
          energyMeV: prod.energyMeV,
          isCharged: info.isCharged,
        });
      }
    }
  }

  const entries: ParticleLedgerEntry[] = [];

  for (const [particleType, data] of particleMap) {
    const info = ParticleDatabase[particleType];
    const productionRate = data.productionRate;
    const powerProduced = productionRate * data.energyMeV * UnitFactors.MeV;

    let captureRate: number;
    let escapeRate: number;
    let conversionRate: number;
    let depositedRate: number;
    let powerCaptured: number;
    let powerElectric: number;

    if (info.isCharged) {
      captureRate = productionRate * fAlphaExtract * etaAlphaCapture;
      escapeRate = productionRate * fAlphaExtract * (1 - etaAlphaCapture);
      const heatingRate = productionRate * (1 - fAlphaExtract);
      conversionRate = captureRate * etaAlphaDec;
      depositedRate = captureRate * (1 - etaAlphaDec) + heatingRate;
      powerCaptured = captureRate * data.energyMeV * UnitFactors.MeV;
      powerElectric = conversionRate * data.energyMeV * UnitFactors.MeV;
    } else {
      captureRate = productionRate * etaNeutronCapture;
      escapeRate = productionRate * (1 - etaNeutronCapture);
      conversionRate = captureRate * etaNeutronConversion * etaNeutronDec;
      depositedRate = captureRate * etaNeutronConversion * (1 - etaNeutronDec) + captureRate * (1 - etaNeutronConversion);
      powerCaptured = captureRate * data.energyMeV * UnitFactors.MeV;
      powerElectric = conversionRate * data.energyMeV * UnitFactors.MeV;
    }

    entries.push({
      particle: particleType,
      name: info.name,
      symbol: info.symbol,
      isCharged: info.isCharged,
      productionRate,
      captureRate,
      escapeRate,
      conversionRate,
      depositedRate,
      energyPerParticleMeV: data.energyMeV,
      powerProduced,
      powerCaptured,
      powerElectric,
    });
  }

  const totalProductionRate = entries.reduce((s, e) => s + e.productionRate, 0);
  const totalCaptureRate = entries.reduce((s, e) => s + e.captureRate, 0);
  const totalEscapeRate = entries.reduce((s, e) => s + e.escapeRate, 0);
  const totalConversionRate = entries.reduce((s, e) => s + e.conversionRate, 0);

  const totalChargeIn = entries.reduce((s, e) => s + e.productionRate * ParticleDatabase[e.particle].charge * PhysicalConstants.e, 0);
  const totalChargeOut = entries.reduce((s, e) => s + e.conversionRate * ParticleDatabase[e.particle].charge * PhysicalConstants.e, 0);
  const chargeConservationError = Math.abs(totalChargeIn - totalChargeOut) / (Math.abs(totalChargeIn) + 1e-30);

  return {
    fuel: reaction.fuel,
    fusionPower,
    reactionRate: rate,
    entries: entries.sort((a, b) => b.powerProduced - a.powerProduced),
    totalProductionRate,
    totalCaptureRate,
    totalEscapeRate,
    totalConversionRate,
    chargeConservationError,
    isChargeConserved: chargeConservationError < 0.01,
  };
}