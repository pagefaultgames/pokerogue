import type { ObjectValues } from "#types/type-helpers";

/**
 * Enum representing all the possible means through which a given move can be executed.
 * Each one inherits the properties (or exclusions) of all types preceding it.
 * Properties newly found on a given use mode will be **bolded**,
 * while oddities breaking a previous trend will be listed in _italics_.

 * Callers should refrain from performing non-equality checks on `MoveUseMode`s directly,
 * instead using the available helper functions
 * ({@linkcode isVirtual}, {@linkcode isIgnoreStatus}, {@linkcode isIgnorePP} and {@linkcode isReflected}).
 */
export const MoveUseMode = {
  /**
   * This move was used normally (i.e. clicking on the button) or called via Instruct.
   * It deducts PP from the user's moveset (failing if out of PP), and interacts normally with other moves and abilities.
   */
  NORMAL: 1,

  /**
   * This move was called by an effect that ignores PP, such as a consecutively executed move (e.g. Outrage).
   *
   * PP-ignoring moves (as their name implies) **do not consume PP** when used
   * and **will not fail** if none is left prior to execution.
   * All other effects remain identical to {@linkcode MoveUseMode.NORMAL}.
   *
   * PP can still be reduced by other effects (such as Spite or Eerie Spell).
   */
  IGNORE_PP: 2,

  /**
   * This move was called indirectly by an out-of-turn effect other than Instruct or the user's previous move.
   * Currently only used by {@linkcode PostDancingMoveAbAttr | Dancer}.
   *
   * Indirect moves ignore PP checks similar to {@linkcode MoveUseMode.IGNORE_PP}, but additionally **cannot be copied**
   * by all move-copying effects (barring reflection).
   * They are also **"skipped over" by most moveset and move history-related effects** (PP reduction, Last Resort, etc).
   *
   * They still respect the user's volatile status conditions and confusion (though will uniquely _cure freeze and sleep before use_).
   */
  INDIRECT: 3,

  /**
    * This move was called as part of another move's effect (such as for most {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_call_other_moves | Move-calling moves}).

    * Follow-up moves **bypass cancellation** from all **non-volatile status conditions** and **{@linkcode BattlerTagLapseType.MOVE}-type effects**
    * (having been checked already on the calling move).

    * They are _not ignored_ by other move-calling moves and abilities (unlike {@linkcode MoveUseMode.FOLLOW_UP} and {@linkcode MoveUseMode.REFLECTED}),
    * but still inherit the former's disregard for moveset-related effects.
    */
  FOLLOW_UP: 4,

  /**
   * This move was reflected by Magic Coat or Magic Bounce.

   * Reflected moves ignore all the same cancellation checks as {@linkcode MoveUseMode.INDIRECT}
   * and retain the same copy prevention as {@linkcode MoveUseMode.FOLLOW_UP}, but additionally
   * **cannot be reflected by other reflecting effects**.
   */
  REFLECTED: 5,
  /**
   * This "move" was created by a transparent effect that **does not count as using a move**,
   * such as {@linkcode DelayedAttackAttr | Future Sight/Doom Desire}.
   *
   * In addition to inheriting the cancellation ignores and copy prevention from {@linkcode MoveUseMode.REFLECTED},
   * transparent moves are ignored by **all forms of move usage checks** due to **not pushing to move history**.
   * @todo Consider other means of implementing FS/DD than this - we currently only use it
   * to prevent pushing to move history and avoid re-delaying the attack portion
   */
  DELAYED_ATTACK: 6,
} as const;

export type MoveUseMode = ObjectValues<typeof MoveUseMode>;

// # HELPER FUNCTIONS
// Please update the markdown tables if any new `MoveUseMode`s get added.

/**
 * Check if a given {@linkcode MoveUseMode} is virtual (i.e. called by another move or effect).
 * Virtual moves are ignored by most moveset-related effects due to not being executed directly.
 * @returns Whether {@linkcode useMode} is virtual.
 * @remarks
 * This function is equivalent to the following truth table:
 *
 * | Use Type                               | Returns |
 * |----------------------------------------|---------|
 * | {@linkcode MoveUseMode.NORMAL}         | `false` |
 * | {@linkcode MoveUseMode.IGNORE_PP}      | `false` |
 * | {@linkcode MoveUseMode.INDIRECT}       | `true`  |
 * | {@linkcode MoveUseMode.FOLLOW_UP}      | `true`  |
 * | {@linkcode MoveUseMode.REFLECTED}      | `true`  |
 * | {@linkcode MoveUseMode.DELAYED_ATTACK} | `true`  |
 */
export function isVirtual(useMode: MoveUseMode): boolean {
  return useMode >= MoveUseMode.INDIRECT;
}

/**
 * Check if a given {@linkcode MoveUseMode} should ignore pre-move cancellation checks
 * from {@linkcode StatusEffect.PARALYSIS} and {@linkcode BattlerTagLapseType.MOVE}-type effects.
 * @param useMode - The {@linkcode MoveUseMode} to check.
 * @returns Whether {@linkcode useMode} should ignore status and otehr cancellation checks.
 * @remarks
 * This function is equivalent to the following truth table:
 *
 * | Use Type                               | Returns |
 * |----------------------------------------|---------|
 * | {@linkcode MoveUseMode.NORMAL}         | `false` |
 * | {@linkcode MoveUseMode.IGNORE_PP}      | `false` |
 * | {@linkcode MoveUseMode.INDIRECT}       | `false` |
 * | {@linkcode MoveUseMode.FOLLOW_UP}      | `true`  |
 * | {@linkcode MoveUseMode.REFLECTED}      | `true`  |
 * | {@linkcode MoveUseMode.DELAYED_ATTACK} | `true`  |
 */
export function isIgnoreStatus(useMode: MoveUseMode): boolean {
  return useMode >= MoveUseMode.FOLLOW_UP;
}

/**
 * Check if a given {@linkcode MoveUseMode} should ignore PP.
 * PP-ignoring moves will ignore normal PP consumption as well as associated failure checks.
 * @param useMode - The {@linkcode MoveUseMode} to check.
 * @returns Whether {@linkcode useMode} ignores PP.
 * @remarks
 * This function is equivalent to the following truth table:
 *
 * | Use Type                               | Returns |
 * |----------------------------------------|---------|
 * | {@linkcode MoveUseMode.NORMAL}         | `false` |
 * | {@linkcode MoveUseMode.IGNORE_PP}      | `true`  |
 * | {@linkcode MoveUseMode.INDIRECT}       | `true`  |
 * | {@linkcode MoveUseMode.FOLLOW_UP}      | `true`  |
 * | {@linkcode MoveUseMode.REFLECTED}      | `true`  |
 * | {@linkcode MoveUseMode.DELAYED_ATTACK} | `true`  |
 */
export function isIgnorePP(useMode: MoveUseMode): boolean {
  return useMode >= MoveUseMode.IGNORE_PP;
}

/**
 * Check if a given {@linkcode MoveUseMode} is reflected.
 * Reflected moves cannot be reflected, copied, or cancelled by status effects,
 * nor will they trigger {@linkcode PostDancingMoveAbAttr | Dancer}.
 * @param useMode - The {@linkcode MoveUseMode} to check.
 * @returns Whether {@linkcode useMode} is reflected.
 * @remarks
 * This function is equivalent to the following truth table:
 *
 * | Use Type                               | Returns |
 * |----------------------------------------|---------|
 * | {@linkcode MoveUseMode.NORMAL}         | `false` |
 * | {@linkcode MoveUseMode.IGNORE_PP}      | `false` |
 * | {@linkcode MoveUseMode.INDIRECT}       | `false` |
 * | {@linkcode MoveUseMode.FOLLOW_UP}      | `false` |
 * | {@linkcode MoveUseMode.REFLECTED}      | `true`  |
 * | {@linkcode MoveUseMode.DELAYED_ATTACK} | `false` |
 */
export function isReflected(useMode: MoveUseMode): boolean {
  return useMode === MoveUseMode.REFLECTED;
}
