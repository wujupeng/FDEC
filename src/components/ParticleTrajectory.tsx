import { useState, useMemo } from 'react';
import { Card, Slider, Row, Col, Statistic, Tag, Typography, Divider } from 'antd';
import { simulateAlphaInBField, energyDrift } from '../physics/lorentz';
import { PhysicalConstants, UnitFactors } from '../physics/constants';

const { Text } = Typography;

const ALPHA_ENERGY_MEV = 3.5;
const ALPHA_SPEED = Math.sqrt((2 * ALPHA_ENERGY_MEV * UnitFactors.MeV) / PhysicalConstants.mAlpha);

export default function ParticleTrajectory() {
  const [bField, setBField] = useState(10);
  const [pitchAngle, setPitchAngle] = useState(45);
  const [steps, setSteps] = useState(800);

  const trajectory = useMemo(
    () => simulateAlphaInBField(bField, ALPHA_SPEED, pitchAngle, steps, 1e-10),
    [bField, pitchAngle, steps]
  );
  const drift = useMemo(() => energyDrift(trajectory), [trajectory]);

  const { svgPoints, cx, cy, gyroRadius } = useMemo(() => {
    const xs = trajectory.map((p) => p.pos.x);
    const ys = trajectory.map((p) => p.pos.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const svgW = 420;
    const svgH = 320;
    const padding = 30;
    const sx = (svgW - 2 * padding) / xRange;
    const sy = (svgH - 2 * padding) / yRange;
    const s = Math.min(sx, sy);
    const centerX = (xMin + xMax) / 2;
    const centerY = (yMin + yMax) / 2;
    const cxs = svgW / 2;
    const cys = svgH / 2;

    const pts = trajectory.map((p) => ({
      x: cxs + (p.pos.x - centerX) * s,
      y: cys - (p.pos.y - centerY) * s,
    }));

    const rGyro = (ALPHA_SPEED * PhysicalConstants.mAlpha) / (2 * PhysicalConstants.e * bField);

    return {
      svgPoints: pts,
      cx: cxs,
      cy: cys,

      gyroRadius: rGyro,
    };
  }, [trajectory]);

  const pathData = svgPoints.length > 0
    ? 'M ' + svgPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ')
    : '';

  const period = (2 * Math.PI * PhysicalConstants.mAlpha) / (2 * PhysicalConstants.e * bField);

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">α 粒子洛伦兹轨迹：Boris pusher 积分（回旋运动 + 俯仰角）</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={16}>
        <Col xs={24} md={16}>
          <svg width="100%" viewBox="0 0 420 320" style={{ background: '#0d1421', borderRadius: 4 }}>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <polygon points="0,0 6,3 0,6" fill="#6b7280" />
              </marker>
            </defs>
            <line x1={cx} y1={cy} x2={cx} y2={cy - 140} stroke="#374151" strokeWidth={1} strokeDasharray="4 3" />
            <line x1={cx} y1={cy} x2={cx + 140} y2={cy} stroke="#374151" strokeWidth={1} strokeDasharray="4 3" />
            <text x={cx + 4} y={cy - 130} fill="#6b7280" fontSize={9}>B↑</text>
            <text x={cx + 130} y={cy + 12} fill="#6b7280" fontSize={9}>x</text>
            <text x={cx - 14} y={cy - 4} fill="#6b7280" fontSize={9}>y</text>
            {pathData && (
              <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.85} />
            )}
            {svgPoints.length > 0 && (
              <>
                <circle cx={svgPoints[0].x} cy={svgPoints[0].y} r={4} fill="#22c55e" />
                <circle cx={svgPoints[svgPoints.length - 1].x} cy={svgPoints[svgPoints.length - 1].y} r={4} fill="#ef4444" />
              </>
            )}
            <text x={8} y={14} fill="#22c55e" fontSize={9}>● 起点</text>
            <text x={8} y={26} fill="#ef4444" fontSize={9}>● 终点</text>
            <text x={420 - 8} y={14} textAnchor="end" fill="#9ca3af" fontSize={9}>
              B = {bField} T, θ = {pitchAngle}°
            </text>
          </svg>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, textAlign: 'center' }}>
            3.5 MeV α 粒子在均匀 B 场中的回旋轨迹 · Boris 算法 {steps} 步 · dt=1e-10 s
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>磁场强度 B (T)</Text>
            <Slider min={1} max={30} step={0.5} value={bField} onChange={setBField} tooltip={{ formatter: (v) => `${v} T` }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>俯仰角 θ (°)</Text>
            <Slider min={5} max={85} step={1} value={pitchAngle} onChange={setPitchAngle} tooltip={{ formatter: (v) => `${v}°` }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>积分步数</Text>
            <Slider min={200} max={2000} step={100} value={steps} onChange={setSteps} />
          </div>
          <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic title="回旋半径 r_c" value={(gyroRadius * 100).toFixed(2)} suffix="cm" valueStyle={{ color: '#3b82f6' }} />
            </Col>
            <Col span={12}>
              <Statistic title="回旋周期 T" value={(period * 1e9).toFixed(3)} suffix="ns" valueStyle={{ color: '#a855f7' }} />
            </Col>
            <Col span={12}>
              <Statistic title="初始速度" value={(ALPHA_SPEED / 1e6).toFixed(2)} suffix="Mm/s" valueStyle={{ color: '#9ca3af' }} />
            </Col>
            <Col span={12}>
              <Statistic title="能量漂移" value={(drift * 100).toFixed(4)} suffix="%" valueStyle={{ color: drift < 0.001 ? '#22c55e' : '#f59e0b' }} />
            </Col>
          </Row>
          <div style={{ marginTop: 8 }}>
            {drift < 0.001 ? (
              <Tag color="success">Boris 算法能量守恒良好</Tag>
            ) : (
              <Tag color="warning">能量漂移 {(drift * 100).toFixed(3)}%</Tag>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
}