import * as Utils from "../utils";
import {MysteryEncounterTier} from "#app/data/mystery-encounter";
import {MysteryEncounterType} from "#enums/mystery-encounter-type";
import {BASE_MYSTYERY_ENCOUNTER_WEIGHT} from "#app/data/mystery-encounters/mystery-encounters";

export class MysteryEncounterFlags {
  encounteredEvents: [MysteryEncounterType, MysteryEncounterTier][] = [];
  encounterSpawnChance: number = BASE_MYSTYERY_ENCOUNTER_WEIGHT;
  nextEncounterQueue: [MysteryEncounterType, integer][] = [];

  constructor(flags: MysteryEncounterFlags) {
    if (!Utils.isNullOrUndefined(flags)) {
      Object.assign(this, flags);
    }
  }
}
