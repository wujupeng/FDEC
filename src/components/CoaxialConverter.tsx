import { Card, Slider, Statistic, Row, Col, Tag, Alert } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { computeCoaxialField, sweepRadius, fieldRiskLevel } from '../physics/coaxialField';


interface CoaxialConverterProps {
  voltage: number;
  innerRadius: number;
  outerRadius: number;
  onVoltageChange: (v: number) => void;
  onInnerChange: (r: number) => void;
  onOuterChange: (r: number) => void;
}

export default function CoaxialConverter({
  voltage,
  innerRadius,
  outerRadius,
  onVoltageChange,
  onInnerChange,
  onOuterChange,
}: CoaxialConverterProps) {
  const field = computeCoaxialField(voltage, innerRadius, outerRadius);
  const chartData = sweepRadius(voltage, innerRadius, outerRadius).map((d) => ({
    r: +(d.r * 1000).toFixed(2),
    eCoaxial: d.eCoaxial / 1e6,
    eFlat: d.eFlat / 1e6,
  }));
  const risk = fieldRiskLevel(field.eMax);

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">同轴圆柱直接转换器：E(r) = V / (r·ln(b/a))</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <div className="fdec-equation">
        E(r) = V / (r·ln(b/a)) &nbsp;｜&nbsp; E_max = E(a) 内电极表面 &nbsp;｜&nbsp; 平板对比 E_flat = V/(b−a)
      </div>

      <Row gutter={24}>
        <Col xs={24} md={10}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#9ca3af' }}>电压 V = {(voltage / 1e6).toFixed(2)} MV</span>
          </div>
          <Slider min={0.5} max={3.5} step={0.05} value={voltage / 1e6} onChange={(v) => onVoltageChange(v * 1e6)} />

          <div style={{ marginBottom: 4, marginTop: 14 }}>
            <span style={{ color: '#9ca3af' }}>内半径 a = {(innerRadius * 1000).toFixed(1)} mm</span>
          </div>
          <Slider min={2} max={50} step={1} value={innerRadius * 1000} onChange={(v) => onInnerChange(v / 1000)} />

          <div style={{ marginBottom: 4, marginTop: 14 }}>
            <span style={{ color: '#9ca3af' }}>外半径 b = {(outerRadius * 1000).toFixed(0)} mm</span>
          </div>
          <Slider min={60} max={500} step={10} value={outerRadius * 1000} onChange={(v) => onOuterChange(v / 1000)} />
        </Col>
        <Col xs={24} md={14}>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic title="E_max 内电极" value={`${(field.eMax / 1e6).toFixed(1)} MV/m`} valueStyle={{ color: risk.color }} />
            </Col>
            <Col span={12}>
              <Statistic title="E_min 外电极" value={`${(field.eMin / 1e6).toFixed(1)} MV/m`} valueStyle={{ color: '#22c55e' }} />
            </Col>
            <Col span={12}>
              <Statistic title="平板对比 E_flat" value={`${(field.eFlat / 1e6).toFixed(1)} MV/m`} valueStyle={{ color: '#6b7280' }} />
            </Col>
            <Col span={12}>
              <Statistic title="E_max/E_flat" value={field.ratio.toFixed(2)} valueStyle={{ color: field.ratio < 1 ? '#22c55e' : '#ef4444' }} />
            </Col>
          </Row>
          <div style={{ marginTop: 10 }}>
            <Tag color={risk.level}>{risk.label}</Tag>
            {field.ratio < 1 ? (
              <Alert type="success" showIcon style={{ marginTop: 8 }} message={`同轴结构 E_max 比平板低 ${((1 - field.ratio) * 100).toFixed(0)}%，缓解击穿`} />
            ) : (
              <Alert type="warning" showIcon style={{ marginTop: 8 }} message="当前几何下同轴 E_max 反而高于平板，需增大 b/a" />
            )}
          </div>
        </Col>
      </Row>

      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>
          径向电场分布 E(r)：同轴（橙）vs 平板（灰）
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="r" stroke="#9ca3af" fontSize={11} unit=" mm" label={{ value: 'r (mm)', position: 'insideBottom', offset: -2, fill: '#9ca3af' }} />
            <YAxis stroke="#9ca3af" fontSize={11} unit=" MV/m" />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#e5e7eb' }} formatter={(v: unknown) => `${Number(v).toFixed(1)} MV/m`} labelFormatter={(l) => `r = ${l} mm`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={10} stroke="#22c55e" strokeDasharray="3 3" label={{ value: '10 MV/m', fill: '#22c55e', fontSize: 10 }} />
            <ReferenceLine y={30} stroke="#eab308" strokeDasharray="3 3" label={{ value: '30 MV/m', fill: '#eab308', fontSize: 10 }} />
            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '50 MV/m', fill: '#ef4444', fontSize: 10 }} />
            <Line type="monotone" dataKey="eCoaxial" name="同轴 E(r)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="eFlat" name="平板 E_flat" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}