import { useState, useMemo, useCallback } from 'react';
import { Card, Button, Table, Tag, Statistic, Row, Col, Space, Typography, Alert } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { runAllBenchmarks, benchmarkSummary, BenchmarkResult } from '../simulation/benchmarks/benchmarkSuite';

const { Text } = Typography;

export default function BenchmarkPanel() {
  const [results, setResults] = useState<BenchmarkResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [runTime, setRunTime] = useState(0);

  const handleRun = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const t0 = performance.now();
      const r = runAllBenchmarks();
      const t1 = performance.now();
      setResults(r);
      setRunTime(t1 - t0);
      setRunning(false);
    }, 50);
  }, []);

  const summary = useMemo(() => results ? benchmarkSummary(results) : null, [results]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (v: string) => <Text style={{ color: '#58a6ff', fontFamily: 'monospace', fontSize: 11 }}>{v}</Text>,
    },
    {
      title: 'Test',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text style={{ color: '#e5e7eb', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Result',
      dataIndex: 'passed',
      key: 'passed',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '✓ PASS' : '✗ FAIL'}</Tag>,
    },
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric',
      render: (v: string) => <Text style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (v: string) => <Text style={{ color: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}>{v}</Text>,
    },
  ];

  return (
    <Card size="small" style={{ background: 'var(--fdec-panel)' }} title={<span className="fdec-section-title">🧪 Benchmark Suite — 物理求解器基准测试</span>}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Row gutter={16} align="middle">
          <Col>
            <Button type="primary" icon={<ExperimentOutlined />} onClick={handleRun} loading={running}>
              RUN BENCHMARK SUITE
            </Button>
          </Col>
          {summary && (
            <>
              <Col><Statistic title="Passed" value={summary.passed} valueStyle={{ color: '#3fb950' }} /></Col>
              <Col><Statistic title="Failed" value={summary.failed} valueStyle={{ color: '#f85149' }} /></Col>
              <Col><Statistic title="Total" value={summary.total} /></Col>
              <Col><Statistic title="Time" value={`${runTime.toFixed(0)} ms`} valueStyle={{ fontSize: 14 }} /></Col>
              <Col>
                <Tag color={summary.allPassed ? 'green' : 'red'} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {summary.allPassed ? '✓ ALL PASS — SOLVER VALID' : '✗ FAILURES DETECTED'}
                </Tag>
              </Col>
            </>
          )}
        </Row>

        {summary && summary.allPassed && (
          <Alert type="success" showIcon message="Physics Solver VALID — all 10 benchmarks passed" style={{ background: '#0d2818', border: '1px solid #1f4d2e' }} />
        )}
        {summary && !summary.allPassed && (
          <Alert type="error" showIcon message={`${summary.failed} benchmark(s) failed — solver may have issues`} style={{ background: '#2d0d0d', border: '1px solid #4d1f1f' }} />
        )}

        {results && (
          <Table
            dataSource={results}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            style={{ background: '#0d1117' }}
          />
        )}

        {!results && !running && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            <ExperimentOutlined style={{ fontSize: 48, opacity: 0.3 }} />
            <p>点击 RUN BENCHMARK SUITE 运行 10 项物理基准测试</p>
          </div>
        )}
      </Space>
    </Card>
  );
}