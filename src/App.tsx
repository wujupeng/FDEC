import { useState, useMemo } from 'react';
import { Layout, Typography, Slider, Card, Space, Tag, Divider } from 'antd';
import { computeFusionSource, computeAlphaElectrical } from './physics/fusion';
import { computeAlphaHeating } from './physics/alphaHeating';
import { computeNeutronConversion } from './physics/neutronConversion';
import { computeNetPower } from './physics/netPower';
import { formatPower } from './physics/format';
import EnergyFlowDiagram from './components/EnergyFlowDiagram';
import KeyParametersPanel from './components/KeyParametersPanel';
import ParticleGenerator from './components/ParticleGenerator';
import AlphaEfficiencyTable from './components/AlphaEfficiencyTable';
import SpaceChargeModel from './components/SpaceChargeModel';
import FuelComparison from './components/FuelComparison';
import CredibilityLevels from './components/CredibilityLevels';
import AlphaHeatingConstraint from './components/AlphaHeatingConstraint';
import AlphaOrbit from './components/AlphaOrbit';
import CoaxialConverter from './components/CoaxialConverter';
import NeutronConversionLayers from './components/NeutronConversionLayers';
import NetPowerSummary from './components/NetPowerSummary';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function App() {
  const [fusionPower, setFusionPower] = useState(1e9);
  const [etaAlpha, setEtaAlpha] = useState(0.6);
  const [scVoltage, setScVoltage] = useState(1.75e6);
  const [scGap, setScGap] = useState(0.01);
  const [scArea, setScArea] = useState(0.5);

  const [fAlpha, setFAlpha] = useState(0.3);
  const [pRequired, setPRequired] = useState(100e6);
  const [bField, setBField] = useState(10);
  const [coaxV, setCoaxV] = useState(1.75e6);
  const [coaxInner, setCoaxInner] = useState(0.01);
  const [coaxOuter, setCoaxOuter] = useState(0.1);
  const [etaCapture, setEtaCapture] = useState(0.5);
  const [etaTransfer, setEtaTransfer] = useState(0.6);
  const [etaDec, setEtaDec] = useState(0.6);
  const [pMagnet, setPMagnet] = useState(30e6);
  const [pVacuum, setPVacuum] = useState(10e6);
  const [pCooling, setPCooling] = useState(20e6);
  const [pPowerElec, setPPowerElec] = useState(15e6);
  const [pRadiation, setPRadiation] = useState(10e6);

  const source = useMemo(() => computeFusionSource(fusionPower), [fusionPower]);
  const alpha = useMemo(() => computeAlphaElectrical(fusionPower), [fusionPower]);
  const heating = useMemo(
    () => computeAlphaHeating(source.alphaPower, fAlpha, pRequired),
    [source.alphaPower, fAlpha, pRequired]
  );
  const pAlphaElectric = heating.pAlphaExtract * etaAlpha;
  const neutron = useMemo(
    () => computeNeutronConversion(source.neutronPower, etaCapture, etaTransfer, etaDec),
    [source.neutronPower, etaCapture, etaTransfer, etaDec]
  );
  const net = useMemo(
    () =>
      computeNetPower(
        pAlphaElectric,
        neutron.pElectric,
        fusionPower,
        heating.pExternal,
        pMagnet,
        pVacuum,
        pCooling,
        pPowerElec,
        pRadiation
      ),
    [pAlphaElectric, neutron.pElectric, fusionPower, heating.pExternal, pMagnet, pVacuum, pCooling, pPowerElec, pRadiation]
  );

  const handlePlantChange = (key: string, value: number) => {
    switch (key) {
      case 'pMagnet': setPMagnet(value); break;
      case 'pVacuum': setPVacuum(value); break;
      case 'pCooling': setPCooling(value); break;
      case 'pPowerElec': setPPowerElec(value); break;
      case 'pRadiation': setPRadiation(value); break;
      default: break;
    }
  };

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
            <Title level={3} style={{ margin: 0, color: '#f3f4f6' }}>FDEC V2</Title>
            <Tag color="blue">Fusion Direct Energy Conversion System Model</Tag>
            <Text style={{ color: '#9ca3af' }}>聚变直接能量转换 · 物理—工程两级仿真器</Text>
          </Space>
          <Paragraph style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
            让程序不断给想法制造困难，然后看它还能不能活下来。
          </Paragraph>
        </Space>
      </Header>

      <Content style={{ padding: 24, maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <Card size="small" style={{ background: 'var(--fdec-panel)', marginBottom: 16 }} title={<span className="fdec-section-title">聚变源功率设定</span>}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text style={{ color: '#9ca3af' }}>P_f = </Text>
              <Text strong style={{ color: '#ef4444', fontSize: 18 }} className="fdec-mono">{formatPower(fusionPower)}</Text>
            </div>
            <Slider min={0.1} max={5} step={0.1} value={fusionPower / 1e9} onChange={(v) => setFusionPower(v * 1e9)} marks={{ 0.1: '0.1 GW', 1: '1 GW', 2: '2 GW', 3: '3 GW', 5: '5 GW' }} tooltip={{ formatter: (v) => `${v} GW` }} />
          </Space>
        </Card>

        <Card size="small" style={{ background: 'var(--fdec-panel)', marginBottom: 16 }} title={<span className="fdec-section-title">① 能量流图：聚变 → 粒子分离 → 直接电磁回收 → HVDC</span>}>
          <EnergyFlowDiagram source={source} alpha={alpha} etaAlpha={etaAlpha} />
        </Card>

        <Divider orientation="left" style={{ borderColor: '#1f2937', color: '#9ca3af', fontSize: 13 }}>基础物理量（第一步～第七步）</Divider>

        <div style={{ marginBottom: 16 }}><KeyParametersPanel source={source} alpha={alpha} /></div>

        <Card size="small" style={{ background: 'var(--fdec-panel)', marginBottom: 16 }} title={<span className="fdec-section-title">② α 粒子发电机：反向粒子加速器（I × V = P）</span>}>
          <ParticleGenerator alpha={alpha} etaAlpha={etaAlpha} />
        </Card>

        <Divider orientation="left" style={{ borderColor: '#1f2937', color: '#9ca3af', fontSize: 13 }}>V2 物理校准：理论上限 ≠ 工程输出</Divider>

        <div style={{ marginBottom: 16 }}>
          <CredibilityLevels pAlpha={source.alphaPower} pDec={pAlphaElectric} pNet={net.pNet} fusionPower={fusionPower} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <AlphaHeatingConstraint pAlpha={source.alphaPower} fAlpha={fAlpha} pRequired={pRequired} onFAlphaChange={setFAlpha} onPRequiredChange={setPRequired} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <AlphaOrbit bField={bField} onBChange={setBField} />
        </div>

        <Divider orientation="left" style={{ borderColor: '#1f2937', color: '#9ca3af', fontSize: 13 }}>工程约束：电场结构 / 空间电荷 / 中子转换</Divider>

        <div style={{ marginBottom: 16 }}>
          <CoaxialConverter voltage={coaxV} innerRadius={coaxInner} outerRadius={coaxOuter} onVoltageChange={setCoaxV} onInnerChange={setCoaxInner} onOuterChange={setCoaxOuter} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <AlphaEfficiencyTable fusionPower={fusionPower} etaAlpha={etaAlpha} onEtaChange={setEtaAlpha} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <SpaceChargeModel alpha={alpha} voltage={scVoltage} gapDistance={scGap} collectionArea={scArea} onVoltageChange={setScVoltage} onGapChange={setScGap} onAreaChange={setScArea} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <NeutronConversionLayers pNeutron={source.neutronPower} etaCapture={etaCapture} etaTransfer={etaTransfer} etaDec={etaDec} onCaptureChange={setEtaCapture} onTransferChange={setEtaTransfer} onDecChange={setEtaDec} />
        </div>

        <Divider orientation="left" style={{ borderColor: '#1f2937', color: '#9ca3af', fontSize: 13 }}>最终答案：净电输出 P_net</Divider>

        <div style={{ marginBottom: 16 }}>
          <NetPowerSummary
            result={net}
            fusionPower={fusionPower}
            pHeating={heating.pExternal}
            pMagnet={pMagnet}
            pVacuum={pVacuum}
            pCooling={pCooling}
            pPowerElec={pPowerElec}
            pRadiation={pRadiation}
            onPlantChange={handlePlantChange}
          />
        </div>

        <Divider orientation="left" style={{ borderColor: '#1f2937', color: '#9ca3af', fontSize: 13 }}>燃料演进：D-T → D-³He → p-B¹¹</Divider>

        <div style={{ marginBottom: 16 }}>
          <FuelComparison fusionPower={fusionPower} eta={etaAlpha} />
        </div>

        <Card size="small" style={{ background: '#0d1421', border: '1px solid #1f2937' }}>
          <Paragraph style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
            <Text strong style={{ color: '#9ca3af' }}>V2 模型说明：</Text>
            本仿真器在能量守恒基础上引入 α 抽取率与聚变自持约束（f_α vs P_required）、
            洛伦兹回旋半径、同轴圆柱电场 E(r)=V/(r·ln(b/a))、Child–Langmuir 空间电荷、
            中子转换三参数（η_capture·η_transfer·η_DEC）与厂用电分项，输出净电效率 η_net。
            尚未引入等离子体 MHD、输运、α 扩散与包层中子学。若 η_net &lt; 0，说明当前参数下
            直接发电不经济——这是科学模型而非项目失败。
          </Paragraph>
        </Card>
      </Content>
    </Layout>
  );
}
