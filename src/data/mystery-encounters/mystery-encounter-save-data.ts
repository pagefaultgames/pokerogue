import { ME_BASE_SPAWN_WEIGHT } from "#constants/mystery-encounter-constants";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";

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
  encounterSpawnChance: number = ME_BASE_SPAWN_WEIGHT;
  queuedEncounters: QueuedEncounter[] = [];

  constructor(data?: MysteryEncounterSaveData) {
    if (data != null) {
      Object.assign(this, data);
    }

    this.encounteredEvents = this.encounteredEvents ?? [];
    this.queuedEncounters = this.queuedEncounters ?? [];
  }
}
