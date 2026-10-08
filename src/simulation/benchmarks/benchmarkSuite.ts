import { Vec3, vMag, PhysicalConstants, energyToVelocity } from '../core';
import { createParticle, TrajectorySample } from '../particle/ParticleState';
import { integrateParticle, IntegratorConfig } from '../particle/ParticleIntegrator';
import { createUniformE, createNoE, createCoaxialE } from '../fields/ElectricField';
import { createUniformB, createNoB } from '../fields/MagneticField';
import { createSimpleGeometry } from '../geometry/ReactorGeometry';
import { transportParticle, transportBatch, TransportConfig } from '../transport/ParticleTransport';
import { generateIsotropicSource } from '../particle/ParticleSource';
import { analyticalOrbit, compareOrbit, checkEnergyConservation } from '../analysis/AnalyticalComparison';
import { computeCaptureEfficiency } from '../analysis/CaptureEfficiency';

export interface BenchmarkResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  metric: string;
  target: string;
  details: string;
}

const e = PhysicalConstants.e;
const mAlpha = PhysicalConstants.mAlpha;
const qAlpha = 2 * e;

const MeV = 1e6 * e;

function runOrbit(
  bField: number,
  energyMeV: number,
  steps: number,
  dt: number,
  relativistic: boolean = false
): TrajectorySample[] {
  const energyJ = energyMeV * MeV;
  const speed = energyToVelocity(mAlpha, energyJ, relativistic);
  const vel0: Vec3 = { x: speed, y: 0, z: 0 };
  const pos0: Vec3 = { x: 0, y: 0, z: 0 };

  const config: IntegratorConfig = {
    mode: relativistic ? 'relativistic' : 'classical',
    dt,
    maxSteps: steps,
    eField: createNoE(),
    bField: createUniformB({ field: { x: 0, y: 0, z: bField } }),
  };

  const particle = createParticle(0, 'alpha', pos0, vel0, relativistic);
  const result = integrateParticle(particle, config);
  return result.trajectory;
}

function benchmarkB01(): BenchmarkResult {
  const B = 5;
  const energyMeV = 3.5;
  const dt = 1e-12;
  const steps = 10000;
  const traj = runOrbit(B, energyMeV, steps, dt, false);
  const analytical = analyticalOrbit(mAlpha, qAlpha, energyMeV * MeV, B, false);
  const comparison = compareOrbit(traj, analytical);

  return {
    id: 'V6-B01',
    name: 'Uniform B Circular Orbit',
    description: 'α in B=5T, check orbit radius matches r_L = γmv/(qB)',
    passed: comparison.isValid,
    metric: `r_analytic=${(analytical.larmorRadius * 100).toFixed(3)}cm, r_numeric=${(comparison.numericalRadius * 100).toFixed(3)}cm`,
    target: 'error < 5%',
    details: `error = ${comparison.errorPercent.toFixed(3)}%`,
  };
}

function benchmarkB02(): BenchmarkResult {
  const E = 1e7;
  const dt = 1e-12;
  const steps = 1000;
  const pos0: Vec3 = { x: 0, y: 0, z: 0 };
  const vel0: Vec3 = { x: 0, y: 0, z: 0 };

  const config: IntegratorConfig = {
    mode: 'classical',
    dt, maxSteps: steps,
    eField: createUniformE({ field: { x: 0, y: 0, z: E } }),
    bField: createNoB(),
  };

  const particle = createParticle(0, 'alpha', pos0, vel0, false);
  const result = integrateParticle(particle, config);
  const t = steps * dt;
  const vExpected = (qAlpha / mAlpha) * E * t;
  const vActual = result.finalState.vel.z;
  const error = Math.abs(vActual - vExpected) / vExpected * 100;

  return {
    id: 'V6-B02',
    name: 'Uniform E Acceleration',
    description: 'α in E=10MV/m, check v = (qE/m)t',
    passed: error < 1,
    metric: `v_expected=${vExpected.toExponential(3)}m/s, v_actual=${vActual.toExponential(3)}m/s`,
    target: 'error < 1%',
    details: `error = ${error.toFixed(4)}%`,
  };
}

function benchmarkB03(): BenchmarkResult {
  const E = 1e6;
  const B = 1;
  const dt = 1e-11;
  const steps = 50000;
  const energyJ = 1 * MeV;
  const speed = Math.sqrt((2 * energyJ) / mAlpha);

  const pos0: Vec3 = { x: 0, y: 0, z: 0 };
  const vel0: Vec3 = { x: 0, y: speed, z: 0 };

  const config: IntegratorConfig = {
    mode: 'classical',
    dt, maxSteps: steps,
    eField: createUniformE({ field: { x: E, y: 0, z: 0 } }),
    bField: createUniformB({ field: { x: 0, y: 0, z: B } }),
  };

  const particle = createParticle(0, 'alpha', pos0, vel0, false);
  const result = integrateParticle(particle, config);

  const vDriftExpected = E / B;
  const t = steps * dt;
  const xFinal = result.finalState.pos.x;
  const vDriftActual = xFinal / t;
  const error = Math.abs(vDriftActual - vDriftExpected) / vDriftExpected * 100;

  return {
    id: 'V6-B03',
    name: 'E × B Drift',
    description: 'α in E⊥B, check v_drift = E×B/B²',
    passed: error < 10,
    metric: `v_drift_expected=${vDriftExpected.toExponential(3)}, v_drift_actual=${vDriftActual.toExponential(3)}`,
    target: 'error < 10%',
    details: `error = ${error.toFixed(2)}%`,
  };
}

function benchmarkB04(): BenchmarkResult {
  const B = 10;
  const energyMeV = 3.5;
  const dt = 1e-12;
  const steps = 10000;
  const energyJ = energyMeV * MeV;
  const speed = Math.sqrt((2 * energyJ) / mAlpha);
  const pitchAngle = (45 * Math.PI) / 180;
  const vel0: Vec3 = {
    x: speed * Math.sin(pitchAngle),
    y: 0,
    z: speed * Math.cos(pitchAngle),
  };
  const pos0: Vec3 = { x: 0, y: 0, z: 0 };

  const config: IntegratorConfig = {
    mode: 'classical',
    dt, maxSteps: steps,
    eField: createNoE(),
    bField: createUniformB({ field: { x: 0, y: 0, z: B } }),
  };

  const particle = createParticle(0, 'alpha', pos0, vel0, false);
  const result = integrateParticle(particle, config);

  const vPerp = speed * Math.sin(pitchAngle);
  const rLarmor = (mAlpha * vPerp) / (qAlpha * B);
  const comparison = compareOrbit(result.trajectory, analyticalOrbit(mAlpha, qAlpha, energyJ, B, false));

  const zDisplacement = result.finalState.pos.z;
  const vParallel = speed * Math.cos(pitchAngle);
  const zExpected = vParallel * steps * dt;
  const zError = Math.abs(zDisplacement - zExpected) / zExpected * 100;

  return {
    id: 'V6-B04',
    name: 'Helical Particle Motion',
    description: 'α at 45° pitch in B=10T, check helical orbit',
    passed: comparison.errorPercent < 5 && zError < 5,
    metric: `r_error=${comparison.errorPercent.toFixed(2)}%, z_error=${zError.toFixed(2)}%`,
    target: 'both errors < 5%',
    details: `r_L=${(rLarmor * 100).toFixed(3)}cm, pitch_z=${zDisplacement.toFixed(4)}m`,
  };
}

function benchmarkB05(): BenchmarkResult {
  const B = 5;
  const dt = 1e-12;
  const steps = 50000;
  const traj = runOrbit(B, 3.5, steps, dt, false);
  const check = checkEnergyConservation(traj);

  return {
    id: 'V6-B05',
    name: 'Energy Conservation',
    description: 'α in pure B=5T, check |ΔE|/E₀ < 1%',
    passed: check.isConserved,
    metric: `E₀=${(check.initialEnergy / MeV).toFixed(6)}MeV, E_f=${(check.finalEnergy / MeV).toFixed(6)}MeV`,
    target: 'drift < 1%',
    details: `drift = ${check.driftPercent.toFixed(6)}%`,
  };
}

function benchmarkB06(): BenchmarkResult {
  const B = 5;
  const dt = 1e-12;
  const steps = 1000;
  const energyJ = 3.5 * MeV;
  const speed = Math.sqrt((2 * energyJ) / mAlpha);
  const pos0: Vec3 = { x: 0, y: 0, z: 0 };
  const vel0: Vec3 = { x: speed, y: 0, z: 0 };

  const particle = createParticle(0, 'alpha', pos0, vel0, false);
  const q0 = particle.charge;

  const config: IntegratorConfig = {
    mode: 'classical',
    dt, maxSteps: steps,
    eField: createNoE(),
    bField: createUniformB({ field: { x: 0, y: 0, z: B } }),
  };
  const result = integrateParticle(particle, config);
  const qFinal = result.finalState.charge;

  return {
    id: 'V6-B06',
    name: 'Charge Conservation',
    description: 'Check q is preserved through simulation',
    passed: q0 === qFinal,
    metric: `q₀=${q0.toExponential(3)}C, q_f=${qFinal.toExponential(3)}C`,
    target: 'q₀ = q_f',
    details: `Δq = ${Math.abs(q0 - qFinal).toExponential(3)}C`,
  };
}

function benchmarkB07(): BenchmarkResult {
  const V = 1.75e6;
  const a = 0.01;
  const b = 0.1;
  const field = createCoaxialE({ voltage: V, innerRadius: a, outerRadius: b, axis: 'z', center: { x: 0, y: 0, z: 0 } });

  const rTest = 0.05;
  const E = field.E({ x: rTest, y: 0, z: 0 });
  const EExpected = V / (rTest * Math.log(b / a));
  const error = Math.abs(vMag(E) - EExpected) / EExpected * 100;

  const potInner = field.potential({ x: a * 0.5, y: 0, z: 0 });
  const potOuter = field.potential({ x: b * 1.5, y: 0, z: 0 });

  return {
    id: 'V6-B07',
    name: 'Coaxial Field',
    description: 'Check E(r) = V/(r·ln(b/a)) and boundary potentials',
    passed: error < 0.1 && Math.abs(potInner - V) / V < 0.01 && Math.abs(potOuter) < 1,
    metric: `E(5cm)=${vMag(E).toExponential(3)}V/m, expected=${EExpected.toExponential(3)}V/m`,
    target: 'error < 0.1%, V(a)=V, V(b)=0',
    details: `error=${error.toFixed(6)}%, V(a)=${potInner.toExponential(3)}, V(b)=${potOuter.toExponential(3)}`,
  };
}

function benchmarkB08(): BenchmarkResult {
  const geometry = createSimpleGeometry();
  const energyJ = 3.5 * MeV;
  const speed = Math.sqrt((2 * energyJ) / mAlpha);

  const pos0: Vec3 = { x: 0.15, y: 0, z: 0 };
  const vel0: Vec3 = { x: speed, y: 0, z: 0 };

  const particle = createParticle(0, 'alpha', pos0, vel0, false);

  const config: TransportConfig = {
    mode: 'classical',
    dt: 1e-12,
    maxSteps: 5000,
    eField: createNoE(),
    bField: createNoB(),
    geometry,
    recordTrajectory: false,
    trajectoryStride: 1,
  };

  const result = transportParticle(particle, config);
  const hitWall = result.particle.fate === 'WALL_HIT';

  return {
    id: 'V6-B08',
    name: 'Wall Collision',
    description: 'α aimed at wall, check WALL_HIT detected',
    passed: hitWall,
    metric: `fate=${result.particle.fate}`,
    target: 'fate = WALL_HIT',
    details: hitWall && result.particle.wallHitPos
      ? `hit at r=${(Math.sqrt(result.particle.wallHitPos.x ** 2 + result.particle.wallHitPos.y ** 2) * 100).toFixed(2)}cm`
      : 'no wall hit detected',
  };
}

function benchmarkB09(): BenchmarkResult {
  const geometry = createSimpleGeometry();
  const energyJ = 3.5 * MeV;
  const speed = Math.sqrt((2 * energyJ) / mAlpha);

  const pos0: Vec3 = { x: 0, y: 0, z: 0 };
  const vel0: Vec3 = { x: 0, y: 0, z: speed };

  const particle = createParticle(0, 'alpha', pos0, vel0, false);

  const config: TransportConfig = {
    mode: 'classical',
    dt: 1e-12,
    maxSteps: 50000,
    eField: createNoE(),
    bField: createNoB(),
    geometry,
    recordTrajectory: false,
    trajectoryStride: 1,
  };

  const result = transportParticle(particle, config);
  const captured = result.particle.fate === 'DEC_CAPTURED';

  return {
    id: 'V6-B09',
    name: 'Converter Capture',
    description: 'α aimed at converter, check DEC_CAPTURED detected',
    passed: captured,
    metric: `fate=${result.particle.fate}`,
    target: 'fate = DEC_CAPTURED',
    details: captured && result.particle.capturedPos
      ? `captured at z=${result.particle.capturedPos.z.toFixed(4)}m`
      : `fate was ${result.particle.fate} after ${result.stepsAlive} steps`,
  };
}

function benchmarkB10(): BenchmarkResult {
  const geometry = createSimpleGeometry();
  const count = 1000;
  const particles = generateIsotropicSource({
    species: 'alpha',
    energyMeV: 3.5,
    count,
    center: { x: 0, y: 0, z: 0 },
    radius: 0.01,
    relativistic: false,
  });

  const config: TransportConfig = {
    mode: 'classical',
    dt: 1e-12,
    maxSteps: 20000,
    eField: createNoE(),
    bField: createUniformB({ field: { x: 0, y: 0, z: 5 } }),
    geometry,
    recordTrajectory: false,
    trajectoryStride: 1,
  };

  const batch = transportBatch(particles, config);
  const eff = computeCaptureEfficiency(batch, 1000);
  const total = batch.captured + batch.wallHit + batch.escaped + batch.flying;
  const accounted = total === count;

  return {
    id: 'V6-B10',
    name: '1000-Particle Monte Carlo',
    description: '1000 α particles in B=5T, check all accounted',
    passed: accounted && total > 0,
    metric: `captured=${batch.captured}, wall=${batch.wallHit}, escaped=${batch.escaped}, flying=${batch.flying}`,
    target: 'all particles accounted',
    details: `η_capture=${(eff.particleCaptureRate * 100).toFixed(1)}%, η_E=${(eff.energyCaptureRate * 100).toFixed(1)}%`,
  };
}

export function runAllBenchmarks(): BenchmarkResult[] {
  return [
    benchmarkB01(),
    benchmarkB02(),
    benchmarkB03(),
    benchmarkB04(),
    benchmarkB05(),
    benchmarkB06(),
    benchmarkB07(),
    benchmarkB08(),
    benchmarkB09(),
    benchmarkB10(),
  ];
}

export function benchmarkSummary(results: BenchmarkResult[]): {
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
} {
  const passed = results.filter(r => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    allPassed: passed === results.length,
  };
}