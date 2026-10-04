import { Card, Slider, Table, Tag } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { efficiencySweep, alphaElectricPower } from '../physics/fusion';
import { formatPower } from '../physics/format';

interface AlphaEfficiencyTableProps {
  fusionPower: number;
  etaAlpha: number;
  onEtaChange: (eta: number) => void;
}

export default function AlphaEfficiencyTable({ fusionPower, etaAlpha, onEtaChange }: AlphaEfficiencyTableProps) {
  const sweep = efficiencySweep(fusionPower);
  const chartData = sweep.map((d) => ({
    eta: `${(d.eta * 100).toFixed(0)}%`,
    powerMW: d.power / 1e6,
  }));
  const currentPower = alphaElectricPower(fusionPower, etaAlpha);

  const columns = [
    {
      title: 'α 直接转换效率 η_α',
      dataIndex: 'eta',
      key: 'eta',
      render: (v: number) => <Tag color="orange">{(v * 100).toFixed(0)}%</Tag>,
    },
    {
      title: '1 GW 聚变源得到的电',
      dataIndex: 'power',
      key: 'power',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#22c55e' }}>{formatPower(v)}</span>,
    },
  ];

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">α 粒子直接转换效率扫描</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#9ca3af' }}>η_α = {(etaAlpha * 100).toFixed(0)}% → </span>
        <span style={{ color: '#22c55e', fontWeight: 600 }} className="fdec-mono">{formatPower(currentPower)}</span>
      </div>
      <Slider
        min={0}
        max={100}
        step={1}
        value={Math.round(etaAlpha * 100)}
        onChange={(v) => onEtaChange(v / 100)}
        marks={{ 0: '0%', 20: '20%', 50: '50%', 70: '70%', 100: '100%' }}
        tooltip={{ formatter: (v) => `${v}%` }}
      />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        <div style={{ flex: '1 1 280px' }}>
          <Table
            size="small"
            dataSource={sweep}
            columns={columns}
            rowKey="eta"
            pagination={false}
            style={{ background: 'transparent' }}
          />
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="eta" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} unit=" MW" />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#e5e7eb' }}
                formatter={(v: unknown) => [`${Number(v).toFixed(1)} MW`, '电功率']}
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