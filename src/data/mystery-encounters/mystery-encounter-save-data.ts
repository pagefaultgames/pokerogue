import { BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT } from "#app/constants";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { isNullOrUndefined } from "#utils/common";

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

  constructor(data?: MysteryEncounterSaveData) {
    if (!isNullOrUndefined(data)) {
      Object.assign(this, data);
    }

    this.encounteredEvents = this.encounteredEvents ?? [];
    this.queuedEncounters = this.queuedEncounters ?? [];
  }
}
