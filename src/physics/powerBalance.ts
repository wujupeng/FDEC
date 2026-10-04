export interface PlantPowerItems {
  pPlasma: number;
  pMagnet: number;
  pVacuum: number;
  pCooling: number;
  pPower: number;
  pControl: number;
}

export interface PowerBalanceResult {
  pElectric: number;
  pPlant: number;
  pNet: number;
  etaNet: number;
  etaGross: number;
  status: 'viable' | 'not-viable';
}

export function computePowerBalance(
  pElectric: number,
  fusionPower: number,
  plant: PlantPowerItems
): PowerBalanceResult {
  const pPlant =
    plant.pPlasma + plant.pMagnet + plant.pVacuum + plant.pCooling + plant.pPower + plant.pControl;
  const pNet = pElectric - pPlant;
  const etaNet = fusionPower > 0 ? pNet / fusionPower : 0;
  const etaGross = fusionPower > 0 ? pElectric / fusionPower : 0;

  return {
    pElectric,
    pPlant,
    pNet,
    etaNet,
    etaGross,
    status: pNet > 0 ? 'viable' : 'not-viable',
  };
}

export const PlantItems = [
  { key: 'pPlasma', label: '等离子体维持', color: '#ef4444' },
  { key: 'pMagnet', label: '磁场系统', color: '#f59e0b' },
  { key: 'pVacuum', label: '真空系统', color: '#eab308' },
  { key: 'pCooling', label: '冷却系统', color: '#06b6d4' },
  { key: 'pPower', label: '功率电子', color: '#a855f7' },
  { key: 'pControl', label: '控制/辐射', color: '#6b7280' },
] as const;