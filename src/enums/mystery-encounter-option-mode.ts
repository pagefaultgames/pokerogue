export enum MysteryEncounterOptionMode {
  /** Default style */
  DEFAULT,
  /** Disabled on requirements not met, default style on requirements met */
  DISABLED_OR_DEFAULT,
  /** Default style on requirements not met, special style on requirements met */
  DEFAULT_OR_SPECIAL,
  /** Disabled on requirements not met, special style on requirements met */
  DISABLED_OR_SPECIAL,
}
