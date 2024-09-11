export enum MysteryEncounterMode {
  /** MysteryEncounter will always begin in this mode, but will always swap modes when an option is selected */
  DEFAULT,
  /** If the MysteryEncounter battle is a trainer type battle */
  TRAINER_BATTLE,
  /** If the MysteryEncounter battle is a wild type battle */
  WILD_BATTLE,
  /** Enables special boss music during encounter */
  BOSS_BATTLE,
  /** If there is no battle in the MysteryEncounter or option selected */
  NO_BATTLE
}
