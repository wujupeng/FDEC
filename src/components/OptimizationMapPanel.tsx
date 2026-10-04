import { Card, Table, Row, Col, Statistic, Alert, Typography } from 'antd';
import type { OptimizationMap as OptimizationMapType, OptimizationCell } from '../reactor/kpi';
import { formatPower } from '../physics/format';

const { Text } = Typography;

interface OptimizationMapPanelProps {
  map: OptimizationMapType;
}

function cellColor(cell: OptimizationCell, maxPNet: number): string {
  if (!cell.isViable) return '#1f2937';
  if (maxPNet <= 0) return '#374151';
  const ratio = cell.pNet / maxPNet;
  if (ratio > 0.8) return '#22c55e';
  if (ratio > 0.5) return '#84cc16';
  if (ratio > 0.2) return '#eab308';
  return '#f59e0b';
}

export default function OptimizationMapPanel({ map }: OptimizationMapPanelProps) {
  const maxPNet = Math.max(...map.cells.map((c) => c.pNet), 1);

  const columns = [
    {
      title: '燃料 \\ 几何',
      dataIndex: 'fuel',
      fixed: 'left' as const,
      render: (text: string) => <Text strong style={{ color: '#e5e7eb' }}>{text}</Text>,
    },
    ...map.geometries.map((geom) => ({
      title: geom,
      dataIndex: geom,
      align: 'center' as const,
      render: (cell: OptimizationCell) => {
        const bg = cellColor(cell, maxPNet);
        return (
          <div
            style={{
              background: bg,
              borderRadius: 4,
              padding: '8px 4px',
              textAlign: 'center',
              border: map.best?.fuel === cell.fuel && map.best?.geometry === cell.geometry ? '2px solid #fff' : 'none',
            }}
          >
            {cell.isViable ? (
              <>
                <div className="fdec-mono" style={{ fontSize: 12, fontWeight: 700, color: '#0d1421' }}>
                  {formatPower(cell.pNet)}
                </div>
                <div style={{ fontSize: 10, color: '#0d1421', opacity: 0.8 }}>
                  η={(cell.etaNet * 100).toFixed(1)}%
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: '#6b7280' }}>NOT VIABLE</div>
            )}
            {map.best?.fuel === cell.fuel && map.best?.geometry === cell.geometry && (
              <div style={{ fontSize: 9, color: '#fff', marginTop: 2 }}>★ BEST</div>
            )}
          </div>
        );
      },
    })),
  ];

  const tableData = map.fuels.map((fuel) => {
    const row: Record<string, OptimizationCell | string> = { fuel, key: fuel };
    for (const geom of map.geometries) {
      const cell = map.cells.find((c) => c.fuel === fuel && c.geometry === geom);
      if (cell) row[geom] = cell;
    }
    return row;
  });

  return (
    <Card
      size="small"
      title={<span className="fdec-section-title">Fuel × Geometry 优化矩阵 — 自动寻找 max(P_net)</span>}
      style={{ background: 'var(--fdec-panel)' }}
    >
      <Table
        size="small"
        columns={columns}
        dataSource={tableData}
        pagination={false}
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          {map.best ? (
            <Alert
              type="success"
              showIcon
              message={
                <span>
                  最优方案：<Text strong style={{ color: '#22c55e' }}>{map.best.fuel} × {map.best.geometry}</Text>
                  <br />
                  P_net = {formatPower(map.best.pNet)}，η_net = {(map.best.etaNet * 100).toFixed(1)}%
                </span>
              }
            />
          ) : (
            <Alert type="error" showIcon message="所有方案均 NOT VIABLE — 当前参数下无可行组合" />
          )}
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={[8, 8]}>
            <Col span={8}>
              <Statistic title="燃料数" value={map.fuels.length} valueStyle={{ color: '#9ca3af' }} />
            </Col>
            <Col span={8}>
              <Statistic title="几何数" value={map.geometries.length} valueStyle={{ color: '#9ca3af' }} />
            </Col>
            <Col span={8}>
              <Statistic title="可行方案" value={map.cells.filter((c) => c.isViable).length} suffix={`/${map.cells.length}`} valueStyle={{ color: '#22c55e' }} />
            </Col>
          </Row>
          <div style={{ marginTop: 8, fontSize: 10, color: '#6b7280' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#22c55e', marginRight: 4 }} />最优
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#eab308', margin: '0 4px 0 8px' }} />可行
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#1f2937', margin: '0 4px 0 8px' }} />不可行
          </div>
        </Col>
      </Row>
    </Card>
  );
}