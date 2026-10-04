import { Card, Row, Col, Tag, Alert, Progress, Typography } from 'antd';
import type { PhysicsValidationResult, ValidationStatus } from '../physics/validation';

const { Text } = Typography;

interface PhysicsValidationPanelProps {
  result: PhysicsValidationResult;
}

const STATUS_CONFIG: Record<ValidationStatus, { color: string; symbol: string; tagColor: string; label: string }> = {
  pass: { color: '#22c55e', symbol: '✓', tagColor: 'success', label: '通过' },
  warn: { color: '#f59e0b', symbol: '⚠', tagColor: 'warning', label: '警告' },
  fail: { color: '#ef4444', symbol: '✕', tagColor: 'error', label: '失败' },
};

export default function PhysicsValidationPanel({ result }: PhysicsValidationPanelProps) {
  const { items, overallPass, passCount, warnCount, failCount, summary } = result;
  const total = items.length;
  const passPercent = (passCount / total) * 100;

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">物理校验引擎：6 项自洽性判定（✓ 通过 / ⚠ 警告 / ✕ 失败）</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Row gutter={[12, 12]}>
        {items.map((item) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <Col xs={24} sm={12} md={8} key={item.key}>
              <div
                style={{
                  border: `1px solid ${cfg.color}40`,
                  background: `${cfg.color}10`,
                  borderRadius: 6,
                  padding: '10px 12px',
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text strong style={{ color: '#e5e7eb', fontSize: 13 }}>{item.name}</Text>
                  <span style={{ fontSize: 20, fontWeight: 700, color: cfg.color }}>{cfg.symbol}</span>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{item.message}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="fdec-mono" style={{ fontSize: 12, color: cfg.color }}>{item.value}</span>
                  <Tag color={cfg.tagColor} style={{ margin: 0, fontSize: 10 }}>{cfg.label}</Tag>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>总体判定</Text>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            {passCount} 通过 / {warnCount} 警告 / {failCount} 失败
          </Text>
        </div>
        <Progress
          percent={passPercent}
          strokeColor={{ from: '#22c55e', to: '#3b82f6' }}
          trailColor="#1f2937"
          format={() => `${passCount}/${total}`}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        {overallPass ? (
          <Alert
            type={warnCount > 0 ? 'warning' : 'success'}
            showIcon
            message={summary}
            description={
              warnCount === 0
                ? '当前参数下所有物理约束自洽，FDEC 直接发电闭环在模型精度内成立。'
                : '基本自洽但有中警告项，接近某物理边界——改变参数可能滑入失败区。'
            }
          />
        ) : (
          <Alert
            type="error"
            showIcon
            message={summary}
            description="存在失败项：当前参数组合违反物理约束。调整参数使失败项转为通过或警告，是下一步的任务。"
          />
        )}
      </div>
    </Card>
  );
}