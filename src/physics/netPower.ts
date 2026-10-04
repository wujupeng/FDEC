export interface PlantPowerBreakdown {
  pHeating: number;
  pMagnet: number;
  pVacuum: number;
  pCooling: number;
  pPowerElec: number;
  pRadiation: number;
  total: number;
}

export interface NetPowerResult {
  pGross: number;
  pPlant: PlantPowerBreakdown;
  pNet: number;
  etaNet: number;
  isViable: boolean;
  etaGross: number;
}

export function computeNetPower(
  pAlphaElectric: number,
  pNeutronElectric: number,
  fusionPower: number,
  pHeating: number,
  pMagnet: number,
  pVacuum: number,
  pCooling: number,
  pPowerElec: number,
  pRadiation: number
): NetPowerResult {
  const pGross = pAlphaElectric + pNeutronElectric;
  const plant: PlantPowerBreakdown = {
    pHeating,
    pMagnet,
    pVacuum,
    pCooling,
    pPowerElec,
    pRadiation,
    total: pHeating + pMagnet + pVacuum + pCooling + pPowerElec + pRadiation,
  };
  const pNet = pGross - plant.total;
  const etaNet = fusionPower > 0 ? pNet / fusionPower : 0;
  const etaGross = fusionPower > 0 ? pGross / fusionPower : 0;

  return {
    pGross,
    pPlant: plant,
    pNet,
    etaNet,
    isViable: pNet > 0,
    etaGross,
  };
}