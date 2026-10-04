export interface CoaxialFieldResult {
  eMax: number;
  eMin: number;
  eFlat: number;
  ratio: number;
  lnRatio: number;
}

export function computeCoaxialField(
  voltage: number,
  innerRadius: number,
  outerRadius: number
): CoaxialFieldResult {
  const lnRatio = Math.log(outerRadius / innerRadius);
  const eMax = voltage / (innerRadius * lnRatio);
  const eMin = voltage / (outerRadius * lnRatio);
  const eFlat = voltage / (outerRadius - innerRadius);
  const ratio = eMax / eFlat;

  return { eMax, eMin, eFlat, ratio, lnRatio };
}

export function coaxialFieldAtRadius(
  voltage: number,
  innerRadius: number,
  outerRadius: number,
  r: number
): number {
  const lnRatio = Math.log(outerRadius / innerRadius);
  return voltage / (r * lnRatio);
}

export function sweepRadius(
  voltage: number,
  innerRadius: number,
  outerRadius: number,
  steps: number = 40
): { r: number; eCoaxial: number; eFlat: number }[] {
  const eFlat = voltage / (outerRadius - innerRadius);
  const result: { r: number; eCoaxial: number; eFlat: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const r = innerRadius + ((outerRadius - innerRadius) * i) / steps;
    result.push({ r, eCoaxial: coaxialFieldAtRadius(voltage, innerRadius, outerRadius, r), eFlat });
  }
  return result;
}

export interface FieldRiskLevel {
  level: 'safe' | 'caution' | 'warning' | 'danger';
  label: string;
  color: string;
}

export function fieldRiskLevel(eField: number): FieldRiskLevel {
  const e = eField / 1e6;
  if (e < 10) return { level: 'safe', label: '🟢 < 10 MV/m', color: '#22c55e' };
  if (e < 30) return { level: 'caution', label: '🟡 10–30 MV/m', color: '#eab308' };
  if (e < 50) return { level: 'warning', label: '🟠 30–50 MV/m', color: '#f97316' };
  return { level: 'danger', label: '🔴 > 50 MV/m', color: '#ef4444' };
}