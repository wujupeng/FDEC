import { Card, Tag, Row, Col } from 'antd';
import { formatPower } from '../physics/format';

interface CredibilityLevelsProps {
  pAlpha: number;
  pDec: number;
  pNet: number;
  fusionPower: number;
}

export default function CredibilityLevels({ pAlpha, pDec, pNet, fusionPower }: CredibilityLevelsProps) {
  const levels = [
    {
      level: 0,
      title: 'Level 0 · 理论能量上限',
      value: pAlpha,
      color: '#f59e0b',
      desc: 'α 粒子动能全部可回收的物理上限，非工程输出',
      tag: '理论上限',
    },
    {
      level: 1,
      title: 'Level 1 · 直接转换器输出',
      value: pDec,
      color: '#22c55e',
      desc: '扣除 α 抽取率与转换器效率后的毛电功率',
      tag: '毛电',
    },
    {
      level: 2,
      title: 'Level 2 · 净电输出',
      value: pNet,
      color: pNet > 0 ? '#3b82f6' : '#ef4444',
      desc: '再扣除厂用电（加热/磁场/真空/冷却/功率电子/辐射）',
      tag: pNet > 0 ? '净输出' : '不可行',
    },
  ];

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">物理可信度等级：理论上限 ≠ 工程输出</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={[12, 12]}>
        {levels.map((l) => (
          <Col xs={24} md={8} key={l.level}>
            <div
              style={{
                background: '#0d1421',
                border: `1px solid ${l.color}40`,
                borderRadius: 8,
                padding: 16,
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>{l.title}</span>
                <Tag color={l.level === 2 ? (pNet > 0 ? 'blue' : 'red') : l.level === 0 ? 'orange' : 'green'}>
                  {l.tag}
                </Tag>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: l.color }} className="fdec-mono">
                {formatPower(l.value)}
              </div>
              <div style={{ color: '#6b7280', fontSize: 11, marginTop: 8 }}>{l.desc}</div>
              <div style={{ color: '#4b5563', fontSize: 11, marginTop: 4 }}>
                占聚变功率 {((l.value / fusionPower) * 100).toFixed(1)}%
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
}