import { Card, Table, Tag, Row, Col, Statistic, Alert, Divider, Typography } from 'antd';
import type { EnergyLedgerResult, LedgerCategory } from '../physics/energyLedger';
import { formatPower } from '../physics/format';

const { Text } = Typography;

const CATEGORY_COLORS: Record<LedgerCategory, string> = {
  fusion: '#3b82f6',
  charged: '#22c55e',
  neutron: '#f59e0b',
  radiation: '#ef4444',
  escape: '#6b7280',
  conversion_loss: '#eab308',
  plasma_heating: '#a855f7',
  electric: '#06b6d4',
  plant: '#f97316',
  net: '#3b82f6',
};

interface EnergyLedgerPanelProps {
  result: EnergyLedgerResult;
}

export default function EnergyLedgerPanel({ result }: EnergyLedgerPanelProps) {
  const columns = [
    {
      title: '能量项',
      dataIndex: 'label',
      render: (text: string, record: { category: LedgerCategory }) => (
        <span style={{ color: CATEGORY_COLORS[record.category] }}>{text}</span>
      ),
    },
    {
      title: '功率',
      dataIndex: 'value',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#e5e7eb' }}>{formatPower(v)}</span>,
      align: 'right' as const,
    },
    {
      title: '说明',
      dataIndex: 'detail',
      render: (text?: string) => text ? <span style={{ color: '#6b7280', fontSize: 11 }}>{text}</span> : null,
    },
  ];

  const tableData = result.entries.map((e, i) => ({
    key: i,
    ...e,
  }));

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">能量账本 Energy Ledger — {result.fuel} 全链能量审计</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={16}>
        <Col xs={24} md={14}>
          <Table
            size="small"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            rowKey="key"
          />
        </Col>
        <Col xs={24} md={10}>
          <div style={{ marginBottom: 12 }}>
            {result.isConserved ? (
              <Alert type="success" showIcon message={`能量守恒 ✓ 偏差 ${(result.conservationError * 100).toFixed(3)}%`} />
            ) : (
              <Alert type="error" showIcon message={`❌ 能量守恒失败 偏差 ${(result.conservationError * 100).toFixed(2)}%`} />
            )}
          </div>
          <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic title="ERF (毛电/聚变)" value={(result.erf * 100).toFixed(1)} suffix="%" valueStyle={{ color: '#06b6d4' }} />
            </Col>
            <Col span={12}>
              <Statistic title="NETF (净电/聚变)" value={(result.netf * 100).toFixed(1)} suffix="%" valueStyle={{ color: result.isViable ? '#3b82f6' : '#ef4444' }} />
            </Col>
            <Col span={12}>
              <Statistic title="P_gross" value={formatPower(result.pGrossElectric)} valueStyle={{ color: '#22c55e' }} />
            </Col>
            <Col span={12}>
              <Statistic title="P_net" value={formatPower(result.pNet)} valueStyle={{ color: result.isViable ? '#3b82f6' : '#ef4444' }} />
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
            <Text strong style={{ color: '#e5e7eb' }}>DEC Advantage</Text>（vs 传统热转换 η=33%）
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: result.decAdvantage > 0 ? '#22c55e' : '#ef4444' }} className="fdec-mono">
            {result.decAdvantage > 0 ? '+' : ''}{formatPower(result.decAdvantage)}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            传统热转换净电: {formatPower(result.pNetThermal)}
          </div>
          {result.isViable ? (
            <Tag color="success" style={{ marginTop: 8 }}>VIABLE</Tag>
          ) : (
            <Tag color="error" style={{ marginTop: 8 }}>NOT VIABLE</Tag>
          )}
        </Col>
      </Row>
    </Card>
  );
}