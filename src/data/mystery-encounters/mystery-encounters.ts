import MysteryEncounter from "./mystery-encounter";
import { DarkDealEncounter } from "./encounters/dark-deal";
import { MysteriousChallengersEncounter } from "./encounters/mysterious-challengers";
import { MysteriousChestEncounter } from "./encounters/mysterious-chest";
import { FightOrFlightEncounter } from "#app/data/mystery-encounters/encounters/fight-or-flight";
import { TrainingSessionEncounter } from "#app/data/mystery-encounters/encounters/training-session";
import { Biome } from "#enums/biome";
import { SleepingSnorlaxEncounter } from "./encounters/sleeping-snorlax";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { DepartmentStoreSaleEncounter } from "#app/data/mystery-encounters/encounters/department-store-sale";
import { ShadyVitaminDealerEncounter } from "#app/data/mystery-encounters/encounters/shady-vitamin-dealer";
import { GettingLostAtTheSeaEncounter } from "./encounters/getting-lost-at-the-sea-encounter";

// Spawn chance: (BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT + WIGHT_INCREMENT_ON_SPAWN_MISS * <number of missed spawns>) / 256
export const BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT = 1;
export const WIGHT_INCREMENT_ON_SPAWN_MISS = 5;
export const AVERAGE_ENCOUNTERS_PER_RUN_TARGET = 15;

export const allMysteryEncounters: { [encounterType: number]: MysteryEncounter } = {};

// Add MysteryEncounterType to biomes to enable it exclusively for those biomes
// To enable an encounter in all biomes, do not add to this map
export const mysteryEncountersByBiome = new Map<Biome, MysteryEncounterType[]>([
  [Biome.TOWN, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.PLAINS, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.GRASS, [
    MysteryEncounterType.SLEEPING_SNORLAX,
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.TALL_GRASS, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.METROPOLIS, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.FOREST, [
    MysteryEncounterType.SLEEPING_SNORLAX
  ]],

  [Biome.SEA, [
    MysteryEncounterType.GETTING_LOST_AT_THE_SEA
  ]],
  [Biome.SWAMP, []],
  [Biome.BEACH, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.LAKE, []],
  [Biome.SEABED, []],
  [Biome.MOUNTAIN, [
    MysteryEncounterType.SLEEPING_SNORLAX
  ]],
  [Biome.BADLANDS, []],
  [Biome.CAVE, [
    MysteryEncounterType.SLEEPING_SNORLAX
  ]],
  [Biome.DESERT, []],
  [Biome.ICE_CAVE, []],
  [Biome.MEADOW, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.POWER_PLANT, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.VOLCANO, []],
  [Biome.GRAVEYARD, []],
  [Biome.DOJO, []],
  [Biome.FACTORY, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.RUINS, []],
  [Biome.WASTELAND, []],
  [Biome.ABYSS, []],
  [Biome.SPACE, []],
  [Biome.CONSTRUCTION_SITE, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.JUNGLE, []],
  [Biome.FAIRY_CAVE, []],
  [Biome.TEMPLE, []],
  [Biome.SLUM, [
    MysteryEncounterType.DEPARTMENT_STORE_SALE
  ]],
  [Biome.SNOWY_FOREST, []],
  [Biome.ISLAND, []],
  [Biome.LABORATORY, []]
]);

export function initMysteryEncounters() {
  allMysteryEncounters[MysteryEncounterType.MYSTERIOUS_CHALLENGERS] = MysteriousChallengersEncounter;
  allMysteryEncounters[MysteryEncounterType.MYSTERIOUS_CHEST] = MysteriousChestEncounter;
  allMysteryEncounters[MysteryEncounterType.DARK_DEAL] = DarkDealEncounter;
  allMysteryEncounters[MysteryEncounterType.FIGHT_OR_FLIGHT] = FightOrFlightEncounter;
  allMysteryEncounters[MysteryEncounterType.TRAINING_SESSION] = TrainingSessionEncounter;
  allMysteryEncounters[MysteryEncounterType.SLEEPING_SNORLAX] = SleepingSnorlaxEncounter;
  allMysteryEncounters[MysteryEncounterType.DEPARTMENT_STORE_SALE] = DepartmentStoreSaleEncounter;
  allMysteryEncounters[MysteryEncounterType.SHADY_VITAMIN_DEALER] = ShadyVitaminDealerEncounter;
  allMysteryEncounters[MysteryEncounterType.GETTING_LOST_AT_THE_SEA] = GettingLostAtTheSeaEncounter;

  // Append encounters that can occur in any biome to biome map
  const anyBiomeEncounters: MysteryEncounterType[] = Object.keys(MysteryEncounterType).filter(e => !isNaN(Number(e))).map(k => Number(k) as MysteryEncounterType);
  mysteryEncountersByBiome.forEach(biomeEncounters => {
    biomeEncounters.forEach(e => {
      if (anyBiomeEncounters.includes(e)) {
        anyBiomeEncounters.splice(anyBiomeEncounters.indexOf(e), 1);
      }
    });
  });

  mysteryEncountersByBiome.forEach(biomeEncounters => biomeEncounters.push(...anyBiomeEncounters));
}
