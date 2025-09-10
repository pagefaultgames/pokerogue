/** Enum for party experience gain notification style. */
export enum ExpNotification {
  /** Display amount flyout for all off-field party members upon gaining any amount of EXP. */
  DEFAULT,
  /** Display smaller flyout showing level gained on gaining a new level. */
  ONLY_LEVEL_UP,
  /** Do not show any flyouts for EXP gains or levelups. */
  SKIP,
}
