/** Represent the result of a hit check against a target. */
export const HitCheckResult = {
  /** Hit checks haven't been evaluated yet in this pass */
  PENDING: 0,
  /** The move hits the target successfully */
  HIT: 1,
  /** The move has no effect on the target */
  NO_EFFECT: 2,
  /** The move has no effect on the target, but doesn't proc the default "no effect" message. */
  NO_EFFECT_NO_MESSAGE: 3,
  /** The target protected itself against the move */
  PROTECTED: 4,
  /** The move missed the target */
  MISS: 5,
  /** The move failed unexpectedly */
  ERROR: 6,
} as const;

export type HitCheckResult = typeof HitCheckResult[keyof typeof HitCheckResult];
