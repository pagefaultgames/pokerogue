import type { BattlerIndex } from "#enums/battler-index";
import type { BattleStat } from "#enums/stat";
import type { StatChangeSource } from "#enums/stat-change-source";
import type { Pokemon } from "#field/pokemon";
import type { PokemonPhase } from "#phases/pokemon-phase";
import type { StatStageChangePhase } from "#phases/stat-stage-change-phase";

/**
/** Interface representing a single stat stage change. */
export interface StatChange {
  /** The stat to change. */
  readonly stat: BattleStat;
  /** The number of stages to change the stat by. */
  // TODO: The only reason we cannot make this `StatStage` is belly drum
  readonly stages: number;
}

export type StatStageChangeCallback = (target: Pokemon | null, changes: readonly StatChange[]) => void;

/**
 * Options type for {@linkcode StatStageChangePhase}.
 * @privateRemarks
 * Callers are free to re-use the same options between calls if desired,
 * as the Phase shallow-clones all relevant fields.
 */
export interface StatStageChangePhaseOptions {
  /**
   * The {@linkcode BattlerIndex} of the `Pokemon` receiving the stat changes.
   * Forwarded directly to {@linkcode PokemonPhase}'s constructor.
   */
  readonly battlerIndex: BattlerIndex | number;
  /** The stat changes to be applied. */
  // TODO: Enforce nonemptiness
  readonly changes: readonly StatChange[];
  /**
   * The `Pokemon` who caused the stat changes, or `undefined` if the changes were caused by a non-Pokemon effect.
   * @remarks
   * May be the same as the `Pokemon` receiving the changes.
   */
  readonly sourcePokemon: Pokemon | undefined;
  /**
   * Whether to ignore abilities that could affect the stat changes being applied.
   * @defaultValue `false`
   */
  readonly ignoreAbilities?: boolean;
  /**
   * A callback to invoke with the applied changes.
   * Used exclusively to allow Stockpile to track the stat stages actually applied.
   */
  readonly onChange?: StatStageChangeCallback;
  /**
   * The category of effect that produced this change, if relevant.
   * Used to enable or disable certain effects like Mirror Armor and Opportunist.
   */
  readonly sourceEffectType?: StatChangeSource;
  /**
   * When `true`, pre-processing (multipliers, protection checks, sign-splitting)
   * will be skipped due to being already performed by the phase that queued this one.
   * @defaultValue `false`
   * @remarks
   * Should not be passed by anything other than this Phase.
   */
  readonly processed?: boolean;
  /**
   * An optional callback used to produce the message displayed when the stat change is applied.
   * If not provided, the default message is used.
   * @remarks
   * Intended to be used for static messages (hence why the applied changes are omitted).
   * @privateRemarks
   * Currently only used by Belly Drum.
   */
  readonly message?: ((user: Pokemon) => string) | undefined;
}
