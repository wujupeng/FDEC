import type { FusionReaction, ReactionProduct } from './reactionTypes';

const PB11_TOTAL = 8.68;
const PB11_ALPHA_ENERGY = PB11_TOTAL / 3;

const products: ReactionProduct[] = [
  { particle: 'alpha', energyMeV: PB11_ALPHA_ENERGY, energyFraction: 1 / 3 },
  { particle: 'alpha', energyMeV: PB11_ALPHA_ENERGY, energyFraction: 1 / 3 },
  { particle: 'alpha', energyMeV: PB11_ALPHA_ENERGY, energyFraction: 1 / 3 },
];

export const PB11Reaction: FusionReaction = {
  key: 'PB11',
  fuel: 'p-B¹¹',
  name: '质子-硼11',
  reaction: 'p + ¹¹B → 3α (8.68 MeV)',
  totalEnergyMeV: PB11_TOTAL,
  products,
  sideReactions: [
    {
      reaction: 'p + ¹¹B → ¹²C* → ¹²C + γ',
      probability: 0.001,
      products: [
        { particle: 'gamma', energyMeV: 15.1, energyFraction: 1.0 },
      ],
      description: '辐射俘获通道（极低概率），产生 15.1 MeV γ',
      neutronProduced: false,
    },
  ],
  chargedEnergyFraction: 1.0,
  neutronEnergyFraction: 0.0,
  radiationLossFraction: 0.15,
  optimalTemperatureKeV: 150,
  ignitionTemperatureKeV: 55,
  note: '3α 全带电、无中子，理论上最适合直接转换；但硼 Z=5 导致韧致辐射损失显著（~15%），且点火温度高达 55 keV',
};