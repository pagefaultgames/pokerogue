import type { PostDancingMoveAbAttr } from "#app/data/abilities/ability";
import type { BattlerTagLapseType } from "#app/data/battler-tags";

/**
 * Enum representing all the possible ways a given move can be executed.
 * Each one inherits the properties (or exclusions) of all types preceding it.
 * Properties newly found on a given use type will be **bolded**,
 * while oddities breaking a previous trend will be listed in _italics_.

 * Callers should refrain from performing non-equality checks on `MoveUseTypes` directly,
 * instead using the available helper functions
 * ({@linkcode isVirtual}, {@linkcode isIgnoreStatus}, {@linkcode isIgnorePP} and {@linkcode isReflected}).
 */
export enum MoveUseType {
  /**
  * This move was used normally (i.e. clicking on the button) or called via Instruct.
  * It deducts PP from the user's moveset (failing if out of PP), and interacts normally with other moves and abilities.
  */
  NORMAL = 1,

  /**
   * This move was called by an effect that ignores PP, such as a consecutively executed move (e.g. Outrage).

   * PP-ignoring moves (as their name implies) **do not consume PP** when used
   * and **will not fail** if none is left prior to execution.
   * All other effects remain identical to {@linkcode MoveUseType.NORMAL}.

   * PP can still be reduced by other effects (such as Spite or Eerie Spell).
   */
  IGNORE_PP = 2,

  /**
   * This move was called indirectly by an out-of-turn effect other than Instruct or the user's previous move.
   * Currently only used by {@linkcode PostDancingMoveAbAttr | Dancer}.

   * Indirect moves ignore PP checks similar to {@linkcode MoveUseType.IGNORE_PP}, but additionally **cannot be copied**
   * by all move-copying effects (barring reflection).
   * They are also **"skipped over" by most moveset and move history-related effects** (PP reduction, Last Resort, etc).

   * They still respect the user's volatile status conditions and confusion (though will uniquely _cure freeze and sleep before use_).
   */
  INDIRECT = 3,

  /**
    * This move was called as part of another move's effect (such as for most {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_call_other_moves | Move-calling moves}).

    * Follow-up moves **bypass cancellation** from all **non-volatile status conditions** and **{@linkcode BattlerTagLapseType.MOVE}-type effects**
    * (having been checked already on the calling move).

    * They are _not ignored_ by other move-calling moves and abilities (unlike {@linkcode MoveUseType.FOLLOW_UP} and {@linkcode MoveUseType.REFLECTED}),
    * but still inherit the former's disregard for moveset-related effects.
    */
  FOLLOW_UP = 4,

  /**
   * This move was reflected by Magic Coat or Magic Bounce.

   * Reflected moves ignore all the same cancellation checks as {@linkcode MoveUseType.INDIRECT}
   * and retain the same copy prevention as {@linkcode MoveUseType.FOLLOW_UP}, but additionally
   * **cannot be reflected by other reflecting effects**.
   */
  REFLECTED = 5
}

// # HELPER FUNCTIONS
// Please update the markdown tables if any new `MoveUseType`s get added.

/**
 * Check if a given {@linkcode MoveUseType} is virtual (i.e. called by another move or effect).
 * Virtual moves are ignored by most moveset-related effects and pre-move cancellation checks.
 * @param useType - The {@linkcode MoveUseType} to check.
 * @returns Whether {@linkcode useType} is virtual.
 * @remarks
 * This function is equivalent to the following truth table:
 *
 * | Use Type                           | Returns |
 * |------------------------------------|---------|
 * | {@linkcode MoveUseType.NORMAL}     | `false` |
 * | {@linkcode MoveUseType.IGNORE_PP}  | `false` |
 * | {@linkcode MoveUseType.INDIRECT}   | `true`  |
 * | {@linkcode MoveUseType.FOLLOW_UP}  | `true`  |
 * | {@linkcode MoveUseType.REFLECTED}  | `true`  |
 */
export function isVirtual(useType: MoveUseType): boolean {
  return useType >= MoveUseType.INDIRECT
}

/**
 * Check if a given {@linkcode MoveUseType} should ignore pre-move cancellation checks.
 * @param useType - The {@linkcode MoveUseType} to check.
 * @returns Whether {@linkcode useType} should ignore status checks.
 * @remarks
 * This function is equivalent to the following truth table:
 *
 * | Use Type                           | Returns |
 * |------------------------------------|---------|
 * | {@linkcode MoveUseType.NORMAL}     | `false` |
 * | {@linkcode MoveUseType.IGNORE_PP}  | `false` |
 * | {@linkcode MoveUseType.INDIRECT}   | `false` |
 * | {@linkcode MoveUseType.FOLLOW_UP}  | `true`  |
 * | {@linkcode MoveUseType.REFLECTED}  | `true`  |
 */
export function isIgnoreStatus(useType: MoveUseType): boolean {
  return useType >= MoveUseType.FOLLOW_UP;
}

/**
 * Check if a given {@linkcode MoveUseType} should ignore PP.
 * PP-ignoring moves will ignore normal PP consumption as well as associated failure checks.
 * @param useType - The {@linkcode MoveUseType} to check.
 * @returns Whether {@linkcode useType} ignores PP.
 * @remarks
 * This function is equivalent to the following truth table:
 *
 * | Use Type                           | Returns |
 * |------------------------------------|---------|
 * | {@linkcode MoveUseType.NORMAL}     | `false` |
 * | {@linkcode MoveUseType.IGNORE_PP}  | `true`  |
 * | {@linkcode MoveUseType.INDIRECT}   | `true`  |
 * | {@linkcode MoveUseType.FOLLOW_UP}  | `true`  |
 * | {@linkcode MoveUseType.REFLECTED}  | `true`  |
 */
export function isIgnorePP(useType: MoveUseType): boolean {
  return useType >= MoveUseType.IGNORE_PP;
}

/**
 * Check if a given {@linkcode MoveUseType} is reflected.
 * Reflected moves cannot be reflected, copied, or cancelled by status effects,
 * nor will they trigger {@linkcode PostDancingMoveAbAttr | Dancer}.
 * @param useType - The {@linkcode MoveUseType} to check.
 * @returns Whether {@linkcode useType} is reflected.
 * @remarks
 * This function is equivalent to the following truth table:
 *
 * | Use Type                           | Returns |
 * |------------------------------------|---------|
 * | {@linkcode MoveUseType.NORMAL}     | `false` |
 * | {@linkcode MoveUseType.IGNORE_PP}  | `false` |
 * | {@linkcode MoveUseType.INDIRECT}   | `false` |
 * | {@linkcode MoveUseType.FOLLOW_UP}  | `false` |
 * | {@linkcode MoveUseType.REFLECTED}  | `true`  |
 */
export function isReflected(useType: MoveUseType): boolean {
  return useType === MoveUseType.REFLECTED;
}
