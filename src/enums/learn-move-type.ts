export enum LearnMoveType {
  /** For learning a move via level-up, evolution, or other non-item-based event */
  LEARN_MOVE,
  /** For learning a move via Memory Mushroom */
  MEMORY,
  /** For learning a move via TM */
  TM,
  /** For automatically replacing a move upon form change */
  FORM_CHANGE,
}
