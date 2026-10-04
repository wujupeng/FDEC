export const PhysicalConstants = {
  e: 1.602176634e-19,
  epsilon0: 8.854187817e-12,
  c: 299792458,
  mAlpha: 6.6446573357e-27,
  mProton: 1.67262192369e-27,
  mNeutron: 1.67492749804e-27,
  mDeuteron: 3.3435837768e-27,
  mHelium3: 5.008234377e-27,
  mBoron11: 1.83817e-26,
} as const;

export const UnitFactors = {
  eV: PhysicalConstants.e,
  keV: 1e3 * PhysicalConstants.e,
  MeV: 1e6 * PhysicalConstants.e,
  GeV: 1e9 * PhysicalConstants.e,
} as const;

export const FusionEnergies = {
  DT: {
    total: 17.6,
    alpha: 3.5,
    neutron: 14.1,
  },
  DHe3: {
    total: 18.3,
    proton: 14.7,
    alpha: 3.6,
  },
  PB11: {
    total: 8.7,
    alpha: 8.7 / 3,
  },
} as const;

export const AlphaCharge = 2 * PhysicalConstants.e;