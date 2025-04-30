  /**
  * Enum representing all the possible ways a given move can be executed.
  * Each one inherits the properties (or exclusions) of the types preceding it.
  * Properties newly found on a given use type will be **bolded**,
  * while oddities breaking a previous trend will be listed in _italics_.
  */
  export enum MoveUseType {
    /**
    * This move was used normally (i.e. clicking on the button) or called via Instruct.
    * It deducts PP from the user's moveset (failing if out of PP), and interacts normally with other moves and abilities.
    */
    NORMAL,

    /**
    * Identical to {@linkcode MoveUseType.NORMAL}, except the move **does not consume PP**
    * and **will not fail** if none is left before its execution.
    * PP can still be consumed by other effects (such as Spite or Eerie Spell), and all other move aspects behave normally.
    */
    IGNORE_PP,

    /**
    * This move was called indirectly by another effect that wasn't Instruct or the user's previous move.
    * Currently only used for Dancer.

    * Indirect moves ignore PP checks similar to {@linkcode MoveUseType.IGNORE_PP}, but additionally **cannot be copied**
    * by other move-copying effects (barring reflection).
    * Most **effects that rely on a target's moveset** (PP reduction, Last Resort, etc.) will likewise fail.

    * They still respect the user's volatile status conditions and confusion (though will uniquely _cure freeze and sleep before use_).
    */
    INDIRECT,

    /**
     * This move was called as part of another move's effect (such as for most {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_call_other_moves | Move-calling moves}).

     * Follow-up moves **bypass cancellation** from all **non-volatile status conditions** and **`BattlerTagLapseType.MOVE`-type effects**
     * (having been checked already on the calling move).

     * They are _not ignored_ by other move-calling moves and abilities (unlike {@linkcode MoveUseType.FOLLOW_UP}),
     * but still inherit the former's disregard for most moveset-related effects.
     */
    FOLLOW_UP,

    /**
     * This move was reflected by Magic Coat or Magic Bounce.

     * Reflected moves ignore all the same cancellation checks as {@linkcode MoveUseType.INDIRECT}
     * and retain the same copy prevention as {@linkcode MoveUseType.FOLLOW_UP}, but additionally
     * **cannot be reflected by other reflecting effects**.
     */
    REFLECTED
  }
