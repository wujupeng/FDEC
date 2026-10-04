export interface NeutronChainResult {
  pCaptured: number;
  pConverted: number;
  pExtracted: number;
  pElectric: number;
  pLost: number;
  overallEfficiency: number;
}

export function computeNeutronChain(
  pNeutron: number,
  etaCapture: number,
  etaConversion: number,
  etaExtraction: number,
  etaDec: number
): NeutronChainResult {
  const pCaptured = pNeutron * etaCapture;
  const pConverted = pCaptured * etaConversion;
  const pExtracted = pConverted * etaExtraction;
  const pElectric = pExtracted * etaDec;
  const pLost = pNeutron - pElectric;
  const overallEfficiency = etaCapture * etaConversion * etaExtraction * etaDec;

  return { pCaptured, pConverted, pExtracted, pElectric, pLost, overallEfficiency };
}

export function neutronStageLabels(): { stage: string; param: string }[] {
  return [
    { stage: '中子通量 P_n', param: '—' },
    { stage: '捕获 P_captured', param: 'η_capture' },
    { stage: '核反应转换 P_converted', param: 'η_conversion' },
    { stage: '带电粒子引出 P_extracted', param: 'η_extraction' },
    { stage: '直接转换 P_electric', param: 'η_DEC' },
  ];
}