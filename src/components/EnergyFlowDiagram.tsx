import type { FusionSourceResult, AlphaElectricalResult } from '../physics/fusion';
import { formatPower, formatCurrent, formatVoltage } from '../physics/format';

interface EnergyFlowDiagramProps {
  source: FusionSourceResult;
  alpha: AlphaElectricalResult;
  etaAlpha: number;
}

const NODE = {
  fill: '#111827',
  stroke: '#374151',
};

function NodeBox({
  x,
  y,
  w,
  h,
  title,
  subtitle,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={NODE.fill} stroke={color} strokeWidth={2} />
      <text x={x + w / 2} y={y + h / 2 - (subtitle ? 6 : 0)} textAnchor="middle" fill="#f3f4f6" fontSize={14} fontWeight={600}>
        {title}
      </text>
      {subtitle && (
        <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fill={color} fontSize={11} className="fdec-mono">
          {subtitle}
        </text>
      )}
    </g>
  );
}

function FlowLine({
  x1,
  y1,
  x2,
  y2,
  color,
  label,
  labelX,
  labelY,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  label?: string;
  labelX?: number;
  labelY?: number;
}) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} className="fdec-flow-line" />
      {label && (
        <text x={labelX ?? (x1 + x2) / 2} y={labelY ?? (y1 + y2) / 2 - 6} textAnchor="middle" fill={color} fontSize={11} className="fdec-mono">
          {label}
        </text>
      )}
    </g>
  );
}

export default function EnergyFlowDiagram({ source, alpha, etaAlpha }: EnergyFlowDiagramProps) {
  const alphaElectric = source.alphaPower * etaAlpha;
  const W = 1040;
  const H = 540;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fdec-flow" role="img" aria-label="FDEC 能量流图">
      <defs>
        <radialGradient id="fusionCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="60%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>

      <text x={W / 2} y={28} textAnchor="middle" fill="#9ca3af" fontSize={13}>
        FDEC 能量流：聚变 → 粒子分离 → 直接电磁回收 → HVDC → 电网
      </text>

      <g>
        <circle cx={90} cy={270} r={42} fill="url(#fusionCore)" className="fdec-pulse" />
        <text x={90} y={266} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>D + T</text>
        <text x={90} y={282} textAnchor="middle" fill="#fff" fontSize={11}>聚变</text>
        <text x={90} y={338} textAnchor="middle" fill="#ef4444" fontSize={12} fontWeight={600} className="fdec-mono">
          {formatPower(source.fusionPower)}
        </text>
      </g>

      <FlowLine x1={132} y1={270} x2={210} y2={270} color="#ef4444" label="17.6 MeV/反应" labelX={171} labelY={260} />
      <line x1={210} y1={150} x2={210} y2={390} stroke="#ef4444" strokeWidth={2} opacity={0.5} />
      <FlowLine x1={210} y1={150} x2={300} y2={150} color="#f59e0b" label="α 3.5 MeV" labelX={255} labelY={140} />
      <FlowLine x1={210} y1={390} x2={300} y2={390} color="#06b6d4" label="n 14.1 MeV" labelX={255} labelY={380} />

      <NodeBox x={300} y={118} w={150} h={64} title="α 粒子" subtitle={`${(source.alphaFraction * 100).toFixed(1)}% · ${formatPower(source.alphaPower)}`} color="#f59e0b" />
      <NodeBox x={300} y={358} w={150} h={64} title="中子 n" subtitle={`${(source.neutronFraction * 100).toFixed(1)}% · ${formatPower(source.neutronPower)}`} color="#06b6d4" />

      <FlowLine x1={450} y1={150} x2={540} y2={150} color="#f59e0b" label="磁场偏转" labelX={495} labelY={140} />
      <FlowLine x1={450} y1={390} x2={540} y2={390} color="#06b6d4" label="直线穿出" labelX={495} labelY={380} />

      <NodeBox x={540} y={118} w={150} h={64} title="磁场分离器" subtitle="B 场分选 α / n" color="#f59e0b" />
      <NodeBox x={540} y={358} w={150} h={64} title="中子转换层" subtitle="n → 核反应 → 带电粒子" color="#06b6d4" />

      <FlowLine x1={690} y1={150} x2={780} y2={150} color="#22c55e" label="电场减速" labelX={735} labelY={140} />
      <FlowLine x1={690} y1={390} x2={780} y2={390} color="#22c55e" label="带电粒子" labelX={735} labelY={380} />

      <NodeBox x={780} y={118} w={150} h={64} title="静电回收器" subtitle={`${formatVoltage(alpha.alphaVoltage)} × ${formatCurrent(alpha.alphaCurrent)}`} color="#22c55e" />
      <NodeBox x={780} y={358} w={150} h={64} title="次级回收器" subtitle="二级直接转换" color="#22c55e" />

      <line x1={930} y1={150} x2={930} y2={390} stroke="#22c55e" strokeWidth={2} opacity={0.5} />
      <FlowLine x1={930} y1={270} x2={970} y2={270} color="#22c55e" label="DC" labelX={950} labelY={258} />

      <g>
        <rect x={970} y={244} width={56} height={52} rx={8} fill={NODE.fill} stroke="#22c55e" strokeWidth={2} />
        <text x={998} y={266} textAnchor="middle" fill="#22c55e" fontSize={12} fontWeight={700}>HVDC</text>
        <text x={998} y={284} textAnchor="middle" fill="#22c55e" fontSize={10} className="fdec-mono">直流</text>
      </g>

      <g>
        <text x={120} y={470} fill="#9ca3af" fontSize={12}>α 直接发电（η = {(etaAlpha * 100).toFixed(0)}%）</text>
        <text x={120} y={492} fill="#22c55e" fontSize={15} fontWeight={700} className="fdec-mono">
          {formatPower(alphaElectric)}
        </text>
        <text x={300} y={470} fill="#9ca3af" fontSize={12}>理想上限（η = 100%）</text>
        <text x={300} y={492} fill="#f59e0b" fontSize={15} fontWeight={700} className="fdec-mono">
          {formatPower(alpha.idealDecPower)}
        </text>
        <text x={520} y={470} fill="#9ca3af" fontSize={12}>中子功率（待转换）</text>
        <text x={520} y={492} fill="#06b6d4" fontSize={15} fontWeight={700} className="fdec-mono">
          {formatPower(source.neutronPower)}
        </text>
        <text x={760} y={470} fill="#9ca3af" fontSize={12}>功率自洽校验 I×V</text>
        <text x={760} y={492} fill="#a855f7" fontSize={15} fontWeight={700} className="fdec-mono">
          {formatPower(alpha.powerCheck)}
        </text>
      </g>
    </svg>
  );
}