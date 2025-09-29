import type { MoveUseMode } from "#enums/move-use-mode";

/**
 * Enum representing the possible ways a given BattlerTag can activate and/or tick down.
 * Each tag can have multiple different behaviors attached to different lapse types.
 */
export enum BattlerTagLapseType {
  // TODO: This is unused...
  FAINT,
  /**
   * Tag activates before the holder uses a non-virtual move,
   * after passing the first failure check sequence during the move phase.
   * @see MoveUseMode for more information
   */
  MOVE,
  /**
   * Tag activates during (or just after) the first failure check sequence in the move phase
   *
   * @remarks
   *
   * Note tags with this lapse type will lapse immediately after the first failure check sequence,
   * regardless of whether the move was successful or not, but is skipped if the move is a
   * {@linkcode MoveUseMode.FOLLOW_UP | follow-up} move.
   *
   * To only lapse the tag between the first and second failure check sequences, use
   * {@linkcode BattlerTagLapseType.MOVE} instead.
   */
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
  /**
   * The tag has some other custom activation or removal condition.
   * @remarks
   * Tags can use this lapse type to prevent them from automatically lapsing during automatic lapse instances,
   * such as before a move is used or at the end of a turn.
   * Such tags will only trigger upon being specifically lapsed with the tag and lapse type via
   * {@linkcode Pokemon.lapseTag}.
   */
  CUSTOM,
}

/** Same type as {@linkcode BattlerTagLapseType}, but excludes the {@linkcode BattlerTagLapseType.CUSTOM} type */
export type NonCustomBattlerTagLapseType = Exclude<BattlerTagLapseType, BattlerTagLapseType.CUSTOM>;
