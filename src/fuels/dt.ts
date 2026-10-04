import type { FusionReaction, ReactionProduct } from './reactionTypes';

const DT_TOTAL = 17.6;
const DT_ALPHA = 3.5;
const DT_NEUTRON = 14.1;

const products: ReactionProduct[] = [
  { particle: 'alpha', energyMeV: DT_ALPHA, energyFraction: DT_ALPHA / DT_TOTAL },
  { particle: 'neutron', energyMeV: DT_NEUTRON, energyFraction: DT_NEUTRON / DT_TOTAL },
];

export const DTReaction: FusionReaction = {
  key: 'DT',
  fuel: 'D-T',
  name: '氘-氚',
  reaction: '²H + ³H → ⁴He(3.5 MeV) + n(14.1 MeV)',
  totalEnergyMeV: DT_TOTAL,
  products,
  sideReactions: [
    {
      reaction: 'D + D → T(1.01) + p(3.02)',
      probability: 0.005,
      products: [
        { particle: 'triton', energyMeV: 1.01, energyFraction: 0.25 },
        { particle: 'proton', energyMeV: 3.02, energyFraction: 0.75 },
      ],
      description: 'D-D 副反应分支1（产生氚，可循环回 D-T）',
      neutronProduced: false,
    },
    {
      reaction: 'D + D → ³He(0.82) + n(2.45)',
      probability: 0.005,
      products: [
        { particle: 'helium3', energyMeV: 0.82, energyFraction: 0.25 },
        { particle: 'neutron', energyMeV: 2.45, energyFraction: 0.75 },
      ],
      description: 'D-D 副反应分支2（产生 2.45 MeV 次级中子）',
      neutronProduced: true,
    },
  ],
  chargedEnergyFraction: DT_ALPHA / DT_TOTAL,
  neutronEnergyFraction: DT_NEUTRON / DT_TOTAL,
  radiationLossFraction: 0.01,
  optimalTemperatureKeV: 15,
  ignitionTemperatureKeV: 4.4,
  note: '80% 能量在 14.1 MeV 中子，直接发电困难，需中子核转换层；点火温度最低（4.4 keV），技术成熟度最高',
};