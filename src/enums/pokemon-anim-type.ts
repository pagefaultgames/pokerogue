export enum PokemonAnimType {
  /**
   * Adds a Substitute doll to the field in front of a Pokemon.
   * The Pokemon then moves "out of focus" and becomes semi-transparent.
   */
  SUBSTITUTE_ADD,
  /** Brings a Pokemon with a Substitute "into focus" before using a move. */
  SUBSTITUTE_PRE_MOVE,
  /** Brings a Pokemon with a Substitute "out of focus" after using a move. */
  SUBSTITUTE_POST_MOVE,
  /**
   * Removes a Pokemon's Substitute doll from the field.
   * The Pokemon then moves back to its original position.
   */
  SUBSTITUTE_REMOVE,
  /**
   * Brings Tatsugiri and Dondozo to the center of the field, with
   * Tatsugiri jumping into the Dondozo's mouth
   */
  COMMANDER_APPLY,
  /**
   * Dondozo "spits out" Tatsugiri, moving Tatsugiri back to its original
   * field position.
   */
  COMMANDER_REMOVE,
}
