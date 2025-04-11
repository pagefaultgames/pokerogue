import type { HitResult } from "#enums/hit-result";

export type DamageResult =
  | HitResult.EFFECTIVE
  | HitResult.SUPER_EFFECTIVE
  | HitResult.NOT_VERY_EFFECTIVE
  | HitResult.ONE_HIT_KO
  | HitResult.CONFUSION
  | HitResult.INDIRECT_KO
  | HitResult.INDIRECT;
