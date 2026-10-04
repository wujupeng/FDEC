import { PhysicalConstants } from '../physics/constants';

export type ParticleType =
  | 'alpha'
  | 'proton'
  | 'neutron'
  | 'triton'
  | 'helium3'
  | 'gamma';

export interface ParticleInfo {
  type: ParticleType;
  name: string;
  symbol: string;
  charge: number;
  mass: number;
  isCharged: boolean;
}

export const ParticleDatabase: Record<ParticleType, ParticleInfo> = {
  alpha: {
    type: 'alpha',
    name: 'α 粒子',
    symbol: 'α',
    charge: 2,
    mass: PhysicalConstants.mAlpha,
    isCharged: true,
  },
  proton: {
    type: 'proton',
    name: '质子',
    symbol: 'p',
    charge: 1,
    mass: PhysicalConstants.mProton,
    isCharged: true,
  },
  neutron: {
    type: 'neutron',
    name: '中子',
    symbol: 'n',
    charge: 0,
    mass: PhysicalConstants.mNeutron,
    isCharged: false,
  },
  triton: {
    type: 'triton',
    name: '氚核',
    symbol: 'T',
    charge: 1,
    mass: PhysicalConstants.mDeuteron + PhysicalConstants.mNeutron,
    isCharged: true,
  },
  helium3: {
    type: 'helium3',
    name: '氦-3',
    symbol: '³He',
    charge: 2,
    mass: PhysicalConstants.mHelium3,
    isCharged: true,
  },
  gamma: {
    type: 'gamma',
    name: 'γ 光子',
    symbol: 'γ',
    charge: 0,
    mass: 0,
    isCharged: false,
  },
};

export interface ReactionProduct {
  particle: ParticleType;
  energyMeV: number;
  energyFraction: number;
}

export interface SideReaction {
  reaction: string;
  probability: number;
  products: ReactionProduct[];
  description: string;
  neutronProduced: boolean;
}

export interface FusionReaction {
  key: string;
  fuel: string;
  name: string;
  reaction: string;
  totalEnergyMeV: number;
  products: ReactionProduct[];
  sideReactions: SideReaction[];
  chargedEnergyFraction: number;
  neutronEnergyFraction: number;
  radiationLossFraction: number;
  optimalTemperatureKeV: number;
  ignitionTemperatureKeV: number;
  note: string;
}

export interface ReactionRateResult {
  reactionRate: number;
  productRates: { particle: ParticleType; rate: number; energyMeV: number; power: number }[];
  sideReactionRates: { reaction: string; rate: number; neutronRate: number }[];
  totalNeutronRate: number;
  totalChargedPower: number;
  totalNeutronPower: number;
  radiationPower: number;
}