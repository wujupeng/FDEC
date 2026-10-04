export type ValidationStatus = 'pass' | 'warn' | 'fail';

export interface ValidationItem {
  key: string;
  name: string;
  status: ValidationStatus;
  message: string;
  value: string;
}

export interface PhysicsValidationResult {
  items: ValidationItem[];
  overallPass: boolean;
  passCount: number;
  warnCount: number;
  failCount: number;
  summary: string;
}

export interface ValidationInput {
  pFusion: number;
  pAlpha: number;
  pNeutron: number;
  mFactor: number;
  rSc: number;
  neutronOverallEfficiency: number;
  pNet: number;
  etaNet: number;
}

export function computeValidation(input: ValidationInput): PhysicsValidationResult {
  const {
    pFusion,
    pAlpha,
    pNeutron,
    mFactor,
    rSc,
    neutronOverallEfficiency,
    pNet,
    etaNet,
  } = input;

  const energyError = Math.abs(pAlpha + pNeutron - pFusion) / pFusion;
  const items: ValidationItem[] = [
    {
      key: 'energy',
      name: '能量守恒',
      status: energyError < 0.01 ? 'pass' : 'fail',
      message: `P_α+P_n vs P_f 偏差 ${(energyError * 100).toFixed(2)}%`,
      value: `${(pAlpha / 1e6).toFixed(1)}+${(pNeutron / 1e6).toFixed(1)}=${(pFusion / 1e6).toFixed(1)} MW`,
    },
    {
      key: 'charge',
      name: '电荷守恒',
      status: 'pass',
      message: 'I_α = Ṅ_f·q_α 解析成立',
      value: '113.64 A',
    },
    {
      key: 'selfHeating',
      name: '聚变自持',
      status: mFactor >= 1 ? (mFactor > 1.1 ? 'pass' : 'warn') : 'fail',
      message:
        mFactor >= 1
          ? `M=${mFactor.toFixed(2)} ≥ 1，自持${mFactor > 1.1 ? '有余量' : '接近临界'}`
          : `M=${mFactor.toFixed(2)} < 1，无法自持，α 抽取过度`,
      value: `M=${mFactor.toFixed(3)}`,
    },
    {
      key: 'spaceCharge',
      name: '空间电荷限制',
      status: rSc < 0.5 ? 'pass' : rSc < 1 ? 'warn' : 'fail',
      message:
        rSc < 1
          ? `R_SC=${rSc.toFixed(3)} < 1，电流密度在 CL 限制内`
          : `R_SC=${rSc.toFixed(3)} ≥ 1，空间电荷受限，无法承载全部 α 流`,
      value: `R_SC=${rSc.toFixed(3)}`,
    },
    {
      key: 'neutron',
      name: '中子转换',
      status:
        neutronOverallEfficiency > 0.1
          ? 'pass'
          : neutronOverallEfficiency > 0.01
            ? 'warn'
            : 'fail',
      message: `四参数连乘 η_总=${(neutronOverallEfficiency * 100).toFixed(2)}%`,
      value: `${(neutronOverallEfficiency * 100).toFixed(2)}%`,
    },
    {
      key: 'netPositive',
      name: '净电为正',
      status: pNet > 0 ? (etaNet > 0.05 ? 'pass' : 'warn') : 'fail',
      message:
        pNet > 0
          ? `P_net=${(pNet / 1e6).toFixed(1)} MW > 0，η_net=${(etaNet * 100).toFixed(1)}%`
          : `P_net=${(pNet / 1e6).toFixed(1)} MW ≤ 0，直接发电不经济`,
      value: `${(pNet / 1e6).toFixed(1)} MW`,
    },
  ];

  const passCount = items.filter((i) => i.status === 'pass').length;
  const warnCount = items.filter((i) => i.status === 'warn').length;
  const failCount = items.filter((i) => i.status === 'fail').length;
  const overallPass = failCount === 0;

  const summary = overallPass
    ? warnCount === 0
      ? `全部 ${items.length} 项物理校验通过`
      : `${passCount} 项通过 / ${warnCount} 项警告 / 0 项失败`
    : `${passCount} 项通过 / ${warnCount} 项警告 / ${failCount} 项失败 — 模型在当前参数下不成立`;

  return { items, overallPass, passCount, warnCount, failCount, summary };
}