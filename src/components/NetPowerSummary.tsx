import { Card, Slider, Statistic, Row, Col, Alert, Tag, Divider } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { NetPowerResult } from '../physics/netPower';
import { formatPower } from '../physics/format';

interface NetPowerSummaryProps {
  result: NetPowerResult;
  fusionPower: number;
  pHeating: number;
  pMagnet: number;
  pVacuum: number;
  pCooling: number;
  pPowerElec: number;
  pRadiation: number;
  onPlantChange: (key: string, value: number) => void;
}

const PLANT_ITEMS = [
  { key: 'pHeating', label: '外部加热', color: '#ef4444' },
  { key: 'pMagnet', label: '磁场系统', color: '#f59e0b' },
  { key: 'pVacuum', label: '真空系统', color: '#eab308' },
  { key: 'pCooling', label: '冷却系统', color: '#06b6d4' },
  { key: 'pPowerElec', label: '功率电子', color: '#a855f7' },
  { key: 'pRadiation', label: '辐射损失', color: '#6b7280' },
];

export default function NetPowerSummary({
  result,
  fusionPower,
  pHeating,
  pMagnet,
  pVacuum,
  pCooling,
  pPowerElec,
  pRadiation,
  onPlantChange,
}: NetPowerSummaryProps) {
  const values: Record<string, number> = { pHeating, pMagnet, pVacuum, pCooling, pPowerElec, pRadiation };
  const pieData = PLANT_ITEMS.map((it) => ({ name: it.label, value: values[it.key], color: it.color })).filter((d) => d.value > 0);

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">净电输出 P_net = P_gross − P_plant（最终答案）</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={24}>
        <Col xs={24} md={10}>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>厂用电分项（可调，探索经济性边界）</div>
          {PLANT_ITEMS.map((it) => (
            <div key={it.key} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#9ca3af' }}>{it.label}</span>
                <span style={{ color: it.color }} className="fdec-mono">{formatPower(values[it.key])}</span>
              </div>
              <Slider
                min={0}
                max={200}
                step={1}
                value={Math.round(values[it.key] / 1e6)}
                onChange={(v) => onPlantChange(it.key, v * 1e6)}
                style={{ margin: '0 0 4px 0' }}
                tooltip={{ formatter: (v) => `${v} MW` }}
                disabled={it.key === 'pHeating'}
              />
              {it.key === 'pHeating' && (
                <div style={{ fontSize: 10, color: '#6b7280' }}>由 α 抽取率与 P_required 自动决定</div>
              )}
            </div>
          ))}
        </Col>
        <Col xs={24} md={14}>
          <Row gutter={[8, 8]}>
            <Col span={8}>
              <Statistic title="毛电 P_gross" value={formatPower(result.pGross)} valueStyle={{ color: '#22c55e' }} />
            </Col>
            <Col span={8}>
              <Statistic title="厂用电 P_plant" value={formatPower(result.pPlant.total)} valueStyle={{ color: '#ef4444' }} />
            </Col>
            <Col span={8}>
              <Statistic title="聚变功率" value={formatPower(fusionPower)} valueStyle={{ color: '#9ca3af' }} />
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />

          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>净电输出 P_net</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: result.isViable ? '#3b82f6' : '#ef4444' }} className="fdec-mono">
              {formatPower(result.pNet)}
            </div>
            <div style={{ fontSize: 18, color: result.isViable ? '#3b82f6' : '#ef4444' }} className="fdec-mono">
              η_net = {(result.etaNet * 100).toFixed(2)}%
            </div>
            {result.isViable ? (
              <Tag color="success" style={{ marginTop: 8 }}>物理上自洽的直接发电闭环</Tag>
            ) : (
              <Tag color="error" style={{ marginTop: 8 }}>净输出为负：当前参数下不经济</Tag>
            )}
          </div>

          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#e5e7eb' }} formatter={(v: unknown) => formatPower(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Col>
      </Row>

      <div style={{ marginTop: 8 }}>
        {result.isViable ? (
          <Alert type="success" showIcon message={`1 GW D-T 源在当前参数下净输出 ${formatPower(result.pNet)}（η_net=${(result.etaNet * 100).toFixed(1)}%），直接发电闭环成立`} />
        ) : (
          <Alert type="error" showIcon message={`净输出 ${formatPower(result.pNet)} 为负：厂用电 ${formatPower(result.pPlant.total)} 吃掉毛电 ${formatPower(result.pGross)}，当前参数下直接发电不经济——这正是科学模型的价值`} />
        )}
      </div>
    </Card>
  );
}