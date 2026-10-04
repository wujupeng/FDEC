import type { UncertaintyResult, UncertaintyReport } from './types';
import type { ReactorModelInput } from '../reactor/reactorModel';
import { computeReactorModel } from '../reactor/reactorModel';

export interface UncertaintyRanges {
  etaAlphaCapture: number;
  etaAlphaDec: number;
  etaNeutronCapture: number;
  etaNeutronConversion: number;
  etaNeutronDec: number;
  fAlphaExtract: number;
}

function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function perturb(base: number, relativeUncertainty: number): number {
  return base * (1 + relativeUncertainty * gaussianRandom());
}

function computeStats(values: number[]): { mean: number; std: number; p10: number; p50: number; p90: number; min: number; max: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const p10 = sorted[Math.floor(n * 0.1)];
  const p50 = sorted[Math.floor(n * 0.5)];
  const p90 = sorted[Math.floor(n * 0.9)];
  return { mean, std, p10, p50, p90, min: sorted[0], max: sorted[n - 1] };
}

function makeUncertaintyResult(metric: string, unit: string, values: number[]): UncertaintyResult {
  const stats = computeStats(values);
  return {
    metric,
    unit,
    ...stats,
    samples: values.length,
    uncertaintyPercent: stats.mean !== 0 ? (stats.std / Math.abs(stats.mean)) * 100 : 0,
  };
}

export function runMonteCarlo(
  baseInput: ReactorModelInput,
  ranges: UncertaintyRanges,
  samples: number = 1000
): UncertaintyReport {
  const pNetValues: number[] = [];
  const etaNetValues: number[] = [];
  const erfValues: number[] = [];
  const pGrossValues: number[] = [];
  const decAdvantageValues: number[] = [];
  let viableCount = 0;

  for (let i = 0; i < samples; i++) {
    const perturbedInput: ReactorModelInput = {
      ...baseInput,
      etaAlphaCapture: Math.max(0, Math.min(1, perturb(baseInput.etaAlphaCapture, ranges.etaAlphaCapture))),
      etaAlphaDec: Math.max(0, Math.min(1, perturb(baseInput.etaAlphaDec, ranges.etaAlphaDec))),
      etaNeutronCapture: Math.max(0, Math.min(1, perturb(baseInput.etaNeutronCapture, ranges.etaNeutronCapture))),
      etaNeutronConversion: Math.max(0, Math.min(1, perturb(baseInput.etaNeutronConversion, ranges.etaNeutronConversion))),
      etaNeutronDec: Math.max(0, Math.min(1, perturb(baseInput.etaNeutronDec, ranges.etaNeutronDec))),
      fAlphaExtract: Math.max(0, Math.min(1, perturb(baseInput.fAlphaExtract, ranges.fAlphaExtract))),
    };

    try {
      const result = computeReactorModel(perturbedInput);
      pNetValues.push(result.pNet);
      etaNetValues.push(result.etaNet);
      erfValues.push(result.erf);
      pGrossValues.push(result.energyLedger.pGrossElectric);
      decAdvantageValues.push(result.decAdvantage);
      if (result.isViable) viableCount++;
    } catch {
      pNetValues.push(0);
      etaNetValues.push(0);
      erfValues.push(0);
      pGrossValues.push(0);
      decAdvantageValues.push(0);
    }
  }

  return {
    results: [
      makeUncertaintyResult('P_gross (毛电)', 'MW', pGrossValues.map((v) => v / 1e6)),
      makeUncertaintyResult('ERF (能量回收因子)', '%', erfValues.map((v) => v * 100)),
      makeUncertaintyResult('DEC Advantage', 'MW', decAdvantageValues.map((v) => v / 1e6)),
    ],
    netPowerDist: makeUncertaintyResult('P_net (净电)', 'MW', pNetValues.map((v) => v / 1e6)),
    etaNetDist: makeUncertaintyResult('η_net (净电效率)', '%', etaNetValues.map((v) => v * 100)),
    viableFraction: viableCount / samples,
    samples,
  };
}

export function confidenceFromUncertainty(uncertaintyPercent: number): number {
  if (uncertaintyPercent < 5) return 0.9;
  if (uncertaintyPercent < 15) return 0.7;
  if (uncertaintyPercent < 30) return 0.5;
  if (uncertaintyPercent < 50) return 0.3;
  return 0.1;
}