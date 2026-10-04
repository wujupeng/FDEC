import type { FusionReaction } from '../fuels/reactionTypes';
import type { ReactorGeometry } from './geometry';
import { FuelRegistry, getPrimaryFuels } from '../fuels/fuelRegistry';
import { ReactorGeometries } from './geometry';
import { computeReactorModel } from './reactorModel';
import type { ReactorModelInput, ReactorModelResult } from './reactorModel';

export interface FDEC_KPI {
  fuel: string;
  geometry: string;
  fusionPower: number;
  pGross: number;
  pNet: number;
  etaNet: number;
  erf: number;
  decAdvantage: number;
  alphaCapture: number;
  neutronConversion: number;
  particleRecovery: number;
  selfHeatingMargin: number;
  isViable: boolean;
  viableReasons: string[];
}

export interface OptimizationCell {
  fuel: string;
  geometry: string;
  pNet: number;
  etaNet: number;
  isViable: boolean;
  result: ReactorModelResult;
}

export interface OptimizationMap {
  fuels: string[];
  geometries: string[];
  cells: OptimizationCell[];
  best: OptimizationCell | null;
}

function extractKPI(result: ReactorModelResult, fusionPower: number): FDEC_KPI {
  const { energyLedger, plasmaBalance, exhaust } = result;
  return {
    fuel: result.fuel,
    geometry: result.geometry,
    fusionPower,
    pGross: energyLedger.pGrossElectric,
    pNet: energyLedger.pNet,
    etaNet: energyLedger.netf,
    erf: energyLedger.erf,
    decAdvantage: energyLedger.decAdvantage,
    alphaCapture: exhaust.particles
      .filter((p) => p.isCharged)
      .reduce((s, p) => s + p.captureFraction, 0) /
      Math.max(1, exhaust.particles.filter((p) => p.isCharged).length),
    neutronConversion: exhaust.particles
      .filter((p) => !p.isCharged)
      .reduce((s, p) => s + p.conversionFraction, 0) /
      Math.max(1, exhaust.particles.filter((p) => !p.isCharged).length),
    particleRecovery: exhaust.totalCaptureEfficiency,
    selfHeatingMargin: plasmaBalance.margin / fusionPower,
    isViable: result.isViable,
    viableReasons: result.viableReasons,
  };
}

export function computeOptimizationMap(
  baseInput: Omit<ReactorModelInput, 'reaction' | 'geometry'>,
  fuels?: FusionReaction[],
  geometries?: ReactorGeometry[]
): OptimizationMap {
  const fuelList = fuels ?? getPrimaryFuels();
  const geomList = geometries ?? ReactorGeometries;

  const cells: OptimizationCell[] = [];

  for (const fuel of fuelList) {
    for (const geom of geomList) {
      const result = computeReactorModel({
        ...baseInput,
        reaction: fuel,
        geometry: geom,
      });
      cells.push({
        fuel: fuel.fuel,
        geometry: geom.name,
        pNet: result.pNet,
        etaNet: result.etaNet,
        isViable: result.isViable,
        result,
      });
    }
  }

  const viableCells = cells.filter((c) => c.isViable);
  const best = viableCells.length > 0
    ? viableCells.reduce((b, c) => (c.pNet > b.pNet ? c : b))
    : null;

  return {
    fuels: fuelList.map((f) => f.fuel),
    geometries: geomList.map((g) => g.name),
    cells,
    best,
  };
}

export function computeKPI(result: ReactorModelResult, fusionPower: number): FDEC_KPI {
  return extractKPI(result, fusionPower);
}

export { FuelRegistry };