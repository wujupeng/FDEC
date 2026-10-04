import { Card, Table, Tag, Row, Col, Statistic, Alert, Typography } from 'antd';
import type { ParticleLedgerResult } from '../physics/particleLedger';
import { formatScientific } from '../physics/format';

const { Text } = Typography;

interface ParticleMapPanelProps {
  result: ParticleLedgerResult;
}

export default function ParticleMapPanel({ result }: ParticleMapPanelProps) {
  const columns = [
    {
      title: '粒子',
      dataIndex: 'name',
      render: (text: string, record: { isCharged: boolean; symbol: string }) => (
        <span>
          <Tag color={record.isCharged ? 'blue' : 'orange'} style={{ marginRight: 4 }}>{record.symbol}</Tag>
          <span style={{ color: '#e5e7eb' }}>{text}</span>
        </span>
      ),
    },
    {
      title: '产生率 (N/s)',
      dataIndex: 'productionRate',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#22c55e' }}>{formatScientific(v, 2)}</span>,
      align: 'right' as const,
    },
    {
      title: '捕获率',
      dataIndex: 'captureRate',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#3b82f6' }}>{formatScientific(v, 2)}</span>,
      align: 'right' as const,
    },
    {
      title: '逃逸率',
      dataIndex: 'escapeRate',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#6b7280' }}>{formatScientific(v, 2)}</span>,
      align: 'right' as const,
    },
    {
      title: '转换率',
      dataIndex: 'conversionRate',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#06b6d4' }}>{formatScientific(v, 2)}</span>,
      align: 'right' as const,
    },
    {
      title: '电能',
      dataIndex: 'powerElectric',
      render: (v: number) => <span className="fdec-mono" style={{ color: v > 0 ? '#22c55e' : '#6b7280' }}>{(v / 1e6).toFixed(1)} MW</span>,
      align: 'right' as const,
    },
  ];

  const tableData = result.entries.map((e, i) => ({ key: i, ...e }));

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">粒子账本 Particle Map — {result.fuel} 粒子产率追踪 (N/s)</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Table
            size="small"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            rowKey="key"
          />
        </Col>
        <Col xs={24} md={8}>
          <div style={{ marginBottom: 12 }}>
            {result.isChargeConserved ? (
              <Alert type="success" showIcon message={`电荷守恒 ✓ 偏差 ${(result.chargeConservationError * 100).toFixed(4)}%`} />
            ) : (
              <Alert type="warning" showIcon message={`电荷守恒偏差 ${(result.chargeConservationError * 100).toFixed(2)}%`} />
            )}
          </div>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic title="反应率" value={formatScientific(result.reactionRate, 2)} suffix="/s" valueStyle={{ color: '#9ca3af', fontSize: 14 }} />
            </Col>
            <Col span={12}>
              <Statistic title="总产生率" value={formatScientific(result.totalProductionRate, 2)} suffix="/s" valueStyle={{ color: '#22c55e', fontSize: 14 }} />
            </Col>
            <Col span={12}>
              <Statistic title="总捕获率" value={formatScientific(result.totalCaptureRate, 2)} suffix="/s" valueStyle={{ color: '#3b82f6', fontSize: 14 }} />
            </Col>
            <Col span={12}>
              <Statistic title="总逃逸率" value={formatScientific(result.totalEscapeRate, 2)} suffix="/s" valueStyle={{ color: '#6b7280', fontSize: 14 }} />
            </Col>
          </Row>
          <div style={{ marginTop: 12, fontSize: 11, color: '#6b7280' }}>
            <Text strong style={{ color: '#9ca3af' }}>流程：</Text>
            <div style={{ marginTop: 4 }}>
              产生 → 捕获 → 转换 → 电能<br />
              产生 → 逃逸 → 损失<br />
              产生 → 沉积 → 热能
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
}