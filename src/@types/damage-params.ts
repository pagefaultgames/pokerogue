import type { MoveCategory } from "#enums/move-category";
import type { Pokemon } from "#field/pokemon";
import type { IllusionData } from "#types/illusion-data";
import type { Move, MoveTypeChartOverrideAttr } from "#types/move-types";

/**
 * Collection of types for methods like {@linkcode Pokemon.getBaseDamage} and {@linkcode Pokemon.getAttackDamage}.
 * @module
 */

/** Base type for damage parameter methods, used for DRY */
interface DamageParams {
  /** The attacking {@linkcode Pokemon} */
  source: Pokemon;
  /** The move used in the attack */
  move: Move;
  /** The move's {@linkcode MoveCategory} after variable-category effects are applied */
  moveCategory: MoveCategory;
  /** If `true`, ignores this Pokemon's defensive ability effects */
  ignoreAbility?: boolean;
  /** If `true`, ignores the attacking Pokemon's ability effects */
  ignoreSourceAbility?: boolean;
  /** If `true`, ignores the ally Pokemon's ability effects */
  ignoreAllyAbility?: boolean;
  /** If `true`, ignores the ability effects of the attacking pokemon's ally */
  ignoreSourceAllyAbility?: boolean;
  /** If `true`, calculates damage for a critical hit */
  isCritical?: boolean;
  /** If `true`, suppresses changes to game state during the calculation */
  simulated?: boolean;
  /** If defined, used in place of calculated effectiveness values */
  effectiveness?: number;
}

/**
 * Type for the parameters of {@linkcode Pokemon.getBaseDamage}
 * @interface
 */
export type GetBaseDamageParams = Omit<DamageParams, "effectiveness">;

/**
 * Type for the parameters of {@linkcode Pokemon.getAttackDamage}
 * @interface
 */
export type GetAttackDamageParams = Omit<DamageParams, "moveCategory">;

/**
 * Type for the parameters of {@linkcode Pokemon.getAttackTypeEffectiveness}.
 */
export interface GetAttackTypeEffectivenessParams {
  /**
   * The {@linkcode Pokemon} using the move, used to check the user's Scrappy and Mind's Eye abilities
   * and the effects of Foresight/Odor Sleuth.
   */
  source?: Pokemon;
  /**
   * If `true`, ignores the effect of strong winds (used by anticipation, forewarn, stealth rocks)
   * @defaultValue `false`
   */
  ignoreStrongWinds?: boolean;
  /**
   * If `true`, will prevent changes to game state during calculations.
   * @defaultValue `false`
   */
  simulated?: boolean;
  /**
   * The {@linkcode Move} whose type effectiveness is being checked.
   * Used for applying {@linkcode MoveTypeChartOverrideAttr}.
   */
  move?: Move;
  /**
   * Whether to consider this Pokemon's {@linkcode IllusionData | illusion} when determining types.
   * @defaultValue `false`
   */
  useIllusion?: boolean;
}
