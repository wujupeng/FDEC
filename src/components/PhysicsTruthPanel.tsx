import { Card, Row, Col, Tag, Alert, Progress, Divider, Statistic, Typography } from 'antd';
import type { ValidationReport, ValidationResult, UncertaintyReport } from '../validation/types';
import { MODEL_LEVEL_LABELS } from '../validation/types';

const { Text } = Typography;

const STATUS_CONFIG = {
  PASS: { color: '#22c55e', symbol: '✓', tagColor: 'success' as const, label: '通过' },
  WARN: { color: '#f59e0b', symbol: '⚠', tagColor: 'warning' as const, label: '警告' },
  FAIL: { color: '#ef4444', symbol: '✕', tagColor: 'error' as const, label: '失败' },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: '#22c55e',
  MEDIUM: '#f59e0b',
  LOW: '#ef4444',
};

interface PhysicsTruthPanelProps {
  report: ValidationReport;
  uncertainty?: UncertaintyReport;
}

export default function PhysicsTruthPanel({ report, uncertainty }: PhysicsTruthPanelProps) {
  const { results, overallStatus, overallConfidenceLevel, modelClassification, passCount, warnCount, failCount } = report;
  const total = results.length;
  const passPercent = (passCount / total) * 100;

  const conservationResults = results.filter((r) => r.category === 'conservation');
  const engineeringResults = results.filter((r) => r.category === 'engineering');

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">FDEC Physics Truth Panel — 物理可信度与校验引擎</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <div style={{
        background: overallStatus === 'PASS' ? '#0a2e0a' : overallStatus === 'WARN' ? '#2e2400' : '#2e0a0a',
        border: `1px solid ${overallStatus === 'PASS' ? '#22c55e' : overallStatus === 'WARN' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: 6,
        padding: '12px 16px',
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>
          {modelClassification}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          {passCount} PASS / {warnCount} WARN / {failCount} FAIL · 置信度 {overallConfidenceLevel}
        </div>
      </div>

      <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>守恒律校验</div>
      <Row gutter={[8, 8]}>
        {conservationResults.map((r) => (
          <Col xs={24} sm={12} md={8} key={r.id}>
            <ValidationItemCard result={r} />
          </Col>
        ))}
      </Row>

      {engineeringResults.length > 0 && (
        <>
          <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>工程校验 + 不确定性</div>
          <Row gutter={[8, 8]}>
            {engineeringResults.map((r) => (
              <Col xs={24} sm={12} md={8} key={r.id}>
                <ValidationItemCard result={r} />
              </Col>
            ))}
          </Row>
        </>
      )}

      <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />
      <div style={{ marginBottom: 4 }}>
        <Text style={{ color: '#9ca3af', fontSize: 12 }}>总体通过率</Text>
      </div>
      <Progress
        percent={passPercent}
        strokeColor={{ from: '#22c55e', to: '#3b82f6' }}
        trailColor="#1f2937"
        format={() => `${passCount}/${total}`}
      />

      {uncertainty && (
        <>
          <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>
            Monte Carlo 不确定性分析（{uncertainty.samples} 次采样）
          </div>
          <Row gutter={[8, 8]}>
            <Col xs={12} md={6}>
              <Statistic
                title="P_net P50"
                value={uncertainty.netPowerDist.p50.toFixed(0)}
                suffix="MW"
                valueStyle={{ color: '#3b82f6' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="P_net P10–P90"
                value={`${uncertainty.netPowerDist.p10.toFixed(0)}–${uncertainty.netPowerDist.p90.toFixed(0)}`}
                suffix="MW"
                valueStyle={{ color: '#9ca3af', fontSize: 14 }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="σ/μ (P_net)"
                value={uncertainty.netPowerDist.uncertaintyPercent.toFixed(1)}
                suffix="%"
                valueStyle={{ color: uncertainty.netPowerDist.uncertaintyPercent < 15 ? '#22c55e' : '#f59e0b' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="可行性概率"
                value={(uncertainty.viableFraction * 100).toFixed(1)}
                suffix="%"
                valueStyle={{ color: uncertainty.viableFraction > 0.5 ? '#22c55e' : '#ef4444' }}
              />
            </Col>
          </Row>
        </>
      )}

      <div style={{ marginTop: 12 }}>
        {overallStatus === 'PASS' ? (
          <Alert type={warnCount > 0 ? 'warning' : 'success'} showIcon message={report.summary} />
        ) : (
          <Alert type="error" showIcon message={report.summary} />
        )}
      </div>
    </Card>
  );
}

function ValidationItemCard({ result }: { result: ValidationResult }) {
  const cfg = STATUS_CONFIG[result.status];
  const confColor = CONFIDENCE_COLORS[result.confidenceLevel];

  return (
    <div style={{
      border: `1px solid ${cfg.color}40`,
      background: `${cfg.color}08`,
      borderRadius: 4,
      padding: '8px 10px',
      height: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text strong style={{ color: '#e5e7eb', fontSize: 12 }}>{result.name}</Text>
        <span style={{ fontSize: 16, fontWeight: 700, color: cfg.color }}>{cfg.symbol}</span>
      </div>
      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4, lineHeight: 1.4 }}>{result.message}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tag style={{ fontSize: 9, margin: 0, borderColor: `${confColor}60`, color: confColor, background: 'transparent' }}>
          {result.confidenceLevel}
        </Tag>
        <span style={{ fontSize: 9, color: '#6b7280' }}>L{result.modelLevel}: {MODEL_LEVEL_LABELS[result.modelLevel]}</span>
      </div>
    </div>
  );
}