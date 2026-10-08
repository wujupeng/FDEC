import { BatchTransportResult } from '../transport/ParticleTransport';

export interface FateStats {
  total: number;
  captured: number;
  wallHit: number;
  escaped: number;
  flying: number;
  captureFraction: number;
  wallFraction: number;
  escapeFraction: number;
  flyingFraction: number;
}

export function computeFateStats(batch: BatchTransportResult): FateStats {
  const total = batch.captured + batch.wallHit + batch.escaped + batch.flying;
  return {
    total,
    captured: batch.captured,
    wallHit: batch.wallHit,
    escaped: batch.escaped,
    flying: batch.flying,
    captureFraction: total > 0 ? batch.captured / total : 0,
    wallFraction: total > 0 ? batch.wallHit / total : 0,
    escapeFraction: total > 0 ? batch.escaped / total : 0,
    flyingFraction: total > 0 ? batch.flying / total : 0,
  };
}