import type { HitResult } from "#enums/hit-result";

/** Union type containing all damage-dealing {@linkcode HitResult}s. */
export type DamageResult =
  | HitResult.EFFECTIVE
  | HitResult.EXTREMELY_EFFECTIVE
  | HitResult.SUPER_EFFECTIVE
  | HitResult.NOT_VERY_EFFECTIVE
  | HitResult.MOSTLY_INEFFECTIVE
  | HitResult.ONE_HIT_KO
  | HitResult.CONFUSION
  | HitResult.INDIRECT_KO
  | HitResult.INDIRECT;

/** Interface containing the results of a damage calculation for a given move. */
export interface DamageCalculationResult {
  /** `true` if the move was cancelled (thus suppressing "No Effect" messages) */
  cancelled: boolean;
  /** The effectiveness of the move */
  result: HitResult;
  /** The damage dealt by the move */
  damage: number;
}
