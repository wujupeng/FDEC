import { useState, useMemo, useCallback } from 'react';
import { Card, Space, Button, Row, Col, Tag, Typography, Statistic } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PhysicalConstants } from '../physics/constants';
import { Vec3, energyToVelocity } from '../simulation/core';
import { createParticle, TrajectorySample } from '../simulation/particle/ParticleState';
import { integrateParticle, IntegratorConfig } from '../simulation/particle/ParticleIntegrator';
import { createUniformE, createNoE, createCoaxialE } from '../simulation/fields/ElectricField';
import { createUniformB, createNoB, createNozzleB } from '../simulation/fields/MagneticField';
import { analyticalOrbit, compareOrbit, checkEnergyConservation } from '../simulation/analysis/AnalyticalComparison';

const { Text } = Typography;
const MeV = 1e6 * PhysicalConstants.e;
const e = PhysicalConstants.e;
const mAlpha = PhysicalConstants.mAlpha;
const qAlpha = 2 * e;

interface CaseResult {
  traj: TrajectorySample[];
  label: string;
  description: string;
  analytical?: number;
  numerical?: number;
  energyDrift?: number;
}

function runCase(
  pos0: Vec3, vel0: Vec3,
  eField: any, bField: any,
  dt: number, steps: number,
  relativistic: boolean = false
): TrajectorySample[] {
  const particle = createParticle(0, 'alpha', pos0, vel0, relativistic);
  const config: IntegratorConfig = {
    mode: relativistic ? 'relativistic' : 'classical',
    dt, maxSteps: steps, eField, bField,
  };
  return integrateParticle(particle, config).trajectory;
}

export default function ExperimentCases() {
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [result, setResult] = useState<CaseResult | null>(null);

  const runCaseA = useCallback(() => {
    setActiveCase('A');
    const energyJ = 3.5 * MeV;
    const speed = energyToVelocity(mAlpha, energyJ, false);
    const traj = runCase(
      { x: 0, y: 0, z: 0 },
      { x: speed, y: 0, z: 0 },
      createNoE(),
      createUniformB({ field: { x: 0, y: 0, z: 5 } }),
      1e-12, 10000
    );
    const analytical = analyticalOrbit(mAlpha, qAlpha, energyJ, 5, false);
    const comp = compareOrbit(traj, analytical);
    setResult({
      traj, label: 'Case A — 无电场 B=5T',
      description: 'α 粒子在均匀磁场中的回旋运动',
      analytical: analytical.larmorRadius,
      numerical: comp.numericalRadius,
      energyDrift: checkEnergyConservation(traj).driftPercent,
    });
  }, []);

  const runCaseB = useCallback(() => {
    setActiveCase('B');
    const energyJ = 3.5 * MeV;
    const speed = energyToVelocity(mAlpha, energyJ, false);
    const traj = runCase(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: speed },
      createUniformE({ field: { x: 0, y: 0, z: -10e6 } }),
      createUniformB({ field: { x: 0, y: 0, z: 5 } }),
      1e-12, 10000
    );
    setResult({
      traj, label: 'Case B — E=10MV/m B=5T',
      description: 'α 粒子在 E⊥B 中的能量变化与 E×B 漂移',
      energyDrift: checkEnergyConservation(traj).driftPercent,
    });
  }, []);

  const runCaseC = useCallback(() => {
    setActiveCase('C');
    const energyJ = 3.5 * MeV;
    const speed = energyToVelocity(mAlpha, energyJ, false);
    const traj = runCase(
      { x: 0, y: 0, z: -0.1 },
      { x: 0, y: 0, z: speed },
      createNoE(),
      createNozzleB({ B0: 10, zCenter: 0, width: 0.05, expansionRatio: 3 }),
      1e-12, 20000
    );
    setResult({
      traj, label: 'Case C — 磁喷口 B(z)',
      description: 'α 粒子在磁喷口场中的导向与加速',
      energyDrift: checkEnergyConservation(traj).driftPercent,
    });
  }, []);

  const runCaseD = useCallback(() => {
    setActiveCase('D');
    const energyJ = 3.5 * MeV;
    const speed = energyToVelocity(mAlpha, energyJ, false);
    const traj = runCase(
      { x: 0.011, y: 0, z: 0 },
      { x: speed, y: 0, z: 0 },
      createCoaxialE({ voltage: 1.75e6, innerRadius: 0.01, outerRadius: 0.1, axis: 'z', center: { x: 0, y: 0, z: 0 } }),
      createNoB(),
      1e-13, 50000
    );
    const e0 = traj[0]?.energy || 0;
    const eFinal = traj[traj.length - 1]?.energy || 0;
    setResult({
      traj, label: 'Case D — 同轴转换器 E(r)',
      description: 'α 粒子在同轴电场中的无碰撞减速',
      analytical: e0 / MeV,
      numerical: eFinal / MeV,
      energyDrift: checkEnergyConservation(traj).driftPercent,
    });
  }, []);

  const energyChart = useMemo(() => {
    if (!result || result.traj.length < 2) return [];
    const stride = Math.max(1, Math.floor(result.traj.length / 500));
    return result.traj.filter((_, i) => i % stride === 0).map((p) => ({
      t: p.t * 1e9,
      energy: p.energy / MeV,
    }));
  }, [result]);

  const trajPoints = useMemo(() => {
    if (!result || result.traj.length < 2) return '';
    const traj = result.traj;
    const stride = Math.max(1, Math.floor(traj.length / 500));
    let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
    for (const p of traj) {
      if (p.pos.x < minA) minA = p.pos.x;
      if (p.pos.x > maxA) maxA = p.pos.x;
      if (p.pos.z < minB) minB = p.pos.z;
      if (p.pos.z > maxB) maxB = p.pos.z;
    }
    const rangeA = maxA - minA || 1;
    const rangeB = maxB - minB || 1;
    const w = 500, h = 250, pad = 20;
    const scale = Math.min((w - 2 * pad) / rangeA, (h - 2 * pad) / rangeB);
    const cx = (minA + maxA) / 2, cy = (minB + maxB) / 2;
    const pts: string[] = [];
    for (let i = 0; i < traj.length; i += stride) {
      const sx = w / 2 + (traj[i].pos.x - cx) * scale;
      const sy = h / 2 - (traj[i].pos.z - cy) * scale;
      pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [result]);

  return (
    <Card size="small" style={{ background: 'var(--fdec-panel)' }} title={<span className="fdec-section-title">📐 Experiment Cases — 预设实验</span>}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Row gutter={8}>
          <Col span={6}>
            <Button block onClick={runCaseA} type={activeCase === 'A' ? 'primary' : 'default'}>
              Case A<br /><Text style={{ fontSize: 10 }}>无E, B=5T — 回旋</Text>
            </Button>
          </Col>
          <Col span={6}>
            <Button block onClick={runCaseB} type={activeCase === 'B' ? 'primary' : 'default'}>
              Case B<br /><Text style={{ fontSize: 10 }}>E=10MV/m, B=5T — E×B</Text>
            </Button>
          </Col>
          <Col span={6}>
            <Button block onClick={runCaseC} type={activeCase === 'C' ? 'primary' : 'default'}>
              Case C<br /><Text style={{ fontSize: 10 }}>磁喷口 B(z) — 导向</Text>
            </Button>
          </Col>
          <Col span={6}>
            <Button block onClick={runCaseD} type={activeCase === 'D' ? 'primary' : 'default'}>
              Case D<br /><Text style={{ fontSize: 10 }}>同轴 E(r) — 减速</Text>
            </Button>
          </Col>
        </Row>

        {result && (
          <>
            <Tag color="blue" style={{ fontSize: 13 }}>{result.label}</Tag>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>{result.description}</Text>

            <Row gutter={8}>
              <Col span={12}>
                <svg width="100%" height={250} viewBox="0 0 500 250" style={{ border: '1px solid #1f2937', background: '#0a0a0f' }}>
                  <line x1={0} y1={125} x2={500} y2={125} stroke="#1f2937" strokeWidth={0.5} />
                  <line x1={250} y1={0} x2={250} y2={250} stroke="#1f2937" strokeWidth={0.5} />
                  <polyline points={trajPoints} fill="none" stroke="#58a6ff" strokeWidth={1.5} />
                  <text x={6} y={14} fill="#6b7280" fontSize={10}>XZ projection</text>
                </svg>
              </Col>
              <Col span={12}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={energyChart}>
                    <CartesianGrid stroke="#1f2937" />
                    <XAxis dataKey="t" stroke="#6b7280" tick={{ fontSize: 10 }} label={{ value: 't (ns)', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} label={{ value: 'E (MeV)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', fontSize: 11 }} />
                    <Line type="monotone" dataKey="energy" stroke="#f97583" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Col>
            </Row>

            <Row gutter={8}>
              {result.analytical !== undefined && result.numerical !== undefined && (
                <Col span={8}>
                  <Statistic
                    title={activeCase === 'D' ? 'E₀ vs E_f (MeV)' : 'r_analytic vs r_numeric'}
                    value={`${result.analytical.toFixed(4)} → ${result.numerical.toFixed(4)}`}
                    valueStyle={{ fontSize: 13, color: '#58a6ff' }}
                  />
                </Col>
              )}
              {result.energyDrift !== undefined && (
                <Col span={8}>
                  <Statistic
                    title="Energy Drift"
                    value={`${result.energyDrift.toFixed(6)}%`}
                    valueStyle={{ fontSize: 13, color: result.energyDrift < 1 ? '#3fb950' : '#f85149' }}
                  />
                </Col>
              )}
              <Col span={8}>
                <Statistic title="Steps" value={result.traj.length - 1} valueStyle={{ fontSize: 13 }} />
              </Col>
            </Row>
          </>
        )}

        {!result && (
          <div style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>
            <p>选择一个预设实验来运行</p>
          </div>
        )}
      </Space>
    </Card>
  );
}