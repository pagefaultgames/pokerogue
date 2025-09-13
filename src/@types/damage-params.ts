import type { MoveCategory } from "#enums/move-category";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#types/move-types";

/**
 * Collection of types for methods like {@linkcode Pokemon#getBaseDamage} and {@linkcode Pokemon#getAttackDamage}.
 * @module
 */

/** Base type for damage parameter methods, used for DRY */
export interface damageParams {
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
 * Type for the parameters of {@linkcode Pokemon#getBaseDamage | getBaseDamage}
 * @interface
 */
export type getBaseDamageParams = Omit<damageParams, "effectiveness">;

/**
 * Type for the parameters of {@linkcode Pokemon#getAttackDamage | getAttackDamage}
 * @interface
 */
export type getAttackDamageParams = Omit<damageParams, "moveCategory">;
