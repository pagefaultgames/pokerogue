/**
 * Indicates the type of switch functionality that a {@linkcode SwitchPhase}
 * or {@linkcode SwitchSummonPhase} will carry out.
 */
export enum SwitchType {
  /** Basic switchout where the Pokemon to switch in is selected */
  SWITCH,
  /** Basic switchout where the Pokemon to switch in is selected
   * 
   * This type is called outside of CommandPhase, and needs its own separate action log
   */
  MID_TURN_SWITCH,
  /** Transfers stat stages and other effects from the returning Pokemon to the switched in Pokemon */
  BATON_PASS,
  /** Transfers stat stages and other effects from the returning Pokemon to the switched in Pokemon
   * 
   * This type is called outside of CommandPhase, and needs its own separate action log
   */
  MID_TURN_BATON_PASS,
  /** Transfers the returning Pokemon's Substitute to the switched in Pokemon
   * 
   * This type is called outside of CommandPhase, and needs its own separate action log
  */
  SHED_TAIL,
  /** Basic switchout, but occurring outside of battle */
  PRE_SWITCH,
  /** Basic switchout, but occurring outside of battle */
  PRE_BATON_PASS,
}
