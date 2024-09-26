/**
 * Indicates the type of switch functionality that a {@linkcode SwitchPhase}
 * or {@linkcode SwitchSummonPhase} will carry out.
 */
export enum SwitchType {
  /** Basic switchout where the Pokemon to switch in is selected */
  SWITCH,
  /** Transfers stat stages and other effects from the returning Pokemon to the switched in Pokemon */
  BATON_PASS,
  /** Transfers the returning Pokemon's Substitute to the switched in Pokemon */
  SHED_TAIL
}
