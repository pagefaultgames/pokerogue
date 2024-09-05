import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT } from "#app/data/mystery-encounters/mystery-encounters";
import { isNullOrUndefined } from "#app/utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";

export class SeenEncounterData {
  type: MysteryEncounterType;
  tier: MysteryEncounterTier;
  waveIndex: number;

  constructor(type: MysteryEncounterType, tier: MysteryEncounterTier, waveIndex: number) {
    this.type = type;
    this.tier = tier;
    this.waveIndex = waveIndex;
  }
}

export class MysteryEncounterData {
  encounteredEvents: SeenEncounterData[] = [];
  encounterSpawnChance: number = BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT;
  nextEncounterQueue: [MysteryEncounterType, integer][] = [];

  constructor(flags: MysteryEncounterData | null) {
    if (!isNullOrUndefined(flags)) {
      Object.assign(this, flags);
    }
  }
}
