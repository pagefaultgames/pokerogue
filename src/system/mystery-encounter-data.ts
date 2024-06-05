import MysteryEncounter from "../data/mystery-encounter";

/**
 * Wrapper class used for saving session ME data on current floor
 */
export class MysteryEncounterData {
  encounter: MysteryEncounter;

  constructor(encounter: MysteryEncounter) {
    this.encounter = encounter;
  }
}
