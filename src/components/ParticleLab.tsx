import { useState, useMemo, useCallback } from 'react';
import { Card, Space, Button, InputNumber, Select, Slider, Row, Col, Statistic, Tag, Divider, Typography, Switch, Descriptions } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PhysicalConstants } from '../physics/constants';
import { ParticleSpecies, getSpecies, energyToVelocity, vMag, Vec3 } from '../simulation/core';
import { createParticle, TrajectorySample } from '../simulation/particle/ParticleState';
import { integrateParticle, IntegratorConfig } from '../simulation/particle/ParticleIntegrator';
import { createUniformE, createNoE } from '../simulation/fields/ElectricField';
import { createUniformB } from '../simulation/fields/MagneticField';
import { analyticalOrbit, compareOrbit, checkEnergyConservation } from '../simulation/analysis/AnalyticalComparison';

const { Text } = Typography;
const MeV = 1e6 * PhysicalConstants.e;

interface TrajectoryProjectionProps {
  traj: TrajectorySample[];
  plane: 'xy' | 'xz' | 'yz';
  width: number;
  height: number;
  label: string;
}

function TrajectoryProjection({ traj, plane, width, height, label }: TrajectoryProjectionProps) {
  if (traj.length < 2) return <Text style={{ color: '#6b7280' }}>无轨迹数据</Text>;

  const axKey = plane === 'xy' ? 'x' : plane === 'xz' ? 'x' : 'y';
  const ayKey = plane === 'xy' ? 'y' : plane === 'xz' ? 'z' : 'z';

  let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
  for (const p of traj) {
    const a = p.pos[axKey];
    const b = p.pos[ayKey];
    if (a < minA) minA = a;
    if (a > maxA) maxA = a;
    if (b < minB) minB = b;
    if (b > maxB) maxB = b;
  }
  const rangeA = maxA - minA || 1;
  const rangeB = maxB - minB || 1;
  const padding = 20;
  const scale = Math.min((width - 2 * padding) / rangeA, (height - 2 * padding) / rangeB);
  const cx = (minA + maxA) / 2;
  const cy = (minB + maxB) / 2;

  const points = traj.map((p) => {
    const sx = width / 2 + (p.pos[axKey] - cx) * scale;
    const sy = height / 2 - (p.pos[ayKey] - cy) * scale;
    return `${sx.toFixed(1)},${sy.toFixed(1)}`;
  });

  const startPt = points[0];
  const endPt = points[points.length - 1];

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={width} height={height} style={{ border: '1px solid #1f2937', background: '#0a0a0f' }}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#1f2937" strokeWidth={0.5} />
        <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="#1f2937" strokeWidth={0.5} />
        <polyline points={points.join(' ')} fill="none" stroke="#58a6ff" strokeWidth={1.5} opacity={0.9} />
        <circle cx={parseFloat(startPt.split(',')[0])} cy={parseFloat(startPt.split(',')[1])} r={3} fill="#3fb950" />
        <circle cx={parseFloat(endPt.split(',')[0])} cy={parseFloat(endPt.split(',')[1])} r={3} fill="#f85149" />
        <text x={6} y={14} fill="#6b7280" fontSize={10}>{label}</text>
        <text x={6} y={height - 6} fill="#3fb950" fontSize={9}>● start</text>
        <text x={width - 40} y={height - 6} fill="#f85149" fontSize={9}>● end</text>
      </svg>
    </div>
  );
}

export default function ParticleLab() {
  const [species, setSpecies] = useState<ParticleSpecies>('alpha');
  const [energyMeV, setEnergyMeV] = useState(3.5);
  const [bField, setBField] = useState(5);
  const [eFieldOn, setEFieldOn] = useState(false);
  const [eFieldMVm, setEFieldMVm] = useState(10);
  const [pitchDeg, setPitchDeg] = useState(90);
  const [relativistic, setRelativistic] = useState(false);
  const [dt, setDt] = useState(1e-12);
  const [steps, setSteps] = useState(10000);
  const [traj, setTraj] = useState<TrajectorySample[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const props = useMemo(() => getSpecies(species), [species]);

  const handleTrace = useCallback(() => {
    const energyJ = energyMeV * MeV;
    const speed = energyToVelocity(props.mass, energyJ, relativistic);
    const pitch = (pitchDeg * Math.PI) / 180;
    const vel0: Vec3 = {
      x: speed * Math.sin(pitch),
      y: 0,
      z: speed * Math.cos(pitch),
    };
    const pos0: Vec3 = { x: 0, y: 0, z: 0 };

    const particle = createParticle(0, species, pos0, vel0, relativistic);
    const config: IntegratorConfig = {
      mode: relativistic ? 'relativistic' : 'classical',
      dt, maxSteps: steps,
      eField: eFieldOn
        ? createUniformE({ field: { x: 0, y: 0, z: eFieldMVm * 1e6 } })
        : createNoE(),
      bField: createUniformB({ field: { x: 0, y: 0, z: bField } }),
    };

    const result = integrateParticle(particle, config);
    setTraj(result.trajectory);
    setHasRun(true);
  }, [species, energyMeV, bField, eFieldOn, eFieldMVm, pitchDeg, relativistic, dt, steps, props]);

  const analysis = useMemo(() => {
    if (!hasRun || traj.length < 2) return null;
    const energyJ = energyMeV * MeV;
    const analytical = analyticalOrbit(props.mass, props.charge, energyJ, bField, relativistic);
    const comparison = compareOrbit(traj, analytical);
    const energyCheck = checkEnergyConservation(traj);
    const speed = vMag(traj[0].vel);
    const beta = speed / PhysicalConstants.c;
    return { analytical, comparison, energyCheck, speed, beta };
  }, [traj, hasRun, energyMeV, bField, relativistic, props]);

  const energyData = useMemo(() => {
    if (traj.length < 2) return [];
    const stride = Math.max(1, Math.floor(traj.length / 500));
    return traj.filter((_, i) => i % stride === 0).map((p) => ({
      t: p.t * 1e9,
      energy: p.energy / MeV,
    }));
  }, [traj]);

  const particleInfo = useMemo(() => {
    if (!hasRun || traj.length < 1) return null;
    const first = traj[0];
    const last = traj[traj.length - 1];
    return { first, last };
  }, [traj, hasRun]);

  return (
    <Card size="small" style={{ background: 'var(--fdec-panel)' }} title={<span className="fdec-section-title">🔬 Particle Lab — 单粒子实验室</span>}>
      <Row gutter={16}>
        <Col span={6}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Text strong style={{ color: '#e5e7eb' }}>粒子参数</Text>
            <Select value={species} onChange={(v) => setSpecies(v)} style={{ width: '100%' }}
              options={[
                { value: 'alpha', label: 'α (³He⁴²+) — 3.5 MeV' },
                { value: 'proton', label: 'p (H¹+)' },
                { value: 'deuteron', label: 'D (H²+)' },
                { value: 'he3', label: '³He²+' },
                { value: 'boron11', label: '¹¹B⁵+' },
              ]}
            />
            <div>
              <Text style={{ color: '#9ca3af' }}>能量 (MeV): </Text>
              <InputNumber value={energyMeV} onChange={(v) => v && setEnergyMeV(v)} step={0.1} min={0.01} max={100} style={{ width: 100 }} />
            </div>
            <div>
              <Text style={{ color: '#9ca3af' }}>Pitch角 (°): </Text>
              <Slider value={pitchDeg} onChange={setPitchDeg} min={0} max={180} step={1} style={{ width: '100%' }} />
            </div>
            <Divider style={{ margin: '4px 0' }} />
            <Text strong style={{ color: '#e5e7eb' }}>磁场 B</Text>
            <div>
              <Text style={{ color: '#9ca3af' }}>B_z (T): </Text>
              <InputNumber value={bField} onChange={(v) => v && setBField(v)} step={0.5} min={0} max={50} style={{ width: 100 }} />
            </div>
            <Divider style={{ margin: '4px 0' }} />
            <Text strong style={{ color: '#e5e7eb' }}>电场 E</Text>
            <Space>
              <Switch checked={eFieldOn} onChange={setEFieldOn} />
              <Text style={{ color: '#9ca3af' }}>{eFieldOn ? 'ON' : 'OFF'}</Text>
            </Space>
            {eFieldOn && (
              <div>
                <Text style={{ color: '#9ca3af' }}>E_z (MV/m): </Text>
                <InputNumber value={eFieldMVm} onChange={(v) => v && setEFieldMVm(v)} step={1} min={0} max={100} style={{ width: 100 }} />
              </div>
            )}
            <Divider style={{ margin: '4px 0' }} />
            <Space>
              <Switch checked={relativistic} onChange={setRelativistic} />
              <Text style={{ color: '#9ca3af' }}>相对论</Text>
            </Space>
            <div>
              <Text style={{ color: '#9ca3af' }}>dt (s): </Text>
              <Select value={dt} onChange={setDt} style={{ width: 120 }}
                options={[
                  { value: 1e-11, label: '1e-11' },
                  { value: 1e-12, label: '1e-12' },
                  { value: 1e-13, label: '1e-13' },
                ]}
              />
            </div>
            <div>
              <Text style={{ color: '#9ca3af' }}>步数: </Text>
              <Select value={steps} onChange={setSteps} style={{ width: 120 }}
                options={[
                  { value: 1000, label: '1,000' },
                  { value: 5000, label: '5,000' },
                  { value: 10000, label: '10,000' },
                  { value: 50000, label: '50,000' },
                ]}
              />
            </div>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleTrace} block>
              TRACE
            </Button>
          </Space>
        </Col>

        <Col span={18}>
          {hasRun && analysis ? (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Row gutter={8}>
                <Col span={6}>
                  <Statistic title="v₀ (m/s)" value={analysis.speed.toExponential(3)} valueStyle={{ fontSize: 14, color: '#58a6ff' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="β = v/c" value={analysis.beta.toFixed(6)} valueStyle={{ fontSize: 14, color: '#58a6ff' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="r_L (cm)" value={(analysis.analytical.larmorRadius * 100).toFixed(4)} valueStyle={{ fontSize: 14, color: '#3fb950' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="T_cyc (ns)" value={(analysis.analytical.cyclotronPeriod * 1e9).toFixed(4)} valueStyle={{ fontSize: 14, color: '#3fb950' }} />
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={8}>
                  <TrajectoryProjection traj={traj} plane="xy" width={280} height={220} label="XY plane (B⊥)" />
                </Col>
                <Col span={8}>
                  <TrajectoryProjection traj={traj} plane="xz" width={280} height={220} label="XZ plane" />
                </Col>
                <Col span={8}>
                  <TrajectoryProjection traj={traj} plane="yz" width={280} height={220} label="YZ plane" />
                </Col>
              </Row>

              <Card size="small" style={{ background: '#0d1117' }} title={<Text style={{ color: '#9ca3af', fontSize: 12 }}>Energy vs Time</Text>}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={energyData}>
                    <CartesianGrid stroke="#1f2937" />
                    <XAxis dataKey="t" stroke="#6b7280" tick={{ fontSize: 10 }} label={{ value: 't (ns)', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} label={{ value: 'E (MeV)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', fontSize: 11 }} />
                    <Line type="monotone" dataKey="energy" stroke="#f97583" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Row gutter={8}>
                <Col span={12}>
                  <Card size="small" style={{ background: '#0d1117' }}>
                    <Descriptions title={<Text style={{ color: '#9ca3af', fontSize: 12 }}>Analytical vs Numerical</Text>} column={1} size="small" labelStyle={{ color: '#9ca3af', fontSize: 11 }} contentStyle={{ color: '#e5e7eb', fontSize: 11 }}>
                      <Descriptions.Item label="r_analytical">{(analysis.comparison.analyticalRadius * 100).toFixed(4)} cm</Descriptions.Item>
                      <Descriptions.Item label="r_numerical">{(analysis.comparison.numericalRadius * 100).toFixed(4)} cm</Descriptions.Item>
                      <Descriptions.Item label="误差">{analysis.comparison.errorPercent.toFixed(4)} %</Descriptions.Item>
                    </Descriptions>
                    <Tag color={analysis.comparison.isValid ? 'green' : 'red'}>
                      {analysis.comparison.isValid ? '✓ SOLVER VALID' : '✗ SOLVER ERROR'}
                    </Tag>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: '#0d1117' }}>
                    <Descriptions title={<Text style={{ color: '#9ca3af', fontSize: 12 }}>Energy Conservation</Text>} column={1} size="small" labelStyle={{ color: '#9ca3af', fontSize: 11 }} contentStyle={{ color: '#e5e7eb', fontSize: 11 }}>
                      <Descriptions.Item label="E₀">{(analysis.energyCheck.initialEnergy / MeV).toFixed(6)} MeV</Descriptions.Item>
                      <Descriptions.Item label="E_final">{(analysis.energyCheck.finalEnergy / MeV).toFixed(6)} MeV</Descriptions.Item>
                      <Descriptions.Item label="漂移">{analysis.energyCheck.driftPercent.toFixed(6)} %</Descriptions.Item>
                    </Descriptions>
                    <Tag color={analysis.energyCheck.isConserved ? 'green' : 'red'}>
                      {analysis.energyCheck.isConserved ? '✓ CONSERVED' : '⚠ DRIFT'}
                    </Tag>
                  </Card>
                </Col>
              </Row>

              {particleInfo && (
                <Card size="small" style={{ background: '#0d1117' }}>
                  <Descriptions title={<Text style={{ color: '#9ca3af', fontSize: 12 }}>Final Particle State</Text>} column={3} size="small" labelStyle={{ color: '#9ca3af', fontSize: 11 }} contentStyle={{ color: '#e5e7eb', fontSize: 11 }}>
                    <Descriptions.Item label="x (m)">{particleInfo.last.pos.x.toFixed(6)}</Descriptions.Item>
                    <Descriptions.Item label="y (m)">{particleInfo.last.pos.y.toFixed(6)}</Descriptions.Item>
                    <Descriptions.Item label="z (m)">{particleInfo.last.pos.z.toFixed(6)}</Descriptions.Item>
                    <Descriptions.Item label="vx (m/s)">{particleInfo.last.vel.x.toExponential(3)}</Descriptions.Item>
                    <Descriptions.Item label="vy (m/s)">{particleInfo.last.vel.y.toExponential(3)}</Descriptions.Item>
                    <Descriptions.Item label="vz (m/s)">{particleInfo.last.vel.z.toExponential(3)}</Descriptions.Item>
                    <Descriptions.Item label="E_f (MeV)">{(particleInfo.last.energy / MeV).toFixed(6)}</Descriptions.Item>
                    <Descriptions.Item label="steps">{particleInfo.last.step}</Descriptions.Item>
                    <Descriptions.Item label="t (ns)">{(particleInfo.last.t * 1e9).toFixed(4)}</Descriptions.Item>
                  </Descriptions>
                </Card>
              )}
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
              <PlayCircleOutlined style={{ fontSize: 48, opacity: 0.3 }} />
              <p>设置参数后点击 TRACE 追踪粒子轨迹</p>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
}