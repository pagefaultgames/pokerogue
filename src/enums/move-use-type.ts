  /**
  * Enum representing all the possible ways a given move can be executed.
  * Each one inherits the properties (or exclusions) of the types preceding it, unless specified in _italics_.
  * Properties unique to each use type will be **bolded**.
  */
  export enum MoveUseType {
    /**
    * This move was used normally (ie clicking on the button) or called via Instruct.
    * It deducts PP from the user's moveset (failing if out of PP), and can be copied by other moves and abilities.
    */
    NORMAL,
    /**
    * Identical to {@linkcode MoveUseType.NORMAL}, except the move **does not consume PP** and **will not fail** if none is left.
    */
    IGNORE_PP,
    /**
    * This move was called as part of another move's effect (such as for most {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_call_other_moves | Move-calling moves}).

    * Follow-up moves **bypass cancellation** from all **non-volatile status conditions** and **`BattlerTagLapseType.MOVE`-type effects**.
    * They are _NOT ignored by other move-calling moves and abilities_ (unlike {@linkcode MoveUseType.INDIRECT}), and will
    * **not reduce sleep duration**.
    */
    FOLLOW_UP,
    /**
    * This move was called indirectly by another effect that wasn't Instruct or the user's previous move.
    * Currently only used for Dancer.

    * Indirect moves ignore PP checks similar to {@linkcode MoveUseType.IGNORE_PP}, but additionally **cannot be copied**
    * by other move-copying effects (excluding reflection).
    * They _still respect the user's volatile status conditions and confusion_ (though still without reducing sleep duration).
    */
    INDIRECT,

    /**
    * This move was reflected by Magic Coat or Magic Bounce.

    * Reflected moves ignore all the same cancellation checks as {@linkcode MoveUseType.FOLLOW_UP}
    * and retain the same copy prevention as {@linkcode MoveUseType.INDIRECT}, but additionally
    * **cannot be reflected by other reflecting effects**.
    */
    REFLECTED
  }
