import type { FusionReaction } from '../fuels/reactionTypes';
import { UnitFactors } from './constants';

export type LedgerCategory =
  | 'fusion'
  | 'charged'
  | 'neutron'
  | 'radiation'
  | 'escape'
  | 'conversion_loss'
  | 'plasma_heating'
  | 'electric'
  | 'plant'
  | 'net';

export interface EnergyLedgerEntry {
  label: string;
  value: number;
  category: LedgerCategory;
  detail?: string;
}

export interface EnergyLedgerInput {
  reaction: FusionReaction;
  fusionPower: number;
  fAlphaExtract: number;
  etaAlphaCapture: number;
  etaAlphaDec: number;
  etaNeutronCapture: number;
  etaNeutronConversion: number;
  etaNeutronDec: number;
  pPlasma: number;
  pMagnet: number;
  pVacuum: number;
  pCooling: number;
  pPower: number;
  pControl: number;
  etaThermalRecovery: number;
}

export interface EnergyLedgerResult {
  fuel: string;
  fusionPower: number;
  entries: EnergyLedgerEntry[];
  pGrossElectric: number;
  pPlant: number;
  pNet: number;
  erf: number;
  netf: number;
  pThermal: number;
  pRadiation: number;
  pEscaping: number;
  pConversionLoss: number;
  pPlasmaHeating: number;
  conservationTotal: number;
  conservationError: number;
  isConserved: boolean;
  pNetThermal: number;
  decAdvantage: number;
  isViable: boolean;
}

export function computeEnergyLedger(input: EnergyLedgerInput): EnergyLedgerResult {
  const {
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
  } = input;

  const pChargedMain = fusionPower * reaction.chargedEnergyFraction;
  const pNeutronMain = fusionPower * reaction.neutronEnergyFraction;

  let pSideCharged = 0;
  let pSideNeutron = 0;
  for (const side of reaction.sideReactions) {
    const sidePower = fusionPower * side.probability;
    for (const prod of side.products) {
      if (prod.particle === 'neutron') {
        pSideNeutron += sidePower * prod.energyFraction;
      } else if (prod.particle === 'gamma') {
        // gamma counts as radiation
      } else {
        pSideCharged += sidePower * prod.energyFraction;
      }
    }
  }

  const pCharged = pChargedMain + pSideCharged;
  const pNeutron = pNeutronMain + pSideNeutron;
  const pRadiation = fusionPower * reaction.radiationLossFraction;

  const pAlphaExtracted = pCharged * fAlphaExtract * etaAlphaCapture;
  const pAlphaHeating = pCharged * (1 - fAlphaExtract);
  const pAlphaEscape = pCharged * fAlphaExtract * (1 - etaAlphaCapture);
  const pAlphaElectric = pAlphaExtracted * etaAlphaDec;
  const pAlphaConversionLoss = pAlphaExtracted * (1 - etaAlphaDec);

  const pNeutronCaptured = pNeutron * etaNeutronCapture;
  const pNeutronEscape = pNeutron * (1 - etaNeutronCapture);
  const pNeutronConverted = pNeutronCaptured * etaNeutronConversion;
  const pNeutronElectric = pNeutronConverted * etaNeutronDec;
  const pNeutronConversionLoss = pNeutronConverted * (1 - etaNeutronDec);

  const pGrossElectric = pAlphaElectric + pNeutronElectric;
  const pPlant = pPlasma + pMagnet + pVacuum + pCooling + pPower + pControl;
  const pNet = pGrossElectric - pPlant;

  const pConversionLoss = pAlphaConversionLoss + pNeutronConversionLoss;
  const pEscaping = pAlphaEscape + pNeutronEscape;
  const pThermal = (pAlphaHeating + pConversionLoss) * etaThermalRecovery;

  const conservationTotal =
    pGrossElectric + pConversionLoss + pAlphaHeating + pEscaping + pRadiation + (pAlphaHeating + pConversionLoss) * (1 - etaThermalRecovery);
  const conservationError = Math.abs(conservationTotal - fusionPower) / fusionPower;

  const erf = fusionPower > 0 ? pGrossElectric / fusionPower : 0;
  const netf = fusionPower > 0 ? pNet / fusionPower : 0;

  const etaThermalPlant = 0.33;
  const pNetThermal = fusionPower * etaThermalPlant - pPlant * 1.2;
  const decAdvantage = pNet - pNetThermal;

  const entries: EnergyLedgerEntry[] = [
    { label: '聚变功率 P_fusion', value: fusionPower, category: 'fusion', detail: reaction.reaction },
    { label: '带电粒子能量 (主反应)', value: pChargedMain, category: 'charged' },
    { label: '中子能量 (主反应)', value: pNeutronMain, category: 'neutron' },
  ];

  if (pSideCharged > 0) {
    entries.push({ label: '副反应带电产物', value: pSideCharged, category: 'charged', detail: 'D-D 等副反应' });
  }
  if (pSideNeutron > 0) {
    entries.push({ label: '副反应中子', value: pSideNeutron, category: 'neutron', detail: 'D-D 副反应中子' });
  }

  entries.push(
    { label: '韧致辐射损失', value: pRadiation, category: 'radiation', detail: `辐射分数 ${(reaction.radiationLossFraction * 100).toFixed(1)}%` },
    { label: 'α 留在等离子体自加热', value: pAlphaHeating, category: 'plasma_heating', detail: `f_extract=${fAlphaExtract.toFixed(2)}` },
    { label: 'α 逃逸', value: pAlphaEscape, category: 'escape', detail: `捕获率 η_capture=${(etaAlphaCapture * 100).toFixed(0)}%` },
    { label: 'α 转换损失', value: pAlphaConversionLoss, category: 'conversion_loss', detail: `η_DEC=${(etaAlphaDec * 100).toFixed(0)}%` },
    { label: 'α 直接电能', value: pAlphaElectric, category: 'electric' },
    { label: '中子逃逸', value: pNeutronEscape, category: 'escape', detail: `η_capture=${(etaNeutronCapture * 100).toFixed(0)}%` },
    { label: '中子转换损失', value: pNeutronConversionLoss, category: 'conversion_loss', detail: `η_conv×η_DEC` },
    { label: '中子直接电能', value: pNeutronElectric, category: 'electric' },
    { label: '毛电输出 P_gross', value: pGrossElectric, category: 'electric' },
    { label: '厂用电 P_plant', value: pPlant, category: 'plant' },
    { label: '净电输出 P_net', value: pNet, category: 'net' },
  );

  return {
    fuel: reaction.fuel,
    fusionPower,
    entries,
    pGrossElectric,
    pPlant,
    pNet,
    erf,
    netf,
    pThermal,
    pRadiation,
    pEscaping,
    pConversionLoss,
    pPlasmaHeating: pAlphaHeating,
    conservationTotal,
    conservationError,
    isConserved: conservationError < 0.01,
    pNetThermal,
    decAdvantage,
    isViable: pNet > 0,
  };
}

export function reactionRate(fusionPower: number, energyMeV: number): number {
  return fusionPower / (energyMeV * UnitFactors.MeV);
}