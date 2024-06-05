import { MysteryEncounterFlags } from "../data/mystery-encounter-flags";

/**
 * Wrapper class used for saving session ME flags data
 */
export class MysteryEncounterFlagData {
  encounterFlags: MysteryEncounterFlags;

  constructor(encounterFlags: MysteryEncounterFlags) {
    this.encounterFlags = encounterFlags;
  }
}
