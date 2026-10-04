import { useState, useMemo } from 'react';
import { Card, Select, Row, Col, Statistic, Tag, Typography, Table, Divider } from 'antd';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { NuclearMaterials, sweepThickness, requiredThicknessForCapture } from '../physics/nuclear';
import type { NuclearMaterial } from '../physics/nuclear';

const { Text } = Typography;

export default function NuclearConversionPanel() {
  const [materialKey, setMaterialKey] = useState('Li6');

  const material: NuclearMaterial = useMemo(
    () => NuclearMaterials.find((m) => m.key === materialKey) ?? NuclearMaterials[0],
    [materialKey]
  );

  const sweep = useMemo(() => sweepThickness(material), [material]);
  const chartData = sweep.map((s) => ({
    thickness: s.thickness,
    capture: s.capture * 100,
    chargedEnergy: s.chargedEnergy,
  }));

  const thickness90 = requiredThicknessForCapture(material.density, material.crossSection14MeV, 0.9);
  const thickness99 = requiredThicknessForCapture(material.density, material.crossSection14MeV, 0.99);

  const columns = [
    {
      title: '厚度 (cm)',
      dataIndex: 'thickness',
      render: (v: number) => <span className="fdec-mono">{(v * 100).toFixed(1)}</span>,
    },
    {
      title: '捕获概率',
      dataIndex: 'capture',
      render: (v: number) => <span className="fdec-mono">{(v * 100).toFixed(2)}%</span>,
    },
    {
      title: '带电能量 (MeV)',
      dataIndex: 'chargedEnergy',
      render: (v: number) => <span className="fdec-mono">{v.toFixed(3)}</span>,
    },
  ];

  const tableData = sweep.map((s, i) => ({
    key: i,
    thickness: s.thickness,
    capture: s.capture,
    chargedEnergy: s.chargedEnergy,
  }));

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">核反应转换层：P = 1 − exp(−nσx)（材料选择 + 厚度扫描）</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={16}>
        <Col xs={24} md={10}>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>转换材料</Text>
            <Select
              value={materialKey}
              onChange={setMaterialKey}
              style={{ width: '100%', marginTop: 4 }}
              options={NuclearMaterials.map((m) => ({
                value: m.key,
                label: `${m.name} — ${m.reaction}`,
              }))}
            />
          </div>
          <div style={{ background: '#0d1421', borderRadius: 4, padding: 12, marginBottom: 12 }}>
            <div style={{ marginBottom: 6 }}>
              <Tag color="blue">{material.reaction}</Tag>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{material.productDescription}</div>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic title="数密度 n" value={material.density.toExponential(2)} valueStyle={{ color: '#9ca3af', fontSize: 12 }} />
              </Col>
              <Col span={12}>
                <Statistic title="σ (14 MeV)" value={material.crossSection14MeV.toExponential(2)} suffix="m²" valueStyle={{ color: '#9ca3af', fontSize: 12 }} />
              </Col>
              <Col span={12}>
                <Statistic title="带电份额" value={(material.chargedEnergyFraction * 100).toFixed(0)} suffix="%" valueStyle={{ color: '#3b82f6', fontSize: 12 }} />
              </Col>
              <Col span={12}>
                <Statistic title="x₉₀ (90%)" value={(thickness90 * 100).toFixed(2)} suffix="cm" valueStyle={{ color: '#22c55e', fontSize: 12 }} />
              </Col>
            </Row>
          </div>
          <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            <div>达到 90% 捕获需 <span className="fdec-mono" style={{ color: '#22c55e' }}>{(thickness90 * 100).toFixed(2)} cm</span></div>
            <div>达到 99% 捕获需 <span className="fdec-mono" style={{ color: '#f59e0b' }}>{(thickness99 * 100).toFixed(2)} cm</span></div>
          </div>
        </Col>
        <Col xs={24} md={14}>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>
            厚度扫描：捕获概率 P(x) 与带电粒子能量随厚度变化
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="thickness" tickFormatter={(v) => `${(v * 100).toFixed(0)}`} stroke="#6b7280" fontSize={10} label={{ value: '厚度 (cm)', position: 'insideBottom', offset: -2, fill: '#9ca3af', fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={10} label={{ value: '捕获 (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={10} label={{ value: '能量 (MeV)', angle: 90, position: 'insideRight', fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={90} yAxisId="left" stroke="#22c55e" strokeDasharray="4 3" label={{ value: '90%', fill: '#22c55e', fontSize: 9 }} />
              <Line yAxisId="left" type="monotone" dataKey="capture" stroke="#3b82f6" strokeWidth={2} name="捕获概率 %" dot={{ r: 2 }} />
              <Line yAxisId="right" type="monotone" dataKey="chargedEnergy" stroke="#f59e0b" strokeWidth={2} name="带电能量 MeV" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
          <Table
            size="small"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            style={{ marginTop: 8 }}
            rowKey="key"
          />
        </Col>
      </Row>
    </Card>
  );
}