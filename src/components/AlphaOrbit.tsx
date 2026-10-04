import { Card, Slider, Statistic, Row, Col, Table, Tag } from 'antd';
import { computeAlphaOrbit, sweepMagneticField } from '../physics/larmor';
import { formatScientific } from '../physics/format';

interface AlphaOrbitProps {
  bField: number;
  onBChange: (b: number) => void;
}

export default function AlphaOrbit({ bField, onBChange }: AlphaOrbitProps) {
  const r = computeAlphaOrbit(bField);
  const sweep = sweepMagneticField();

  const pxRadius = Math.min(110, Math.max(20, r.larmorRadius * 400));
  const cx = 150;
  const cy = 150;

  const columns = [
    { title: 'B (T)', dataIndex: 'b', key: 'b', render: (v: number) => <Tag color="blue">{v}</Tag> },
    {
      title: '回旋半径 r_L',
      dataIndex: 'radius',
      key: 'r',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#fbbf24' }}>{(v * 100).toFixed(2)} cm</span>,
    },
    {
      title: '回旋频率 f_c',
      dataIndex: 'freq',
      key: 'f',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#93c5fd' }}>{formatScientific(v, 3)} Hz</span>,
    },
  ];

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">α 粒子轨道：洛伦兹回旋半径 r_L = mv/(qB)</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <div className="fdec-equation">
        v = √(2E_α/m_α) ≈ {formatScientific(r.velocity, 3)} m/s (β={r.beta.toFixed(4)}) &nbsp;｜&nbsp; r_L = mv/(qB) &nbsp;｜&nbsp; f_c = qB/(2πm)
      </div>

      <Row gutter={24}>
        <Col xs={24} md={10}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#9ca3af' }}>磁感应强度 B = {bField} T</span>
          </div>
          <Slider min={1} max={50} step={1} value={bField} onChange={onBChange} marks={{ 1: '1T', 10: '10T', 20: '20T', 50: '50T' }} />

          <svg viewBox="0 0 300 300" className="fdec-flow" style={{ maxWidth: 280, marginTop: 12 }}>
            <defs>
              <marker id="arrowO" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
              </marker>
            </defs>
            <circle cx={cx} cy={cy} r={pxRadius} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" />
            <circle cx={cx} cy={cy} r={4} fill="#ef4444" />
            <text x={cx} y={cy + 18} textAnchor="middle" fill="#9ca3af" fontSize={10}>聚变区</text>
            <circle cx={cx + pxRadius} cy={cy} r={6} fill="#f59e0b" className="fdec-pulse" />
            <text x={cx + pxRadius} y={cy - 12} textAnchor="middle" fill="#f59e0b" fontSize={12} fontWeight={700}>α</text>
            <path d={`M ${cx + pxRadius} ${cy} A ${pxRadius} ${pxRadius} 0 0 1 ${cx + pxRadius * 0.707} ${cy + pxRadius * 0.707}`} fill="none" stroke="#f59e0b" strokeWidth={2.5} markerEnd="url(#arrowO)" />
            <line x1={cx} y1={cy} x2={cx + pxRadius} y2={cy} stroke="#374151" strokeWidth={1} strokeDasharray="2 2" />
            <text x={cx + pxRadius / 2} y={cy - 6} textAnchor="middle" fill="#fbbf24" fontSize={11} className="fdec-mono">r_L</text>
            <text x={150} y={290} textAnchor="middle" fill="#6b7280" fontSize={10}>α 在磁场中的回旋轨道（示意，非按真实比例）</text>
          </svg>
        </Col>
        <Col xs={24} md={14}>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic title="α 速度 v" value={formatScientific(r.velocity, 3) + ' m/s'} valueStyle={{ color: '#93c5fd', fontSize: 15 }} />
            </Col>
            <Col span={12}>
              <Statistic title="β = v/c" value={r.beta.toFixed(4)} valueStyle={{ color: '#93c5fd' }} />
            </Col>
            <Col span={12}>
              <Statistic title="回旋半径 r_L" value={`${(r.larmorRadius * 100).toFixed(2)} cm`} valueStyle={{ color: '#fbbf24' }} />
            </Col>
            <Col span={12}>
              <Statistic title="回旋频率 f_c" value={formatScientific(r.cyclotronFreq, 3) + ' Hz'} valueStyle={{ color: '#a855f7', fontSize: 15 }} />
            </Col>
          </Row>
          <div style={{ marginTop: 8 }}>
            {r.isNonRelativistic ? (
              <Tag color="success">非相对论近似有效（β &lt; 0.1）</Tag>
            ) : (
              <Tag color="warning">β ≥ 0.1，需考虑相对论修正</Tag>
            )}
          </div>
          <Table size="small" dataSource={sweep} columns={columns} rowKey="b" pagination={false} style={{ marginTop: 12 }} />
        </Col>
      </Row>
    </Card>
  );
}