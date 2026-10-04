import type { FusionReaction, ParticleType } from '../fuels/reactionTypes';
import { ParticleDatabase } from '../fuels/reactionTypes';
import { UnitFactors, PhysicalConstants } from './constants';

export interface ExhaustConfig {
  coreRadius: number;
  exhaustLength: number;
  exhaustHalfAngle: number;
  converterRadius: number;
  converterDistance: number;
}

export interface ParticleTransportResult {
  particle: ParticleType;
  name: string;
  isCharged: boolean;
  productionRate: number;
  escapeFraction: number;
  captureFraction: number;
  conversionFraction: number;
  powerAtConverter: number;
  powerElectric: number;
}

export interface ExhaustResult {
  particles: ParticleTransportResult[];
  totalCaptureEfficiency: number;
  totalEscapeFraction: number;
  totalPowerAtConverter: number;
  totalPowerElectric: number;
  geometryFactor: number;
}

export function computeExhaust(
  reaction: FusionReaction,
  fusionPower: number,
  config: ExhaustConfig,
  etaDec: number,
  etaNeutronCapture: number,
  etaNeutronConversion: number
): ExhaustResult {
  const EfJ = reaction.totalEnergyMeV * UnitFactors.MeV;
  const rate = fusionPower / EfJ;

  const solidAngleFraction = 0.5 * (1 - Math.cos(config.exhaustHalfAngle * Math.PI / 180));
  const converterArea = Math.PI * config.converterRadius * config.converterRadius;

  const geometryFactor = Math.min(1, converterArea / (4 * Math.PI * config.converterDistance * config.converterDistance));

  const particles: ParticleTransportResult[] = [];

  for (const prod of reaction.products) {
    const info = ParticleDatabase[prod.particle];
    const prodRate = rate;
    const energyJ = prod.energyMeV * 1e6 * PhysicalConstants.e;

    let escapeFraction: number;
    let captureFraction: number;
    let conversionFraction: number;

    if (info.isCharged) {
      escapeFraction = solidAngleFraction;
      captureFraction = (1 - escapeFraction) * geometryFactor;
      conversionFraction = captureFraction * etaDec;
    } else {
      escapeFraction = 1 - etaNeutronCapture;
      captureFraction = etaNeutronCapture;
      conversionFraction = captureFraction * etaNeutronConversion * etaDec;
    }

    const powerAtConverter = prodRate * captureFraction * energyJ;
    const powerElectric = prodRate * conversionFraction * energyJ;

    particles.push({
      particle: prod.particle,
      name: info.name,
      isCharged: info.isCharged,
      productionRate: prodRate,
      escapeFraction,
      captureFraction,
      conversionFraction,
      powerAtConverter,
      powerElectric,
    });
  }

  const totalPowerAtConverter = particles.reduce((s, p) => s + p.powerAtConverter, 0);
  const totalPowerElectric = particles.reduce((s, p) => s + p.powerElectric, 0);
  const totalCaptureEfficiency = fusionPower > 0 ? totalPowerAtConverter / fusionPower : 0;
  const totalEscapeFraction = particles.reduce((s, p) => s + p.escapeFraction, 0) / particles.length;

  return {
    particles,
    totalCaptureEfficiency,
    totalEscapeFraction,
    totalPowerAtConverter,
    totalPowerElectric,
    geometryFactor,
  };
}

export function sweepExhaustDistance(
  reaction: FusionReaction,
  fusionPower: number,
  distances: number[],
  baseConfig: ExhaustConfig,
  etaDec: number,
  etaNeutronCapture: number,
  etaNeutronConversion: number
): { distance: number; efficiency: number; power: number }[] {
  return distances.map((d) => {
    const config = { ...baseConfig, converterDistance: d };
    const result = computeExhaust(reaction, fusionPower, config, etaDec, etaNeutronCapture, etaNeutronConversion);
    return {
      distance: d,
      efficiency: result.totalCaptureEfficiency,
      power: result.totalPowerElectric,
    };
  });
}