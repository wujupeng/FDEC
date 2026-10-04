export interface NuclearMaterial {
  key: string;
  name: string;
  reaction: string;
  density: number;
  crossSection14MeV: number;
  chargedEnergyFraction: number;
  productDescription: string;
}

export const NuclearMaterials: NuclearMaterial[] = [
  {
    key: 'Li6',
    name: '⁶Li',
    reaction: '⁶Li(n,α)T',
    density: 4.7e28,
    crossSection14MeV: 0.1e-28,
    chargedEnergyFraction: 0.85,
    productDescription: 'α(2.05 MeV) + T(2.75 MeV)，均带电',
  },
  {
    key: 'Li7',
    name: '⁷Li',
    reaction: '⁷Li(n,n\'α)T',
    density: 4.6e28,
    crossSection14MeV: 0.3e-28,
    chargedEnergyFraction: 0.6,
    productDescription: 'α + T，带电，需阈能',
  },
  {
    key: 'Be9',
    name: '⁹Be',
    reaction: '⁹Be(n,2n)8Be',
    density: 7.0e28,
    crossSection14MeV: 0.5e-28,
    chargedEnergyFraction: 0.3,
    productDescription: '次级中子为主，带电份额低',
  },
  {
    key: 'U238',
    name: '²³⁸U',
    reaction: '²³⁸U(n,f)',
    density: 4.8e28,
    crossSection14MeV: 1.2e-28,
    chargedEnergyFraction: 0.95,
    productDescription: '裂变碎片，高带电份额但产中子',
  },
];

export interface NuclearConversionResult {
  captureProbability: number;
  chargedEnergy: number;
  neutronEnergy: number;
  effectiveEfficiency: number;
  requiredThickness: number;
}

export function captureProbability(density: number, crossSection: number, thickness: number): number {
  return 1 - Math.exp(-density * crossSection * thickness);
}

export function requiredThicknessForCapture(
  density: number,
  crossSection: number,
  targetProbability: number
): number {
  if (crossSection <= 0 || density <= 0) return Infinity;
  return -Math.log(1 - targetProbability) / (density * crossSection);
}

export function computeNuclearConversion(
  material: NuclearMaterial,
  thickness: number,
  neutronEnergyMeV: number = 14.1
): NuclearConversionResult {
  const p = captureProbability(material.density, material.crossSection14MeV, thickness);
  const chargedEnergy = p * neutronEnergyMeV * material.chargedEnergyFraction;
  const effectiveEfficiency = p * material.chargedEnergyFraction;
  const requiredThickness = requiredThicknessForCapture(
    material.density,
    material.crossSection14MeV,
    0.9
  );

  return {
    captureProbability: p,
    chargedEnergy,
    neutronEnergy: neutronEnergyMeV,
    effectiveEfficiency,
    requiredThickness,
  };
}

export function sweepThickness(
  material: NuclearMaterial,
  thicknesses: number[] = [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0]
): { thickness: number; capture: number; chargedEnergy: number }[] {
  return thicknesses.map((x) => {
    const r = computeNuclearConversion(material, x);
    return { thickness: x, capture: r.captureProbability, chargedEnergy: r.chargedEnergy };
  });
}