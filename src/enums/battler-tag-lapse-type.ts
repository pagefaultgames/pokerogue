
export enum BattlerTagLapseType {
  FAINT,
  MOVE,
  PRE_MOVE,
  AFTER_MOVE,
  MOVE_EFFECT,
  TURN_END,
  HIT,
  /** Tag lapses AFTER_HIT, applying its effects even if the user faints */
  AFTER_HIT,
  CUSTOM
}
