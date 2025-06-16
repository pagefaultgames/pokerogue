/**
 * Enum representing the possible ways a given BattlerTag can activate and/or tick down.
 * Each tag can have multiple different behaviors attached to different lapse types.
 */
export enum BattlerTagLapseType {
  // TODO: This is unused...
  FAINT,
  /**
   * Tag activate before the holder uses a non-virtual move, possibly interrupting its action.
   * @see MoveUseMode for more information
   */
  MOVE,
  /** Tag activates before the holder uses **any** move, triggering effects or interrupting its action. */
  PRE_MOVE,
  /** Tag activates immediately after the holder's move finishes triggering (successful or not). */
  AFTER_MOVE,
  /**
   * Tag activates before move effects are applied.
   * TODO: Stop using this as a catch-all "semi-invulnerability" tag
   */
  MOVE_EFFECT,
  /** Tag activates at the end of the turn. */
  TURN_END,
  /**
   * Tag activates after the holder is hit by an attack, but before damage is applied.
   * Occurs even if the user's {@linkcode SubstituteTag | Substitute} is hit.
   */
  HIT,
  /**
   * Tag activates after the holder is directly hit by an attack.
   * Does **not** occur on hits to the holder's {@linkcode SubstituteTag | Substitute},
   * but still triggers on being KO'd.
   */
  AFTER_HIT,
  /** The tag has some other custom activation or removal condition. */
  CUSTOM,
}
