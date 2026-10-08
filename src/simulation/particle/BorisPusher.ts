import { Vec3, EField, BField, vAdd, vScale, vCross, vDot } from '../core';
import { ParticleState } from './ParticleState';

export interface BorisResult {
  pos: Vec3;
  vel: Vec3;
  energyDelta: number;
}

export function borisStep(
  particle: ParticleState,
  eField: EField,
  bField: BField,
  dt: number
): BorisResult {
  const { charge, mass, pos, vel } = particle;
  const qm = charge / mass;
  const halfDt = dt / 2;

  const E = eField.E(pos);
  const B = bField.B(pos);

  const vMinus = vAdd(vel, vScale(E, qm * halfDt));
  const t = vScale(B, qm * halfDt);
  const tMag2 = vDot(t, t);
  const s = vScale(t, 2 / (1 + tMag2));
  const vPrime = vAdd(vMinus, vCross(vMinus, t));
  const vPlus = vAdd(vMinus, vCross(vPrime, s));
  const vNew = vAdd(vPlus, vScale(E, qm * halfDt));
  const posNew = vAdd(pos, vScale(vNew, dt));

  const keOld = 0.5 * mass * vDot(vel, vel);
  const keNew = 0.5 * mass * vDot(vNew, vNew);

  return { pos: posNew, vel: vNew, energyDelta: keNew - keOld };
}

export function borisStepUniform(
  pos: Vec3,
  vel: Vec3,
  charge: number,
  mass: number,
  E: Vec3,
  B: Vec3,
  dt: number
): { pos: Vec3; vel: Vec3 } {
  const qm = charge / mass;
  const halfDt = dt / 2;

  const vMinus = vAdd(vel, vScale(E, qm * halfDt));
  const t = vScale(B, qm * halfDt);
  const tMag2 = vDot(t, t);
  const s = vScale(t, 2 / (1 + tMag2));
  const vPrime = vAdd(vMinus, vCross(vMinus, t));
  const vPlus = vAdd(vMinus, vCross(vPrime, s));
  const vNew = vAdd(vPlus, vScale(E, qm * halfDt));
  const posNew = vAdd(pos, vScale(vNew, dt));

  return { pos: posNew, vel: vNew };
}