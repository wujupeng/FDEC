import { Card, Tag, Progress, Row, Col } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { FuelPaths, fuelDirectPower } from '../physics/fuels';
import { formatPower } from '../physics/format';

interface FuelComparisonProps {
  fusionPower: number;
  eta: number;
}

const CHARGED_COLOR = '#22c55e';
const NEUTRON_COLOR = '#06b6d4';

export default function FuelComparison({ fusionPower, eta }: FuelComparisonProps) {
  const pieData = FuelPaths.map((f) => ({
    name: f.name,
    charged: f.chargedFraction * 100,
    neutron: f.neutronFraction * 100,
  }));

  const barData = FuelPaths.map((f) => ({
    name: f.name,
    powerMW: fuelDirectPower(fusionPower, f, eta) / 1e6,
    chargedPct: f.chargedFraction * 100,
  }));

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">燃料路径对比：直接发电的终极问题是燃料选择</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={16}>
        {FuelPaths.map((f) => (
          <Col xs={24} md={8} key={f.key}>
            <Card
              size="small"
              style={{ background: '#0d1421', border: `1px solid ${f.chargedFraction >= 1 ? '#22c55e' : '#f59e0b'}` }}
              title={
                <span>
                  <Tag color={f.chargedFraction >= 1 ? 'success' : 'orange'}>{f.name}</Tag>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{f.reaction}</span>
                </span>
              }
            >
              <div style={{ fontSize: 12, color: '#d1d5db', marginBottom: 8 }}>{f.products}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>{f.note}</div>
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: '#9ca3af', fontSize: 11 }}>带电份额</span>
                <Progress
                  percent={f.chargedFraction * 100}
                  strokeColor={CHARGED_COLOR}
                  format={(p) => `${p!.toFixed(1)}%`}
                  size="small"
                />
              </div>
              <div>
                <span style={{ color: '#9ca3af', fontSize: 11 }}>中子份额</span>
                <Progress
                  percent={f.neutronFraction * 100}
                  strokeColor={NEUTRON_COLOR}
                  format={(p) => `${p!.toFixed(1)}%`}
                  size="small"
                />
              </div>
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <span style={{ color: '#9ca3af' }}>直接电功率 (η={eta.toFixed(2)})：</span>{' '}
                <span style={{ color: '#22c55e', fontWeight: 600 }} className="fdec-mono">
                  {formatPower(fuelDirectPower(fusionPower, f, eta))}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>带电 / 中子能量份额</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="charged" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHARGED_COLOR} />
                ))}
              </Pie>
              <Pie data={pieData} dataKey="neutron" nameKey="name" cx="50%" cy="50%" outerRadius={36}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={NEUTRON_COLOR} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#e5e7eb' }}
                formatter={(v: unknown, n: unknown) => [`${Number(v).toFixed(1)}%`, n === 'charged' ? '带电' : '中子']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>
            各燃料直接电功率（η = {eta.toFixed(2)}）
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} unit=" MW" />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#e5e7eb' }}
                formatter={(v: unknown) => [`${Number(v).toFixed(1)} MW`, '直接电功率']}
              />
              <Bar dataKey="powerMW" fill="#22c55e" radius={[4, 4, 0, 0]}>
                <LabelList position="top" formatter={(v: unknown) => Number(v).toFixed(0)} style={{ fill: '#9ca3af', fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
