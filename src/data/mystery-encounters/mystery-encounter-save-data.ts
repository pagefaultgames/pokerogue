import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT } from "#app/data/mystery-encounters/mystery-encounters";
import { isNullOrUndefined } from "#app/utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";

export class SeenEncounterData {
  type: MysteryEncounterType;
  tier: MysteryEncounterTier;
  waveIndex: number;
  selectedOption: number;

  constructor(type: MysteryEncounterType, tier: MysteryEncounterTier, waveIndex: number, selectedOption?: number) {
    this.type = type;
    this.tier = tier;
    this.waveIndex = waveIndex;
    this.selectedOption = selectedOption ?? -1;
  }
}

export interface QueuedEncounter {
  type: MysteryEncounterType;
  spawnPercent: number; // Out of 100
}

export class MysteryEncounterSaveData {
  encounteredEvents: SeenEncounterData[] = [];
  encounterSpawnChance: number = BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT;
  queuedEncounters: QueuedEncounter[] = [];

  constructor(data: MysteryEncounterSaveData | null) {
    if (!isNullOrUndefined(data)) {
      Object.assign(this, data);
    }
  }
}
