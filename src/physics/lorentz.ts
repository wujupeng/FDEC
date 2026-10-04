import { PhysicalConstants, AlphaCharge } from './constants';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TrajectoryPoint {
  pos: Vec3;
  vel: Vec3;
  t: number;
  energy: number;
}

export interface SimulationConfig {
  charge: number;
  mass: number;
  eField: Vec3;
  bField: Vec3;
  dt: number;
  steps: number;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function borisPush(
  pos: Vec3,
  vel: Vec3,
  config: SimulationConfig
): { pos: Vec3; vel: Vec3 } {
  const { charge, mass, eField, bField, dt } = config;
  const qm = charge / mass;
  const halfDt = dt / 2;

  const vMinus = add(vel, scale(eField, qm * halfDt));
  const t = scale(bField, qm * halfDt);
  const tMag2 = dot(t, t);
  const s = scale(t, 2 / (1 + tMag2));
  const vPrime = add(vMinus, cross(vMinus, t));
  const vPlus = add(vMinus, cross(vPrime, s));
  const vNew = add(vPlus, scale(eField, qm * halfDt));
  const posNew = add(pos, scale(vNew, dt));

  return { pos: posNew, vel: vNew };
}

export function simulateTrajectory(
  pos0: Vec3,
  vel0: Vec3,
  config: SimulationConfig
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  let pos = pos0;
  let vel = vel0;
  const { mass } = config;
  const ke0 = 0.5 * mass * dot(vel0, vel0);

  points.push({ pos, vel, t: 0, energy: ke0 });

  for (let i = 1; i <= config.steps; i++) {
    const result = borisPush(pos, vel, config);
    pos = result.pos;
    vel = result.vel;
    const energy = 0.5 * mass * dot(vel, vel);
    points.push({ pos, vel, t: i * config.dt, energy });
  }

  return points;
}

export function simulateAlphaInBField(
  bField: number,
  initialSpeed: number,
  pitchAngleDeg: number,
  steps: number = 500,
  dt: number = 1e-10
): TrajectoryPoint[] {
  const pitch = (pitchAngleDeg * Math.PI) / 180;
  const vel0: Vec3 = {
    x: initialSpeed * Math.sin(pitch),
    y: 0,
    z: initialSpeed * Math.cos(pitch),
  };
  const pos0: Vec3 = { x: 0, y: 0, z: 0 };
  const config: SimulationConfig = {
    charge: AlphaCharge,
    mass: PhysicalConstants.mAlpha,
    eField: { x: 0, y: 0, z: 0 },
    bField: { x: 0, y: 0, z: bField },
    dt,
    steps,
  };
  return simulateTrajectory(pos0, vel0, config);
}

export function energyDrift(trajectory: TrajectoryPoint[]): number {
  if (trajectory.length < 2) return 0;
  const e0 = trajectory[0].energy;
  const eFinal = trajectory[trajectory.length - 1].energy;
  return e0 > 0 ? Math.abs(eFinal - e0) / e0 : 0;
}