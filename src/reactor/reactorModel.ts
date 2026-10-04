import type { FusionReaction } from '../fuels/reactionTypes';
import type { ReactorGeometry } from './geometry';
import { computeEnergyLedger } from '../physics/energyLedger';
import { computeParticleLedger } from '../physics/particleLedger';
import { computePlasmaBalance } from '../physics/plasmaBalance';
import { computeExhaust } from '../physics/exhaust';
import type { EnergyLedgerResult } from '../physics/energyLedger';
import type { ParticleLedgerResult } from '../physics/particleLedger';
import type { PlasmaBalanceResult } from '../physics/plasmaBalance';
import type { ExhaustResult } from '../physics/exhaust';

export interface ReactorModelInput {
  reaction: FusionReaction;
  geometry: ReactorGeometry;
  fusionPower: number;
  fAlphaExtract: number;
  etaAlphaCapture: number;
  etaAlphaDec: number;
  etaNeutronCapture: number;
  etaNeutronConversion: number;
  etaNeutronDec: number;
  temperatureKeV: number;
  densityM3: number;
  confinementTime: number;
  pPlasma: number;
  pMagnet: number;
  pVacuum: number;
  pCooling: number;
  pPower: number;
  pControl: number;
  etaThermalRecovery: number;
}

export interface ReactorModelResult {
  fuel: string;
  geometry: string;
  energyLedger: EnergyLedgerResult;
  particleLedger: ParticleLedgerResult;
  plasmaBalance: PlasmaBalanceResult;
  exhaust: ExhaustResult;
  pNet: number;
  etaNet: number;
  erf: number;
  netf: number;
  decAdvantage: number;
  isViable: boolean;
  viableReasons: string[];
}

export function computeReactorModel(input: ReactorModelInput): ReactorModelResult {
  const {
    reaction,
    geometry,
    fusionPower,
    fAlphaExtract,
    etaAlphaCapture,
    etaAlphaDec,
    etaNeutronCapture,
    etaNeutronConversion,
    etaNeutronDec,
    temperatureKeV,
    densityM3,
    confinementTime,
    pPlasma,
    pMagnet,
    pVacuum,
    pCooling,
    pPower,
    pControl,
    etaThermalRecovery,
  } = input;

  const energyLedger = computeEnergyLedger({
    reaction,
    fusionPower,
    fAlphaExtract,
    etaAlphaCapture,
    etaAlphaDec,
    etaNeutronCapture,
    etaNeutronConversion,
    etaNeutronDec,
    pPlasma,
    pMagnet,
    pVacuum,
    pCooling,
    pPower,
    pControl,
    etaThermalRecovery,
  });

  const particleLedger = computeParticleLedger({
    reaction,
    fusionPower,
    fAlphaExtract,
    etaAlphaCapture,
    etaAlphaDec,
    etaNeutronCapture,
    etaNeutronConversion,
    etaNeutronDec,
  });

  const plasmaBalance = computePlasmaBalance({
    reaction,
    fusionPower,
    fAlphaExtract,
    temperatureKeV,
    densityM3,
    energyConfinementTime: confinementTime,
    bField: geometry.bFieldCore,
  });

  const exhaust = computeExhaust(
    reaction,
    fusionPower,
    {
      coreRadius: geometry.coreRadius,
      exhaustLength: geometry.exhaustLength,
      exhaustHalfAngle: geometry.exhaustHalfAngle,
      converterRadius: geometry.converterRadius,
      converterDistance: geometry.converterDistance,
    },
    etaAlphaDec,
    etaNeutronCapture,
    etaNeutronConversion
  );

  const viableReasons: string[] = [];
  if (!energyLedger.isConserved) viableReasons.push('能量不守恒');
  if (!plasmaBalance.selfSustained) viableReasons.push('等离子体无法自持');
  if (energyLedger.pNet <= 0) viableReasons.push('净电功率为负');
  if (plasmaBalance.ignitionMargin < 0) viableReasons.push(`温度低于点火温度 (${reaction.ignitionTemperatureKeV} keV)`);

  return {
    fuel: reaction.fuel,
    geometry: geometry.name,
    energyLedger,
    particleLedger,
    plasmaBalance,
    exhaust,
    pNet: energyLedger.pNet,
    etaNet: energyLedger.netf,
    erf: energyLedger.erf,
    netf: energyLedger.netf,
    decAdvantage: energyLedger.decAdvantage,
    isViable: viableReasons.length === 0,
    viableReasons,
  };
}