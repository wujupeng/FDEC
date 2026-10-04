export function formatScientific(value: number, digits: number = 3): string {
  if (!isFinite(value)) return '∞';
  if (value === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  return `${mantissa.toFixed(digits)}×10^${exp}`;
}

export function formatPower(watts: number): string {
  const abs = Math.abs(watts);
  if (abs >= 1e9) return `${(watts / 1e9).toFixed(2)} GW`;
  if (abs >= 1e6) return `${(watts / 1e6).toFixed(2)} MW`;
  if (abs >= 1e3) return `${(watts / 1e3).toFixed(2)} kW`;
  return `${watts.toFixed(2)} W`;
}

export function formatCurrent(amps: number): string {
  const abs = Math.abs(amps);
  if (abs >= 1e3) return `${(amps / 1e3).toFixed(2)} kA`;
  return `${amps.toFixed(2)} A`;
}

export function formatVoltage(volts: number): string {
  const abs = Math.abs(volts);
  if (abs >= 1e6) return `${(volts / 1e6).toFixed(2)} MV`;
  if (abs >= 1e3) return `${(volts / 1e3).toFixed(2)} kV`;
  return `${volts.toFixed(2)} V`;
}

export function formatArea(m2: number): string {
  if (!isFinite(m2)) return '∞';
  const abs = Math.abs(m2);
  if (abs >= 1) return `${m2.toFixed(2)} m²`;
  if (abs >= 1e-4) return `${(m2 * 1e4).toFixed(2)} cm²`;
  return `${(m2 * 1e6).toFixed(2)} mm²`;
}

export function formatRate(rate: number): string {
  return formatScientific(rate, 3) + ' /s';
}