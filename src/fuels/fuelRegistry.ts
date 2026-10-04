import type { FusionReaction } from './reactionTypes';
import { DTReaction } from './dt';
import { DDReaction } from './dd';
import { DHe3Reaction } from './dhe3';
import { PB11Reaction } from './pb11';

export const FuelRegistry: FusionReaction[] = [
  DTReaction,
  DDReaction,
  DHe3Reaction,
  PB11Reaction,
];

export function getReaction(key: string): FusionReaction {
  return FuelRegistry.find((r) => r.key === key) ?? DTReaction;
}

export function getPrimaryFuels(): FusionReaction[] {
  return FuelRegistry.filter((r) => r.key !== 'DD');
}

export { DTReaction, DDReaction, DHe3Reaction, PB11Reaction };