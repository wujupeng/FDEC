import { FusionEnergies } from './constants';

export interface FuelPath {
  key: string;
  name: string;
  reaction: string;
  totalEnergyMeV: number;
  chargedFraction: number;
  neutronFraction: number;
  products: string;
  note: string;
}

export const FuelPaths: FuelPath[] = [
  {
    key: 'DT',
    name: 'D-T',
    reaction: '²H + ³H → ⁴He + n',
    totalEnergyMeV: FusionEnergies.DT.total,
    chargedFraction: FusionEnergies.DT.alpha / FusionEnergies.DT.total,
    neutronFraction: FusionEnergies.DT.neutron / FusionEnergies.DT.total,
    products: 'α (3.5 MeV) + n (14.1 MeV)',
    note: '80% 能量在中子，直接发电困难，需中子转换层',
  },
  {
    key: 'DHe3',
    name: 'D-³He',
    reaction: '²H + ³He → ⁴He + p',
    totalEnergyMeV: FusionEnergies.DHe3.total,
    chargedFraction: 1.0,
    neutronFraction: 0.0,
    products: 'α (3.6 MeV) + p (14.7 MeV)',
    note: '产物全部带电，直接发电更漂亮，但需 ³He 燃料',
  },
  {
    key: 'PB11',
    name: 'p-B¹¹',
    reaction: 'p + ¹¹B → 3α',
    totalEnergyMeV: FusionEnergies.PB11.total,
    chargedFraction: 1.0,
    neutronFraction: 0.0,
    products: '3α (共 8.7 MeV)',
    note: '无中子，全部带电，理论上最适合直接转换',
  },
];

export function fuelDirectPower(
  fusionPower: number,
  fuel: FuelPath,
  eta: number
): number {
  return fusionPower * fuel.chargedFraction * eta;
}