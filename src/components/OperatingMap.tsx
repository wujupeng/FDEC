import { Card, Typography, Tag, Row, Col, Statistic } from 'antd';
import { sweepOperatingMap, findOperatingBoundary } from '../physics/spaceCharge';
import { formatVoltage } from '../physics/format';

const { Text } = Typography;

interface OperatingMapProps {
  requiredCurrent: number;
  collectionArea: number;
}

const VOLTAGES = [0.5e6, 0.75e6, 1e6, 1.25e6, 1.5e6, 1.75e6, 2e6, 2.5e6, 3e6];
const GAPS = [0.005, 0.008, 0.01, 0.015, 0.02, 0.03, 0.05, 0.08, 0.1];

function rScColor(rSc: number): string {
  if (rSc < 0.3) return '#22c55e';
  if (rSc < 0.5) return '#84cc16';
  if (rSc < 0.7) return '#eab308';
  if (rSc < 1) return '#f59e0b';
  if (rSc < 2) return '#f97316';
  return '#ef4444';
}

export default function OperatingMap({ requiredCurrent, collectionArea }: OperatingMapProps) {
  const points = sweepOperatingMap(VOLTAGES, GAPS, requiredCurrent, collectionArea);
  const boundaries = findOperatingBoundary(VOLTAGES, GAPS, requiredCurrent, collectionArea);

  const safeCount = points.filter((p) => p.safe).length;
  const totalCount = points.length;
  const bestPoint = points.reduce((best, p) => (p.rSc < best.rSc ? p : best), points[0]);
  const worstSafe = points.filter((p) => p.safe).reduce((w, p) => (p.rSc > w.rSc ? p : w), { rSc: -Infinity } as typeof points[0]);

  const cellSize = 38;
  const labelWidth = 60;
  const labelHeight = 24;

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">空间电荷 Operating Map：电压 × 间距参数扫描（R_SC &lt; 1 为可运行区）</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={16}>
        <Col xs={24} md={16}>
          <div style={{ overflowX: 'auto' }}>
            <svg
              width={labelWidth + VOLTAGES.length * cellSize}
              height={labelHeight + GAPS.length * cellSize}
            >
              <text x={labelWidth + (VOLTAGES.length * cellSize) / 2} y={14} textAnchor="middle" fill="#9ca3af" fontSize={11}>
                电压 V (MV)
              </text>
              {VOLTAGES.map((v, i) => (
                <text
                  key={`v-${i}`}
                  x={labelWidth + i * cellSize + cellSize / 2}
                  y={labelHeight - 6}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={9}
                >
                  {(v / 1e6).toFixed(2)}
                </text>
              ))}
              <text x={14} y={labelHeight + (GAPS.length * cellSize) / 2} textAnchor="middle" fill="#9ca3af" fontSize={11} transform={`rotate(-90 14 ${labelHeight + (GAPS.length * cellSize) / 2})`}>
                间距 d (cm)
              </text>
              {GAPS.map((g, j) => (
                <text
                  key={`g-${j}`}
                  x={labelWidth - 6}
                  y={labelHeight + j * cellSize + cellSize / 2 + 3}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize={9}
                >
                  {(g * 100).toFixed(1)}
                </text>
              ))}
              {points.map((p) => {
                const i = VOLTAGES.indexOf(p.voltage);
                const j = GAPS.indexOf(p.gap);
                const x = labelWidth + i * cellSize;
                const y = labelHeight + j * cellSize;
                return (
                  <g key={`${i}-${j}`}>
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      fill={rScColor(p.rSc)}
                      fillOpacity={0.75}
                      stroke="#1f2937"
                      strokeWidth={0.5}
                    />
                    <text x={x + cellSize / 2} y={y + cellSize / 2 + 3} textAnchor="middle" fill="#0d1421" fontSize={8} fontWeight={600}>
                      {p.rSc < 0.01 ? p.rSc.toFixed(3) : p.rSc < 1 ? p.rSc.toFixed(2) : p.rSc.toFixed(1)}
                    </text>
                  </g>
                );
              })}
              {boundaries.map((b, i) => {
                const vi = VOLTAGES.indexOf(b.voltage);
                const gi = GAPS.indexOf(b.gapBoundary);
                if (vi < 0 || gi < 0) return null;
                const x = labelWidth + vi * cellSize + cellSize / 2;
                const y = labelHeight + gi * cellSize;
                return (
                  <circle key={`b-${i}`} cx={x} cy={y} r={4} fill="none" stroke="#fff" strokeWidth={1.5} />
                );
              })}
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', fontSize: 10, color: '#9ca3af' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#22c55e', marginRight: 4 }} />R&lt;0.3 安全</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#eab308', marginRight: 4 }} />R≈0.5-0.7 边界</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f59e0b', marginRight: 4 }} />R≈1 临界</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', marginRight: 4 }} />R&gt;1 空间电荷受限</span>
            <span>○ = 边界点</span>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic title="扫描点数" value={totalCount} valueStyle={{ color: '#9ca3af' }} />
            </Col>
            <Col span={12}>
              <Statistic title="可运行点" value={safeCount} suffix={`/${totalCount}`} valueStyle={{ color: safeCount > 0 ? '#22c55e' : '#ef4444' }} />
            </Col>
            <Col span={12}>
              <Statistic title="最优 R_SC" value={bestPoint.rSc.toFixed(3)} valueStyle={{ color: '#22c55e' }} />
            </Col>
            <Col span={12}>
              <Statistic title="最优电压" value={formatVoltage(bestPoint.voltage)} valueStyle={{ color: '#3b82f6' }} />
            </Col>
          </Row>
          <div style={{ marginTop: 12, fontSize: 11, color: '#9ca3af' }}>
            <div style={{ marginBottom: 4 }}>
              <Text strong style={{ color: '#e5e7eb' }}>最优参数：</Text>
            </div>
            <div>V = {formatVoltage(bestPoint.voltage)}，d = {(bestPoint.gap * 100).toFixed(2)} cm</div>
            <div>E = {formatVoltage(bestPoint.eField)}/m</div>
            {worstSafe.rSc >= 0 && (
              <div style={{ marginTop: 6 }}>
                <Tag color="warning">边界点 R={worstSafe.rSc.toFixed(3)}</Tag>
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 10 }}>
              白圈标记 R_SC=1 边界：左侧（小间距/高电压）可运行，右侧不可运行。
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
}