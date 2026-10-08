import { Vec3, EField, BField, vAdd, vScale, vCross, vDot, vMag2 } from '../core';
import { PhysicalConstants } from '../../physics/constants';
import { ParticleState } from './ParticleState';

export interface RelativisticBorisResult {
  pos: Vec3;
  vel: Vec3;
  energyDelta: number;
}

export function relativisticBorisStep(
  particle: ParticleState,
  eField: EField,
  bField: BField,
  dt: number
): RelativisticBorisResult {
  const { charge, mass, pos, vel } = particle;
  const c = PhysicalConstants.c;
  const qm = charge / mass;
  const halfDt = dt / 2;

  const E = eField.E(pos);
  const B = bField.B(pos);

  const gamma0 = 1 / Math.sqrt(1 - vMag2(vel) / (c * c));
  const u = vScale(vel, gamma0);

  const uMinus = vAdd(u, vScale(E, qm * halfDt));
  const uMinusMag2 = vDot(uMinus, uMinus);
  const gammaMinus = Math.sqrt(1 + uMinusMag2 / (c * c));

  const t = vScale(B, (qm * halfDt) / gammaMinus);
  const tMag2 = vDot(t, t);
  const s = vScale(t, 2 / (1 + tMag2));
  const uPrime = vAdd(uMinus, vCross(uMinus, t));
  const uPlus = vAdd(uMinus, vCross(uPrime, s));

  const uNew = vAdd(uPlus, vScale(E, qm * halfDt));
  const uNewMag2 = vDot(uNew, uNew);
  const gammaNew = Math.sqrt(1 + uNewMag2 / (c * c));
  const vNew = vScale(uNew, 1 / gammaNew);
  const posNew = vAdd(pos, vScale(vNew, dt));

  const eOld = (gamma0 - 1) * mass * c * c;
  const eNew = (gammaNew - 1) * mass * c * c;

  return { pos: posNew, vel: vNew, energyDelta: eNew - eOld };
}