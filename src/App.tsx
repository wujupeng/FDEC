import { useState, useMemo } from 'react';
import { Layout, Typography, Slider, Card, Space, Tag, Divider } from 'antd';
import { computeFusionSource, computeAlphaElectrical } from './physics/fusion';
import { formatPower } from './physics/format';
import EnergyFlowDiagram from './components/EnergyFlowDiagram';
import KeyParametersPanel from './components/KeyParametersPanel';
import ParticleGenerator from './components/ParticleGenerator';
import AlphaEfficiencyTable from './components/AlphaEfficiencyTable';
import SpaceChargeModel from './components/SpaceChargeModel';
import FuelComparison from './components/FuelComparison';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function App() {
  const [fusionPower, setFusionPower] = useState(1e9);
  const [etaAlpha, setEtaAlpha] = useState(0.6);
  const [scVoltage, setScVoltage] = useState(1.75e6);
  const [scGap, setScGap] = useState(0.01);
  const [scArea, setScArea] = useState(0.5);

  const source = useMemo(() => computeFusionSource(fusionPower), [fusionPower]);
  const alpha = useMemo(() => computeAlphaElectrical(fusionPower), [fusionPower]);

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--fdec-bg)' }}>
      <Header
        style={{
          background: 'linear-gradient(90deg, #0d1421, #111827)',
          borderBottom: '1px solid #1f2937',
          padding: '0 24px',
          height: 'auto',
          lineHeight: 'normal',
          paddingBlock: 16,
        }}
      >
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Space align="center">
            <Title level={3} style={{ margin: 0, color: '#f3f4f6' }}>
              FDEC
            </Title>
            <Tag color="blue">Fusion Direct Energy Conversion</Tag>
            <Text style={{ color: '#9ca3af' }}>聚变直接能量转换电站 · 可视化模型</Text>
          </Space>
          <Paragraph style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
            核心哲学：不让粒子的能量先变成热，让粒子直接成为电。
          </Paragraph>
        </Space>
      </Header>

      <Content style={{ padding: 24, maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <Card
          size="small"
          style={{ background: 'var(--fdec-panel)', marginBottom: 16 }}
          title={<span className="fdec-section-title">聚变源功率设定</span>}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text style={{ color: '#9ca3af' }}>P_f = </Text>
              <Text strong style={{ color: '#ef4444', fontSize: 18 }} className="fdec-mono">
                {formatPower(fusionPower)}
              </Text>
            </div>
            <Slider
              min={0.1}
              max={5}
              step={0.1}
              value={fusionPower / 1e9}
              onChange={(v) => setFusionPower(v * 1e9)}
              marks={{ 0.1: '0.1 GW', 1: '1 GW', 2: '2 GW', 3: '3 GW', 5: '5 GW' }}
              tooltip={{ formatter: (v) => `${v} GW` }}
            />
          </Space>
        </Card>

        <Card
          size="small"
          style={{ background: 'var(--fdec-panel)', marginBottom: 16 }}
          title={<span className="fdec-section-title">① 能量流图：聚变 → 粒子分离 → 直接电磁回收 → HVDC</span>}
        >
          <EnergyFlowDiagram source={source} alpha={alpha} etaAlpha={etaAlpha} />
        </Card>

        <Divider orientation="left" style={{ borderColor: '#1f2937', color: '#9ca3af', fontSize: 13 }}>
          第一步～第七步：基础物理量
        </Divider>

        <div style={{ marginBottom: 16 }}>
          <KeyParametersPanel source={source} alpha={alpha} />
        </div>

        <Card
          size="small"
          style={{ background: 'var(--fdec-panel)', marginBottom: 16 }}
          title={<span className="fdec-section-title">② α 粒子发电机：反向粒子加速器（I × V = P）</span>}
        >
          <ParticleGenerator alpha={alpha} etaAlpha={etaAlpha} />
        </Card>

        <Divider orientation="left" style={{ borderColor: '#1f2937', color: '#9ca3af', fontSize: 13 }}>
          引入现实约束：效率与空间电荷
        </Divider>

        <div style={{ marginBottom: 16 }}>
          <AlphaEfficiencyTable fusionPower={fusionPower} etaAlpha={etaAlpha} onEtaChange={setEtaAlpha} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <SpaceChargeModel
            alpha={alpha}
            voltage={scVoltage}
            gapDistance={scGap}
            collectionArea={scArea}
            onVoltageChange={setScVoltage}
            onGapChange={setScGap}
            onAreaChange={setScArea}
          />
        </div>

        <Divider orientation="left" style={{ borderColor: '#1f2937', color: '#9ca3af', fontSize: 13 }}>
          燃料演进：D-T → D-³He → p-B¹¹
        </Divider>

        <div style={{ marginBottom: 16 }}>
          <FuelComparison fusionPower={fusionPower} eta={etaAlpha} />
        </div>

        <Card size="small" style={{ background: '#0d1421', border: '1px solid #1f2937' }}>
          <Paragraph style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
            <Text strong style={{ color: '#9ca3af' }}>模型说明：</Text>
            本可视化基于能量守恒与 Child–Langmuir 空间电荷定律，尚未引入等离子体 MHD、
            辐射损失、能量倍增与包层中子学。α 直接转换效率 η_α 为唯象参数。
            理想上限 P_α = P_f × 3.5/17.6 ≈ 199 MW（1 GW 源），中子 80% 能量需经核转换层二次回收。
          </Paragraph>
        </Card>
      </Content>
    </Layout>
  );
}