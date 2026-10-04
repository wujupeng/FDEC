import type { FusionReaction, ReactionProduct } from './reactionTypes';

const DD_BRANCH1_TOTAL = 4.03;
const DD_BRANCH2_TOTAL = 3.27;

const branch1Products: ReactionProduct[] = [
  { particle: 'triton', energyMeV: 1.01, energyFraction: 1.01 / DD_BRANCH1_TOTAL },
  { particle: 'proton', energyMeV: 3.02, energyFraction: 3.02 / DD_BRANCH1_TOTAL },
];

const branch2Products: ReactionProduct[] = [
  { particle: 'helium3', energyMeV: 0.82, energyFraction: 0.82 / DD_BRANCH2_TOTAL },
  { particle: 'neutron', energyMeV: 2.45, energyFraction: 2.45 / DD_BRANCH2_TOTAL },
];

export const DDReaction: FusionReaction = {
  key: 'DD',
  fuel: 'D-D',
  name: '氘-氘',
  reaction: 'D + D → T + p (50%) / ³He + n (50%)',
  totalEnergyMeV: (DD_BRANCH1_TOTAL + DD_BRANCH2_TOTAL) / 2,
  products: branch1Products,
  sideReactions: [
    {
      reaction: 'D + D → ³He(0.82) + n(2.45)',
      probability: 1.0,
      products: branch2Products,
      description: 'D-D 第二分支：产生 2.45 MeV 中子',
      neutronProduced: true,
    },
  ],
  chargedEnergyFraction: (1.01 + 3.02) / 2 / ((DD_BRANCH1_TOTAL + DD_BRANCH2_TOTAL) / 2),
  neutronEnergyFraction: 2.45 / 2 / ((DD_BRANCH1_TOTAL + DD_BRANCH2_TOTAL) / 2),
  radiationLossFraction: 0.02,
  optimalTemperatureKeV: 50,
  ignitionTemperatureKeV: 15,
  note: '两个分支各约 50%：分支1 产生氚+质子（全带电），分支2 产生 ³He+中子；氚可循环回 D-T',
};

export { branch1Products as DDBranch1Products, branch2Products as DDBranch2Products };