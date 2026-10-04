export type ValidationStatus = 'PASS' | 'WARN' | 'FAIL';
export type ModelLevel = 0 | 1 | 2 | 3;
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ValidationCategory = 'conservation' | 'plasma' | 'engineering' | 'neutron' | 'material';

export interface ValidationResult {
  id: string;
  name: string;
  status: ValidationStatus;
  value: number;
  limit?: number;
  message: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  modelLevel: ModelLevel;
  category: ValidationCategory;
}


export interface ValidationReport {
  results: ValidationResult[];
  overallStatus: ValidationStatus;
  overallConfidence: number;
  overallConfidenceLevel: ConfidenceLevel;
  modelClassification: string;
  passCount: number;
  warnCount: number;
  failCount: number;
  summary: string;
}

export interface UncertaintyResult {
  metric: string;
  unit: string;
  mean: number;
  std: number;
  p10: number;
  p50: number;
  p90: number;
  min: number;
  max: number;
  samples: number;
  uncertaintyPercent: number;
}

export interface UncertaintyReport {
  results: UncertaintyResult[];
  netPowerDist: UncertaintyResult;
  etaNetDist: UncertaintyResult;
  viableFraction: number;
  samples: number;
}

export const MODEL_LEVEL_LABELS: Record<ModelLevel, string> = {
  0: 'Concept',
  1: 'Analytical',
  2: 'Numerical',
  3: 'Validated',
};

export function confidenceToLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'HIGH';
  if (confidence >= 0.4) return 'MEDIUM';
  return 'LOW';
}

export function overallStatus(results: ValidationResult[]): ValidationStatus {
  const hasFail = results.some((r) => r.status === 'FAIL');
  const hasWarn = results.some((r) => r.status === 'WARN');
  if (hasFail) return 'FAIL';
  if (hasWarn) return 'WARN';
  return 'PASS';
}