import { useState, useMemo } from 'react';
import { Layout, Typography, Slider, Card, Space, Tag, Divider, Select, Row, Col } from 'antd';
import { computeFusionSource, computeAlphaElectrical } from './physics/fusion';
import { computeAlphaHeating } from './physics/alphaHeating';
import { computeNeutronConversion } from './physics/neutronConversion';
import { computeNetPower } from './physics/netPower';
import { formatPower } from './physics/format';
import { computePlasmaConfinement } from './physics/plasma';
import { computeSpaceChargeRatio } from './physics/spaceCharge';
import { computeNeutronChain } from './physics/neutron';
import { computeDirectConverter } from './physics/converter';
import { computePowerBalance } from './physics/powerBalance';
import { computeValidation } from './physics/validation';
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
import PhysicsValidationPanel from './components/PhysicsValidationPanel';
import OperatingMap from './components/OperatingMap';
import ParticleTrajectory from './components/ParticleTrajectory';
import NuclearConversionPanel from './components/NuclearConversionPanel';
import EnergyLedgerPanel from './components/EnergyLedgerPanel';
import ParticleMapPanel from './components/ParticleMapPanel';
import ReactorKPIPanel from './components/ReactorKPIPanel';
import OptimizationMapPanel from './components/OptimizationMapPanel';
import { getPrimaryFuels, getReaction } from './fuels/fuelRegistry';
import { computeEnergyLedger } from './physics/energyLedger';
import { computeParticleLedger } from './physics/particleLedger';
import { computeReactorModel } from './reactor/reactorModel';
import { computeOptimizationMap } from './reactor/kpi';
import { ReactorGeometries, getGeometry } from './reactor/geometry';

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
  const [etaExtraction] = useState(0.8);
  const [v4FuelKey, setV4FuelKey] = useState('DT');
  const [v4GeomKey, setV4GeomKey] = useState('linear');
  const [v4TempKeV, setV4TempKeV] = useState(15);
  const [v4Density] = useState(1e20);
  const [v4Confinement] = useState(1.0);

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

  const plasma = useMemo(
    () => computePlasmaConfinement(source.alphaPower * (1 - fAlpha), heating.pExternal, pRequired),
    [source.alphaPower, fAlpha, heating.pExternal, pRequired]
  );
  const scRatio = useMemo(
    () => computeSpaceChargeRatio(alpha.alphaCurrent, scArea, scVoltage, scGap),
    [alpha.alphaCurrent, scArea, scVoltage, scGap]
  );
  const neutronChain = useMemo(
    () => computeNeutronChain(source.neutronPower, etaCapture, etaTransfer, etaExtraction, etaDec),
    [source.neutronPower, etaCapture, etaTransfer, etaExtraction, etaDec]
  );
  const converter = useMemo(
    () => computeDirectConverter(pAlphaElectric, neutronChain.pElectric),
    [pAlphaElectric, neutronChain.pElectric]
  );
  const powerBalance = useMemo(
    () => computePowerBalance(converter.pElectric, fusionPower, {
      pPlasma: heating.pExternal,
      pMagnet,
      pVacuum,
      pCooling,
      pPower: pPowerElec,
      pControl: pRadiation,
    }),
    [converter.pElectric, fusionPower, heating.pExternal, pMagnet, pVacuum, pCooling, pPowerElec, pRadiation]
  );
  const validation = useMemo(
    () => computeValidation({
      pFusion: fusionPower,
      pAlpha: source.alphaPower,
      pNeutron: source.neutronPower,
      mFactor: plasma.mFactor,
      rSc: scRatio.rSc,
      neutronOverallEfficiency: neutronChain.overallEfficiency,
      pNet: powerBalance.pNet,
      etaNet: powerBalance.etaNet,
    }),
    [fusionPower, source.alphaPower, source.neutronPower, plasma.mFactor, scRatio.rSc, neutronChain.overallEfficiency, powerBalance.pNet, powerBalance.etaNet]
  );

  const v4Reaction = useMemo(() => getReaction(v4FuelKey), [v4FuelKey]);
  const v4Geometry = useMemo(() => getGeometry(v4GeomKey as 'tokamak' | 'linear' | 'mirror' | 'frc'), [v4GeomKey]);
  const v4Ledger = useMemo(
    () => computeEnergyLedger({
      reaction: v4Reaction,
      fusionPower,
      fAlphaExtract: fAlpha,
      etaAlphaCapture: etaAlpha,
      etaAlphaDec: etaDec,
      etaNeutronCapture: etaCapture,
      etaNeutronConversion: etaTransfer,
      etaNeutronDec: etaDec,
      pPlasma: heating.pExternal,
      pMagnet, pVacuum, pCooling,
      pPower: pPowerElec,
      pControl: pRadiation,
      etaThermalRecovery: 0.3,
    }),
    [v4Reaction, fusionPower, fAlpha, etaAlpha, etaDec, etaCapture, etaTransfer, heating.pExternal, pMagnet, pVacuum, pCooling, pPowerElec, pRadiation]
  );
  const v4ParticleLedger = useMemo(
    () => computeParticleLedger({
      reaction: v4Reaction,
      fusionPower,
      fAlphaExtract: fAlpha,
      etaAlphaCapture: etaAlpha,
      etaAlphaDec: etaDec,
      etaNeutronCapture: etaCapture,
      etaNeutronConversion: etaTransfer,
      etaNeutronDec: etaDec,
    }),
    [v4Reaction, fusionPower, fAlpha, etaAlpha, etaDec, etaCapture, etaTransfer]
  );
  const v4ReactorModel = useMemo(
    () => computeReactorModel({
      reaction: v4Reaction,
      geometry: v4Geometry,
      fusionPower,
      fAlphaExtract: fAlpha,
      etaAlphaCapture: etaAlpha,
      etaAlphaDec: etaDec,
      etaNeutronCapture: etaCapture,
      etaNeutronConversion: etaTransfer,
      etaNeutronDec: etaDec,
      temperatureKeV: v4TempKeV,
      densityM3: v4Density,
      confinementTime: v4Confinement,
      pPlasma: heating.pExternal,
      pMagnet, pVacuum, pCooling,
      pPower: pPowerElec,
      pControl: pRadiation,
      etaThermalRecovery: 0.3,
    }),
    [v4Reaction, v4Geometry, fusionPower, fAlpha, etaAlpha, etaDec, etaCapture, etaTransfer, v4TempKeV, v4Density, v4Confinement, heating.pExternal, pMagnet, pVacuum, pCooling, pPowerElec, pRadiation]
  );
  const v4OptMap = useMemo(
    () => computeOptimizationMap({
      fusionPower,
      fAlphaExtract: fAlpha,
      etaAlphaCapture: etaAlpha,
      etaAlphaDec: etaDec,
      etaNeutronCapture: etaCapture,
      etaNeutronConversion: etaTransfer,
      etaNeutronDec: etaDec,
      temperatureKeV: v4TempKeV,
      densityM3: v4Density,
      confinementTime: v4Confinement,
      pPlasma: heating.pExternal,
      pMagnet, pVacuum, pCooling,
      pPower: pPowerElec,
      pControl: pRadiation,
      etaThermalRecovery: 0.3,
    }),
    [fusionPower, fAlpha, etaAlpha, etaDec, etaCapture, etaTransfer, v4TempKeV, v4Density, v4Confinement, heating.pExternal, pMagnet, pVacuum, pCooling, pPowerElec, pRadiation]
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
            <Title level={3} style={{ margin: 0, color: '#f3f4f6' }}>FDEC V4</Title>
            <Tag color="blue">Fusion Reactor Architecture & Direct Energy Optimization</Tag>
            <Text style={{ color: '#9ca3af' }}>聚变直接能量转换 · 反应堆方案比较器</Text>
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

        <Divider orientation="left" style={{ borderColor: '#374151', color: '#e5e7eb', fontSize: 14 }}>
          V3 物理引擎：自洽性校验 / 参数扫描 / 粒子轨迹 / 核反应转换
        </Divider>

        <div style={{ marginBottom: 16 }}>
          <PhysicsValidationPanel result={validation} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <OperatingMap requiredCurrent={alpha.alphaCurrent} collectionArea={scArea} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <ParticleTrajectory />
        </div>

        <div style={{ marginBottom: 16 }}>
          <NuclearConversionPanel />
        </div>

        <Card size="small" style={{ background: '#0d1421', border: '1px solid #1f2937' }}>
          <Paragraph style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
            <Text strong style={{ color: '#9ca3af' }}>V3 物理引擎说明：</Text>
            在 V2 基础上引入自持约束 M 因子（P_α,heat+P_ext vs P_loss）、Boris pusher 粒子轨迹积分、
            空间电荷 Operating Map（电压×间距参数扫描）、核反应转换层 P=1−exp(−nσx)（⁶Li/⁷Li/⁹Be/²³⁸U）、
            中子四参数链（η_capture·η_conversion·η_extraction·η_DEC）与 6 项物理校验引擎。
            目标不是证明 FDEC 一定能发电，而是找出它在哪些物理条件下成立、在哪些条件下必然失败。
          </Paragraph>
        </Card>

        <Divider orientation="left" style={{ borderColor: '#374151', color: '#e5e7eb', fontSize: 14 }}>
          V4 反应堆方案比较器：能量账本 / 粒子账本 / KPI / Fuel×Geometry 优化
        </Divider>

        <Card size="small" style={{ background: 'var(--fdec-panel)', marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Text style={{ color: '#9ca3af', fontSize: 12 }}>燃料反应</Text>
              <Select
                value={v4FuelKey}
                onChange={setV4FuelKey}
                style={{ width: '100%', marginTop: 4 }}
                options={getPrimaryFuels().map((f) => ({ value: f.key, label: `${f.fuel} — ${f.reaction}` }))}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text style={{ color: '#9ca3af', fontSize: 12 }}>反应堆几何</Text>
              <Select
                value={v4GeomKey}
                onChange={setV4GeomKey}
                style={{ width: '100%', marginTop: 4 }}
                options={ReactorGeometries.map((g) => ({ value: g.type, label: `${g.name} — ${g.description.slice(0, 20)}...` }))}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text style={{ color: '#9ca3af', fontSize: 12 }}>等离子体温度: {v4TempKeV} keV</Text>
              <Slider min={5} max={300} step={5} value={v4TempKeV} onChange={setV4TempKeV} tooltip={{ formatter: (v) => `${v} keV` }} />
            </Col>
          </Row>
        </Card>

        <div style={{ marginBottom: 16 }}>
          <EnergyLedgerPanel result={v4Ledger} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <ParticleMapPanel result={v4ParticleLedger} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <ReactorKPIPanel result={v4ReactorModel} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <OptimizationMapPanel map={v4OptMap} />
        </div>

        <Card size="small" style={{ background: '#0d1421', border: '1px solid #1f2937' }}>
          <Paragraph style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
            <Text strong style={{ color: '#9ca3af' }}>V4 反应堆方案比较器说明：</Text>
            建立反应数据库（D-T / D-D / D-³He / p-B¹¹，含副反应与辐射损失）、能量账本（全链守恒审计）、
            粒子账本（N/s 产率追踪 + 电荷守恒）、等离子体功率平衡（韧致辐射 + 回旋辐射 + 输运损失）、
            粒子排气（几何因子 + 捕获效率）、反应堆几何（托卡马克 / 直线型 / 磁镜 / FRC）与
            Fuel×Geometry 二维优化矩阵。第一原则：允许模型否定自己的方案——NOT VIABLE 是有效输出。
          </Paragraph>
        </Card>
      </Content>
    </Layout>
  );
}
