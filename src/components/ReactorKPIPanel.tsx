import { Card, Row, Col, Statistic, Alert, Divider } from 'antd';
import type { ReactorModelResult } from '../reactor/reactorModel';
import { formatPower } from '../physics/format';

interface ReactorKPIPanelProps {
  result: ReactorModelResult;
}

export default function ReactorKPIPanel({ result }: ReactorKPIPanelProps) {
  const { energyLedger, plasmaBalance, exhaust } = result;

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">反应堆 KPI — {result.fuel} × {result.geometry}</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={[8, 8]}>
        <Col xs={12} md={6}>
          <Statistic title="聚变功率" value={formatPower(energyLedger.fusionPower)} valueStyle={{ color: '#3b82f6' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="毛电输出" value={formatPower(energyLedger.pGrossElectric)} valueStyle={{ color: '#22c55e' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="厂用电" value={formatPower(energyLedger.pPlant)} valueStyle={{ color: '#f97316' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="净电输出" value={formatPower(energyLedger.pNet)} valueStyle={{ color: result.isViable ? '#3b82f6' : '#ef4444' }} />
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />

      <Row gutter={[8, 8]}>
        <Col xs={12} md={6}>
          <Statistic title="ERF (毛电效率)" value={(energyLedger.erf * 100).toFixed(1)} suffix="%" valueStyle={{ color: '#06b6d4' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="NETF (净电效率)" value={(energyLedger.netf * 100).toFixed(1)} suffix="%" valueStyle={{ color: result.isViable ? '#3b82f6' : '#ef4444' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="DEC Advantage" value={formatPower(energyLedger.decAdvantage)} valueStyle={{ color: energyLedger.decAdvantage > 0 ? '#22c55e' : '#ef4444' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="粒子回收率" value={(exhaust.totalCaptureEfficiency * 100).toFixed(1)} suffix="%" valueStyle={{ color: '#a855f7' }} />
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />

      <Row gutter={[8, 8]}>
        <Col xs={12} md={6}>
          <Statistic title="α 自加热" value={formatPower(plasmaBalance.pAlphaHeating)} valueStyle={{ color: '#9ca3af' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="韧致辐射" value={formatPower(plasmaBalance.pRadiationBremsstrahlung)} valueStyle={{ color: '#ef4444' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="回旋辐射" value={formatPower(plasmaBalance.pRadiationSynchrotron)} valueStyle={{ color: '#ef4444' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="自持余量" value={formatPower(plasmaBalance.margin)} valueStyle={{ color: plasmaBalance.selfSustained ? '#22c55e' : '#ef4444' }} />
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />

      <div style={{ textAlign: 'center' }}>
        {result.isViable ? (
          <Alert type="success" showIcon message={`${result.fuel} × ${result.geometry}：净电 ${formatPower(energyLedger.pNet)}，η_net=${(energyLedger.netf * 100).toFixed(1)}%，方案可行`} />
        ) : (
          <Alert type="error" showIcon message={`${result.fuel} × ${result.geometry}：NOT VIABLE — ${result.viableReasons.join('；')}`} />
        )}
      </div>
    </Card>
  );
}