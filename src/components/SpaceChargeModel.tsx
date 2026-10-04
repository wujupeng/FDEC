import { Card, Slider, Alert, Statistic, Row, Col, Tag } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { computeSpaceCharge, sweepGapDistance } from '../physics/childLangmuir';
import type { AlphaElectricalResult } from '../physics/fusion';
import { formatCurrent, formatArea, formatScientific } from '../physics/format';

interface SpaceChargeModelProps {
  alpha: AlphaElectricalResult;
  voltage: number;
  gapDistance: number;
  collectionArea: number;
  onVoltageChange: (v: number) => void;
  onGapChange: (d: number) => void;
  onAreaChange: (a: number) => void;
}

const BREAKDOWN_FIELD = 40e6;

export default function SpaceChargeModel({
  alpha,
  voltage,
  gapDistance,
  collectionArea,
  onVoltageChange,
  onGapChange,
  onAreaChange,
}: SpaceChargeModelProps) {
  const requiredCurrent = alpha.alphaCurrent;
  const result = computeSpaceCharge(voltage, gapDistance, collectionArea, requiredCurrent);
  const fieldStrength = voltage / gapDistance;
  const fieldBreakdown = fieldStrength > BREAKDOWN_FIELD;

  const gaps = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0];
  const sweep = sweepGapDistance(voltage, gaps, requiredCurrent);
  const chartData = sweep.map((d) => ({
    gap: d.gap * 1000,
    area: isFinite(d.requiredArea) ? d.requiredArea : null,
  }));

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">空间电荷限制模型（Child–Langmuir 定律）</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <div className="fdec-equation">
        J_CL = (4/9)·ε₀·√(2q_α/m_α)·V^(3/2) / d² &nbsp;｜&nbsp; I_max = J·A &nbsp;｜&nbsp; 需求电流 I_α = {formatCurrent(requiredCurrent)}
      </div>

      <Row gutter={24}>
        <Col xs={24} md={10}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#9ca3af' }}>电压 V = {(voltage / 1e6).toFixed(2)} MV</span>
          </div>
          <Slider min={0.1} max={3.5} step={0.05} value={voltage / 1e6} onChange={(v) => onVoltageChange(v * 1e6)} />

          <div style={{ marginBottom: 4, marginTop: 16 }}>
            <span style={{ color: '#9ca3af' }}>电极间距 d = {(gapDistance * 1000).toFixed(1)} mm</span>
          </div>
          <Slider min={1} max={500} step={1} value={gapDistance * 1000} onChange={(v) => onGapChange(v / 1000)} />

          <div style={{ marginBottom: 4, marginTop: 16 }}>
            <span style={{ color: '#9ca3af' }}>收集面积 A = {collectionArea.toFixed(3)} m²</span>
          </div>
          <Slider min={0.001} max={5} step={0.001} value={collectionArea} onChange={(v) => onAreaChange(v)} />
        </Col>

        <Col xs={24} md={14}>
          <Row gutter={[12, 12]}>
            <Col span={12}>
              <Statistic title="最大电流密度 J_CL" value={formatScientific(result.currentDensity, 3) + ' A/m²'} valueStyle={{ color: '#fbbf24', fontSize: 15 }} />
            </Col>
            <Col span={12}>
              <Statistic title="最大可过电流 I_max" value={formatCurrent(result.totalCurrent)} valueStyle={{ color: '#22c55e' }} />
            </Col>
            <Col span={12}>
              <Statistic title="所需收集面积" value={formatArea(result.requiredArea)} valueStyle={{ color: '#a855f7', fontSize: 15 }} />
            </Col>
            <Col span={12}>
              <Statistic title="电场强度 E = V/d" value={formatScientific(fieldStrength, 3) + ' V/m'} valueStyle={{ color: fieldBreakdown ? '#ef4444' : '#93c5fd', fontSize: 15 }} />
            </Col>
          </Row>
          <div style={{ marginTop: 12 }}>
            {result.isLimited ? (
              <Alert
                type="error"
                showIcon
                message={
                  <span>
                    空间电荷受限：I_max &lt; I_α，当前结构无法承载全部 α 粒子流。{' '}
                    <Tag color="red">需扩大面积或减小间距</Tag>
                  </span>
                }
              />
            ) : (
              <Alert type="success" showIcon message={<span>当前结构可承载 α 粒子流（I_max ≥ I_α）</span>} />
            )}
            {fieldBreakdown && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
                message={`电场 ${(fieldStrength / 1e6).toFixed(1)} MV/m 超过真空击穿阈值 ~40 MV/m，需分级降压`}
              />
            )}
          </div>
        </Col>
      </Row>

      <div style={{ marginTop: 16 }}>
        <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>
          电极间距 d（mm）→ 满足 I_α 所需收集面积 A（m²）
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="gap"
              stroke="#9ca3af"
              fontSize={11}
              label={{ value: 'd (mm)', position: 'insideBottom', offset: -2, fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              unit=" m²"
              domain={[0, 'dataMax']}
            />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#e5e7eb' }}
              formatter={(v: unknown) => [v == null ? '∞' : `${Number(v).toFixed(3)} m²`, '所需面积']}
              labelFormatter={(l) => `d = ${l} mm`}
            />
            <ReferenceLine y={collectionArea} stroke="#a855f7" strokeDasharray="4 4" label={{ value: '当前 A', fill: '#a855f7', fontSize: 10 }} />
            <Line type="monotone" dataKey="area" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}