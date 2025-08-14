export enum MysteryEncounterMode {
  /** {@linkcode MysteryEncounter} will always begin in this mode, but will always swap modes when an option is selected */
  DEFAULT,
  /** If the {@linkcode MysteryEncounter} battle is a trainer type battle */
  TRAINER_BATTLE,
  /** If the {@linkcode MysteryEncounter} battle is a wild type battle */
  WILD_BATTLE,
  /** Enables special boss music during encounter */
  BOSS_BATTLE,
  /** If there is no battle in the {@linkcode MysteryEncounter} or option selected */
  NO_BATTLE,
}
