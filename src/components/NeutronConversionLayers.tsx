import { Card, Slider, Statistic, Row, Col, Tag, Alert } from 'antd';
import { computeNeutronConversion } from '../physics/neutronConversion';
import { formatPower } from '../physics/format';

interface NeutronConversionLayersProps {
  pNeutron: number;
  etaCapture: number;
  etaTransfer: number;
  etaDec: number;
  onCaptureChange: (e: number) => void;
  onTransferChange: (e: number) => void;
  onDecChange: (e: number) => void;
}

export default function NeutronConversionLayers({
  pNeutron,
  etaCapture,
  etaTransfer,
  etaDec,
  onCaptureChange,
  onTransferChange,
  onDecChange,
}: NeutronConversionLayersProps) {
  const r = computeNeutronConversion(pNeutron, etaCapture, etaTransfer, etaDec);

  const stages = [
    { label: '中子功率 P_n', value: pNeutron, color: '#06b6d4', eta: null as number | null },
    { label: '捕获 P_captured', value: r.pCaptured, color: '#0891b2', eta: etaCapture },
    { label: '能量转移 P_trans', value: r.pTransferred, color: '#0e7490', eta: etaTransfer },
    { label: '直接转换 P_elec', value: r.pElectric, color: '#22c55e', eta: etaDec },
  ];

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">中子转换层：P_n → 捕获 → 转移 → 带电粒子 → 直接电</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <div className="fdec-equation">
        P_n,electric = P_n · η_capture · η_transfer · η_DEC = {formatPower(pNeutron)} × {etaCapture.toFixed(2)} × {etaTransfer.toFixed(2)} × {etaDec.toFixed(2)} = {formatPower(r.pElectric)}
      </div>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#9ca3af' }}>η_capture 中子捕获/反应概率 = {(etaCapture * 100).toFixed(0)}%</span>
          </div>
          <Slider min={0} max={100} step={1} value={Math.round(etaCapture * 100)} onChange={(v) => onCaptureChange(v / 100)} />

          <div style={{ marginBottom: 4, marginTop: 14 }}>
            <span style={{ color: '#9ca3af' }}>η_transfer 能量转移效率 = {(etaTransfer * 100).toFixed(0)}%</span>
          </div>
          <Slider min={0} max={100} step={1} value={Math.round(etaTransfer * 100)} onChange={(v) => onTransferChange(v / 100)} />

          <div style={{ marginBottom: 4, marginTop: 14 }}>
            <span style={{ color: '#9ca3af' }}>η_DEC 带电粒子直接转换 = {(etaDec * 100).toFixed(0)}%</span>
          </div>
          <Slider min={0} max={100} step={1} value={Math.round(etaDec * 100)} onChange={(v) => onDecChange(v / 100)} />
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic title="中子损失" value={formatPower(r.pLost)} valueStyle={{ color: '#ef4444' }} />
            </Col>
            <Col span={12}>
              <Statistic title="总效率 η_总" value={`${(r.overallEfficiency * 100).toFixed(2)}%`} valueStyle={{ color: '#a855f7' }} />
            </Col>
          </Row>
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 12 }}
            message={`中子 ${formatPower(pNeutron)} 不会全部变电：三参数连乘仅得 ${formatPower(r.pElectric)}（${(r.overallEfficiency * 100).toFixed(1)}%）`}
          />
        </Col>
      </Row>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap' }}>
        {stages.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#0d1421', border: `1px solid ${s.color}60`, borderRadius: 8, padding: '10px 14px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ color: '#9ca3af', fontSize: 10 }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: 16, fontWeight: 700 }} className="fdec-mono">{formatPower(s.value)}</div>
              {s.eta !== null && <Tag style={{ marginTop: 4 }} color="cyan">η={s.eta.toFixed(2)}</Tag>}
            </div>
            {i < stages.length - 1 && <span style={{ color: '#4b5563', fontSize: 18, padding: '0 4px' }}>→</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}