import { useState, useMemo, useCallback } from 'react';
import { Card, Space, Button, InputNumber, Select, Row, Col, Statistic, Progress, Divider, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { generateIsotropicSource } from '../simulation/particle/ParticleSource';
import { transportBatch, TransportConfig } from '../simulation/transport/ParticleTransport';
import { createSimpleGeometry } from '../simulation/geometry/ReactorGeometry';
import { createUniformE, createNoE } from '../simulation/fields/ElectricField';
import { createUniformB, createNoB } from '../simulation/fields/MagneticField';
import { computeCaptureEfficiency } from '../simulation/analysis/CaptureEfficiency';
import { computeFateStats } from '../simulation/analysis/ParticleFate';
import { BatchTransportResult } from '../simulation/transport/ParticleTransport';

const { Text } = Typography;

export default function FateMapPanel() {
  const [particleCount, setParticleCount] = useState(1000);
  const [bField, setBField] = useState(5);
  const [eFieldOn, setEFieldOn] = useState(false);
  const [eFieldMVm, setEFieldMVm] = useState(10);
  const [running, setRunning] = useState(false);
  const [batch, setBatch] = useState<BatchTransportResult | null>(null);
  const [runTime, setRunTime] = useState(0);

  const handleRun = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const geometry = createSimpleGeometry();
      const particles = generateIsotropicSource({
        species: 'alpha',
        energyMeV: 3.5,
        count: particleCount,
        center: { x: 0, y: 0, z: 0 },
        radius: 0.01,
        relativistic: false,
      });

      const config: TransportConfig = {
        mode: 'classical',
        dt: 1e-12,
        maxSteps: 20000,
        eField: eFieldOn
          ? createUniformE({ field: { x: 0, y: 0, z: eFieldMVm * 1e6 } })
          : createNoE(),
        bField: bField > 0
          ? createUniformB({ field: { x: 0, y: 0, z: bField } })
          : createNoB(),
        geometry,
        recordTrajectory: false,
        trajectoryStride: 1,
      };

      const t0 = performance.now();
      const result = transportBatch(particles, config);
      const t1 = performance.now();

      setBatch(result);
      setRunTime(t1 - t0);
      setRunning(false);
    }, 50);
  }, [particleCount, bField, eFieldOn, eFieldMVm]);

  const eff = useMemo(() => batch ? computeCaptureEfficiency(batch, 1000) : null, [batch]);
  const stats = useMemo(() => batch ? computeFateStats(batch) : null, [batch]);

  const pieData = useMemo(() => {
    if (!batch) return [];
    return [
      { name: 'Converter', value: batch.captured, color: '#3fb950' },
      { name: 'Wall', value: batch.wallHit, color: '#f85149' },
      { name: 'Escape', value: batch.escaped, color: '#d29922' },
      { name: 'Flying', value: batch.flying, color: '#58a6ff' },
    ].filter(d => d.value > 0);
  }, [batch]);

  const energyData = useMemo(() => {
    if (!eff) return [];
    return [
      { name: 'DEC', power: eff.deposition.powerCapturedMW, color: '#3fb950' },
      { name: 'Wall', power: eff.deposition.powerWallMW, color: '#f85149' },
      { name: 'Escape', power: eff.deposition.powerEscapedMW, color: '#d29922' },
    ];
  }, [eff]);

  return (
    <Card size="small" style={{ background: 'var(--fdec-panel)' }} title={<span className="fdec-section-title">🎯 Particle Fate Map — 多粒子命运统计</span>}>
      <Row gutter={16}>
        <Col span={6}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Text strong style={{ color: '#e5e7eb' }}>仿真参数</Text>
            <div>
              <Text style={{ color: '#9ca3af' }}>粒子数: </Text>
              <Select value={particleCount} onChange={setParticleCount} style={{ width: 120 }}
                options={[
                  { value: 100, label: '100' },
                  { value: 500, label: '500' },
                  { value: 1000, label: '1,000' },
                  { value: 5000, label: '5,000' },
                  { value: 10000, label: '10,000' },
                ]}
              />
            </div>
            <div>
              <Text style={{ color: '#9ca3af' }}>B_z (T): </Text>
              <InputNumber value={bField} onChange={(v) => v !== null && setBField(v)} step={0.5} min={0} max={50} style={{ width: 100 }} />
            </div>
            <div>
              <Text style={{ color: '#9ca3af' }}>E_z (MV/m): </Text>
              <InputNumber value={eFieldMVm} onChange={(v) => v !== null && setEFieldMVm(v)} disabled={!eFieldOn} step={1} min={0} max={100} style={{ width: 100 }} />
              <Button size="small" type={eFieldOn ? 'primary' : 'default'} onClick={() => setEFieldOn(!eFieldOn)} style={{ marginLeft: 4 }}>
                {eFieldOn ? 'ON' : 'OFF'}
              </Button>
            </div>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleRun} loading={running} block>
              RUN {particleCount.toLocaleString()} PARTICLES
            </Button>
            {runTime > 0 && <Text style={{ color: '#6b7280', fontSize: 11 }}>耗时: {runTime.toFixed(0)} ms</Text>}
          </Space>
        </Col>

        <Col span={18}>
          {batch && eff && stats ? (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Row gutter={8}>
                <Col span={4}><Statistic title="Captured" value={batch.captured} valueStyle={{ color: '#3fb950', fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="Wall" value={batch.wallHit} valueStyle={{ color: '#f85149', fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="Escaped" value={batch.escaped} valueStyle={{ color: '#d29922', fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="Flying" value={batch.flying} valueStyle={{ color: '#58a6ff', fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="η_capture" value={`${(eff.particleCaptureRate * 100).toFixed(1)}%`} valueStyle={{ color: '#3fb950', fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="η_E" value={`${(eff.energyCaptureRate * 100).toFixed(1)}%`} valueStyle={{ color: '#58a6ff', fontSize: 16 }} /></Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Card size="small" style={{ background: '#0d1117' }} title={<Text style={{ color: '#9ca3af', fontSize: 12 }}>Particle Fate Distribution</Text>}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(d: any) => `${d.name}: ${d.value}`}>
                          {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: '#0d1117' }} title={<Text style={{ color: '#9ca3af', fontSize: 12 }}>Energy Deposition (MW)</Text>}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={energyData}>
                        <CartesianGrid stroke="#1f2937" />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', fontSize: 11 }} />
                        <Bar dataKey="power" fill="#58a6ff" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>

              <Card size="small" style={{ background: '#0d1117' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>粒子捕获率 (by count)</Text>
                    <Progress percent={eff.particleCaptureRate * 100} strokeColor="#3fb950" format={(p) => `${p!.toFixed(1)}%`} />
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>壁面损失率</Text>
                    <Progress percent={eff.particleWallRate * 100} strokeColor="#f85149" format={(p) => `${p!.toFixed(1)}%`} />
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>逃逸率</Text>
                    <Progress percent={eff.particleEscapeRate * 100} strokeColor="#d29922" format={(p) => `${p!.toFixed(1)}%`} />
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>能量捕获率 (by energy)</Text>
                    <Progress percent={eff.energyCaptureRate * 100} strokeColor="#58a6ff" format={(p) => `${p!.toFixed(1)}%`} />
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>能量壁面沉积</Text>
                    <Progress percent={eff.energyWallFraction * 100} strokeColor="#f85149" format={(p) => `${p!.toFixed(1)}%`} />
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>能量逃逸</Text>
                    <Progress percent={eff.energyEscapeFraction * 100} strokeColor="#d29922" format={(p) => `${p!.toFixed(1)}%`} />
                  </Col>
                </Row>
                <Divider style={{ margin: '8px 0' }} />
                <Text style={{ color: '#d29922', fontSize: 11 }}>⚠ {eff.note}</Text>
              </Card>
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
              <ThunderboltOutlined style={{ fontSize: 48, opacity: 0.3 }} />
              <p>点击 RUN 启动多粒子仿真</p>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
}