import type { FusionReaction, ReactionProduct } from './reactionTypes';

const DHE3_TOTAL = 18.3;
const DHE3_PROTON = 14.7;
const DHE3_ALPHA = 3.6;

const products: ReactionProduct[] = [
  { particle: 'proton', energyMeV: DHE3_PROTON, energyFraction: DHE3_PROTON / DHE3_TOTAL },
  { particle: 'alpha', energyMeV: DHE3_ALPHA, energyFraction: DHE3_ALPHA / DHE3_TOTAL },
];

export const DHe3Reaction: FusionReaction = {
  key: 'DHe3',
  fuel: 'D-³He',
  name: '氘-氦3',
  reaction: '²H + ³He → p(14.7 MeV) + α(3.6 MeV)',
  totalEnergyMeV: DHE3_TOTAL,
  products,
  sideReactions: [
    {
      reaction: 'D + D → T(1.01) + p(3.02)',
      probability: 0.05,
      products: [
        { particle: 'triton', energyMeV: 1.01, energyFraction: 0.25 },
        { particle: 'proton', energyMeV: 3.02, energyFraction: 0.75 },
      ],
      description: 'D-D 副反应分支1（D-³He 燃料中 D 的副反应）',
      neutronProduced: false,
    },
    {
      reaction: 'D + D → ³He(0.82) + n(2.45)',
      probability: 0.05,
      products: [
        { particle: 'helium3', energyMeV: 0.82, energyFraction: 0.25 },
        { particle: 'neutron', energyMeV: 2.45, energyFraction: 0.75 },
      ],
      description: 'D-D 副反应分支2：D-³He 燃料的主要中子来源',
      neutronProduced: true,
    },
  ],
  chargedEnergyFraction: 1.0,
  neutronEnergyFraction: 0.0,
  radiationLossFraction: 0.03,
  optimalTemperatureKeV: 80,
  ignitionTemperatureKeV: 25,
  note: '主反应产物全带电（p+α），但 D-D 副反应产生约 5% 中子；需高浓度 ³He 燃料；点火温度 25 keV',
};