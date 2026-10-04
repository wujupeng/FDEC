import type { AlphaElectricalResult } from '../physics/fusion';
import { formatCurrent, formatVoltage, formatPower } from '../physics/format';

interface ParticleGeneratorProps {
  alpha: AlphaElectricalResult;
  etaAlpha: number;
}

export default function ParticleGenerator({ alpha, etaAlpha }: ParticleGeneratorProps) {
  const W = 760;
  const H = 280;
  const outputPower = alpha.idealDecPower * etaAlpha;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="fdec-flow" role="img" aria-label="反向粒子加速器发电机">
        <defs>
          <linearGradient id="fieldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.9} />
          </linearGradient>
        </defs>

        <text x={W / 2} y={24} textAnchor="middle" fill="#9ca3af" fontSize={13}>
          反向粒子加速器发电机：α 粒子流入 → 电场逐级减速 → 电势能
        </text>

        <g>
          <circle cx={60} cy={140} r={26} fill="#ef4444" className="fdec-pulse" />
          <text x={60} y={144} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>α</text>
          <text x={60} y={186} textAnchor="middle" fill="#f59e0b" fontSize={11} className="fdec-mono">3.5 MeV</text>
        </g>

        {[0, 1, 2, 3, 4].map((i) => {
          const x = 130 + i * 110;
          const voltage = 1.75 - i * 0.35;
          return (
            <g key={i}>
              <rect x={x - 6} y={70} width={12} height={140} rx={2} fill="url(#fieldGrad)" opacity={0.85} />
              <text x={x} y={62} textAnchor="middle" fill="#22c55e" fontSize={11} className="fdec-mono">
                {voltage.toFixed(2)} MV
              </text>
              <line x1={x + 6} y1={140} x2={x + 104} y2={140} stroke="#f59e0b" strokeWidth={2} className="fdec-flow-line" />
              <text x={x + 55} y={132} textAnchor="middle" fill="#f59e0b" fontSize={10}>α→</text>
            </g>
          );
        })}

        <g>
          <rect x={670} y={110} width={70} height={60} rx={8} fill="#111827" stroke="#22c55e" strokeWidth={2} />
          <text x={705} y={136} textAnchor="middle" fill="#22c55e" fontSize={12} fontWeight={700}>电极</text>
          <text x={705} y={154} textAnchor="middle" fill="#22c55e" fontSize={10}>0 V</text>
        </g>

        <g>
          <line x1={705} y1={170} x2={705} y2={210} stroke="#22c55e" strokeWidth={2.5} className="fdec-flow-line" />
          <text x={705} y={232} textAnchor="middle" fill="#22c55e" fontSize={13} fontWeight={700} className="fdec-mono">
            DC {formatPower(outputPower)}
          </text>
        </g>

        <g>
          <text x={60} y={258} textAnchor="middle" fill="#9ca3af" fontSize={11}>电荷流</text>
          <text x={60} y={274} textAnchor="middle" fill="#f59e0b" fontSize={12} fontWeight={600} className="fdec-mono">
            {formatCurrent(alpha.alphaCurrent)}
          </text>
          <text x={380} y={258} textAnchor="middle" fill="#9ca3af" fontSize={11}>等效电压</text>
          <text x={380} y={274} textAnchor="middle" fill="#22c55e" fontSize={12} fontWeight={600} className="fdec-mono">
            {formatVoltage(alpha.alphaVoltage)}
          </text>
          <text x={705} y={258} textAnchor="middle" fill="#9ca3af" fontSize={11}>I × V 校验</text>
          <text x={705} y={274} textAnchor="middle" fill="#a855f7" fontSize={12} fontWeight={600} className="fdec-mono">
            {formatPower(alpha.powerCheck)}
          </text>
        </g>
      </svg>
      <div className="fdec-equation">
        I_α × V_α = {formatCurrent(alpha.alphaCurrent)} × {formatVoltage(alpha.alphaVoltage)} = {formatPower(alpha.powerCheck)} ≈ P_α (功率自洽)
      </div>
    </div>
  );
}