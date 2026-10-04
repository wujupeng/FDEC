import { Card, Statistic, Row, Col } from 'antd';
import type { FusionSourceResult, AlphaElectricalResult } from '../physics/fusion';
import {
  formatPower,
  formatCurrent,
  formatVoltage,
  formatRate,
  formatScientific,
} from '../physics/format';

interface KeyParametersPanelProps {
  source: FusionSourceResult;
  alpha: AlphaElectricalResult;
}

export default function KeyParametersPanel({ source, alpha }: KeyParametersPanelProps) {
  return (
    <Card size="small" style={{ background: 'var(--fdec-panel)' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="聚变功率 P_f" value={formatPower(source.fusionPower)} valueStyle={{ color: '#ef4444' }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="反应率 Ṅ_f" value={formatRate(source.reactionRate)} valueStyle={{ color: '#fca5a5', fontSize: 16 }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="α 产率 Ṅ_α" value={formatRate(source.alphaRate)} valueStyle={{ color: '#f59e0b', fontSize: 16 }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="中子产率 Ṅ_n" value={formatRate(source.neutronRate)} valueStyle={{ color: '#06b6d4', fontSize: 16 }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="α 功率 (19.9%)" value={formatPower(source.alphaPower)} valueStyle={{ color: '#f59e0b' }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="中子功率 (80.1%)" value={formatPower(source.neutronPower)} valueStyle={{ color: '#06b6d4' }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="α 电荷流 I_α" value={formatCurrent(alpha.alphaCurrent)} valueStyle={{ color: '#fbbf24' }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="等效电压 V_α" value={formatVoltage(alpha.alphaVoltage)} valueStyle={{ color: '#22c55e' }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="理想 DEC 上限" value={formatPower(alpha.idealDecPower)} valueStyle={{ color: '#34d399' }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="I×V 自洽校验" value={formatPower(alpha.powerCheck)} valueStyle={{ color: '#a855f7' }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="单反应能量 E_f" value="2.82×10⁻¹² J" valueStyle={{ color: '#93c5fd', fontSize: 16 }} />
        </Col>
        <Col xs={12} md={8} xl={6}>
          <Statistic title="α 电荷 q_α" value={formatScientific(2 * 1.602176634e-19, 3) + ' C'} valueStyle={{ color: '#93c5fd', fontSize: 16 }} />
        </Col>
      </Row>
    </Card>
  );
}