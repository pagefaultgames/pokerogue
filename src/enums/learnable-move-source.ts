import type { ObjectValues } from "#types/type-helpers";

/**
 * Shows the source a move can be learned from. Used to contextualize/color relearn moves. \
 * Fusion sources are offset by +1 from their base counterpart.
 */
export const LearnableMoveSource = {
  LEVEL: 0,
  FUSION_LEVEL: 1,
  RELEARN: 2,
  FUSION_RELEARN: 3,
  EVOLUTION: 4,
  FUSION_EVOLUTION: 5,
  PREVO: 6,
  FUSION_PREVO: 7,
  TM: 8,
  FUSION_TM: 9,
  EGG: 10,
  FUSION_EGG: 11,
  OTHER: 12,
  FUSION_OTHER: 13,
} as const;

export type LearnableMoveSource = ObjectValues<typeof LearnableMoveSource>;
