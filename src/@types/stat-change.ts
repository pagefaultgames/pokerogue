import type { BattlerIndex } from "#enums/battler-index";
import type { BattleStat } from "#enums/stat";
import type { StatChangeSource } from "#enums/stat-change-source";
import type { Pokemon } from "#field/pokemon";

/**
 * Represents a single stat stage change. Readonly to avoid accidental changes.
 */
export interface StatChange {
  readonly stat: BattleStat;
  readonly stages: number;
}

export type StatStageChangeCallback = (target: Pokemon | null, changed: readonly StatChange[]) => void;

export interface StatStageChangePhaseOptions {
  battlerIndex: BattlerIndex | number;
  changes: readonly StatChange[];
  /** The Pokemon who caused these stat changes (may be the same as the Pokemon this Phase is applied to). */
  sourcePokemon: Pokemon | undefined;
  /** If `true`, skip `StatStageChangeMultiplierAbAttr` */
  ignoreAbilities?: boolean;
  /**
   * A callback to invoke with the applied changes.
   * Used exclusively to allow Stockpile to track the stat stages actually applied.
   */
  onChange?: StatStageChangeCallback;
  /** The category of effect that produced this change, if relevant */
  sourceEffectType?: StatChangeSource;
  /**
   * When `true`, pre-processing (multipliers, protection checks, sign-splitting)
   * is skipped because it was already performed by the phase that queued this one.
   * @remarks
   * Should not be passed by anything other than this phase.
   */
  processed?: boolean;
}
