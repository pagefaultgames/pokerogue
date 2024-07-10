import { MysteryEncounterTier } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT } from "#app/data/mystery-encounters/mystery-encounters";
import { isNullOrUndefined } from "#app/utils";

export class MysteryEncounterData {
  encounteredEvents: [MysteryEncounterType, MysteryEncounterTier][] = [];
  encounterSpawnChance: number = BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT;
  nextEncounterQueue: [MysteryEncounterType, integer][] = [];

  constructor(flags: MysteryEncounterData) {
    if (!isNullOrUndefined(flags)) {
      Object.assign(this, flags);
    }
  }
}
