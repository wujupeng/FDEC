import { Card, Slider, Alert, Statistic, Row, Col, Table, Tag } from 'antd';
import { computeAlphaHeating, sweepExtractionRate } from '../physics/alphaHeating';
import { formatPower } from '../physics/format';

interface AlphaHeatingConstraintProps {
  pAlpha: number;
  fAlpha: number;
  pRequired: number;
  onFAlphaChange: (f: number) => void;
  onPRequiredChange: (p: number) => void;
}

export default function AlphaHeatingConstraint({
  pAlpha,
  fAlpha,
  pRequired,
  onFAlphaChange,
  onPRequiredChange,
}: AlphaHeatingConstraintProps) {
  const r = computeAlphaHeating(pAlpha, fAlpha, pRequired);
  const sweep = sweepExtractionRate(pAlpha, pRequired);
  const fMaxPct = r.fMax * 100;

  const columns = [
    {
      title: 'α 抽取率 f_α',
      dataIndex: 'fAlpha',
      key: 'f',
      render: (v: number) => <Tag color={v > r.fMax ? 'red' : 'green'}>{(v * 100).toFixed(0)}%</Tag>,
    },
    {
      title: 'α 去发电',
      dataIndex: 'extract',
      key: 'extract',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#22c55e' }}>{formatPower(v)}</span>,
    },
    {
      title: 'α 留作自加热',
      dataIndex: 'heat',
      key: 'heat',
      render: (v: number) => <span className="fdec-mono" style={{ color: '#f59e0b' }}>{formatPower(v)}</span>,
    },
    {
      title: '需外部加热',
      dataIndex: 'external',
      key: 'ext',
      render: (v: number) => (
        <span className="fdec-mono" style={{ color: v > 0 ? '#ef4444' : '#6b7280' }}>
          {v > 0 ? formatPower(v) : '0 W'}
        </span>
      ),
    },
    {
      title: '自持',
      dataIndex: 'sustained',
      key: 'sus',
      render: (v: boolean) => (v ? <Tag color="success">✓</Tag> : <Tag color="error">✗</Tag>),
    },
  ];

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">α 抽取率 vs 聚变自持约束（核心权衡）</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <div className="fdec-equation">
        P_α,extract = P_α·f_α &nbsp;｜&nbsp; P_α,heat = P_α·(1−f_α) &nbsp;｜&nbsp; 自持条件: P_α,heat ≥ P_required
      </div>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#9ca3af' }}>α 抽取率 f_α = {(fAlpha * 100).toFixed(0)}%</span>
          </div>
          <Slider min={0} max={100} step={1} value={Math.round(fAlpha * 100)} onChange={(v) => onFAlphaChange(v / 100)} />

          <div style={{ marginBottom: 4, marginTop: 16 }}>
            <span style={{ color: '#9ca3af' }}>维持聚变所需加热 P_required = {formatPower(pRequired)}</span>
          </div>
          <Slider
            min={0}
            max={Math.round(pAlpha / 1e6)}
            step={1}
            value={Math.round(pRequired / 1e6)}
            onChange={(v) => onPRequiredChange(v * 1e6)}
            marks={{ 0: '0', [Math.round((pAlpha * 0.5) / 1e6)]: '50%', [Math.round(pAlpha / 1e6)]: 'P_α' }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic title="α 抽去发电" value={formatPower(r.pAlphaExtract)} valueStyle={{ color: '#22c55e' }} />
            </Col>
            <Col span={12}>
              <Statistic title="α 留作自加热" value={formatPower(r.pAlphaHeat)} valueStyle={{ color: '#f59e0b' }} />
            </Col>
            <Col span={12}>
              <Statistic title="需外部加热" value={formatPower(r.pExternal)} valueStyle={{ color: r.pExternal > 0 ? '#ef4444' : '#6b7280' }} />
            </Col>
            <Col span={12}>
              <Statistic title="最大允许抽取率" value={fMaxPct > 0 ? `${fMaxPct.toFixed(1)}%` : '0%（不自持）'} valueStyle={{ color: fMaxPct > 0 ? '#3b82f6' : '#ef4444' }} />
            </Col>
          </Row>
        </Col>
      </Row>

      <div style={{ marginTop: 12 }}>
        {r.isSelfSustained ? (
          <Alert
            type="success"
            showIcon
            message={`聚变自持：α 自加热 ${formatPower(r.pAlphaHeat)} ≥ P_required ${formatPower(pRequired)}，抽取 ${(fAlpha * 100).toFixed(0)}% 可行`}
          />
        ) : (
          <Alert
            type="error"
            showIcon
            message={`不能自持：α 自加热 ${formatPower(r.pAlphaHeat)} < P_required ${formatPower(pRequired)}，需外部补充 ${formatPower(r.pExternal)}（吃掉净输出）`}
          />
        )}
        {fMaxPct > 0 && fAlpha > r.fMax && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 8 }}
            message={`当前抽取率 ${(fAlpha * 100).toFixed(0)}% 超过自持上限 ${fMaxPct.toFixed(1)}%，过度抽取会破坏聚变`}
          />
        )}
      </div>

      <Table
        size="small"
        dataSource={sweep}
        columns={columns}
        rowKey="fAlpha"
        pagination={false}
        style={{ marginTop: 12 }}
      />
    </Card>
  );
}