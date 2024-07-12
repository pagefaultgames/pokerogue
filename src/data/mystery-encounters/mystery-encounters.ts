import { Biome } from "#enums/biome";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { DarkDealEncounter } from "./encounters/dark-deal-encounter";
import { DepartmentStoreSaleEncounter } from "./encounters/department-store-sale-encounter";
import { FieldTripEncounter } from "./encounters/field-trip-encounter";
import { FightOrFlightEncounter } from "./encounters/fight-or-flight-encounter";
import { LostAtSeaEncounter } from "./encounters/lost-at-sea-encounter";
import { MysteriousChallengersEncounter } from "./encounters/mysterious-challengers-encounter";
import { MysteriousChestEncounter } from "./encounters/mysterious-chest-encounter";
import { ShadyVitaminDealerEncounter } from "./encounters/shady-vitamin-dealer-encounter";
import { SleepingSnorlaxEncounter } from "./encounters/sleeping-snorlax-encounter";
import { TrainingSessionEncounter } from "./encounters/training-session-encounter";
import IMysteryEncounter from "./mystery-encounter";

// Spawn chance: (BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT + WIGHT_INCREMENT_ON_SPAWN_MISS * <number of missed spawns>) / 256
export const BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT = 1;
export const WIGHT_INCREMENT_ON_SPAWN_MISS = 5;
export const AVERAGE_ENCOUNTERS_PER_RUN_TARGET = 15;

export const EXTREME_ENCOUNTER_BIOMES = [
  Biome.SEA,
  Biome.SEABED,
  Biome.BADLANDS,
  Biome.DESERT,
  Biome.ICE_CAVE,
  Biome.VOLCANO,
  Biome.WASTELAND,
  Biome.ABYSS,
  Biome.SPACE,
  Biome.END
];

export const NON_EXTREME_ENCOUNTER_BIOMES = [
  Biome.TOWN,
  Biome.PLAINS,
  Biome.GRASS,
  Biome.TALL_GRASS,
  Biome.METROPOLIS,
  Biome.FOREST,
  Biome.SWAMP,
  Biome.BEACH,
  Biome.LAKE,
  Biome.MOUNTAIN,
  Biome.CAVE,
  Biome.MEADOW,
  Biome.POWER_PLANT,
  Biome.GRAVEYARD,
  Biome.DOJO,
  Biome.FACTORY,
  Biome.RUINS,
  Biome.CONSTRUCTION_SITE,
  Biome.JUNGLE,
  Biome.FAIRY_CAVE,
  Biome.TEMPLE,
  Biome.SLUM,
  Biome.SNOWY_FOREST,
  Biome.ISLAND,
  Biome.LABORATORY
];

/**
 * Places where you could very reasonably expect to encounter a single human
 *
 * Diff from NON_EXTREME_ENCOUNTER_BIOMES:
 * + BADLANDS
 * + DESERT
 * + ICE_CAVE
 */
export const HUMAN_TRANSITABLE_BIOMES = [
  Biome.TOWN,
  Biome.PLAINS,
  Biome.GRASS,
  Biome.TALL_GRASS,
  Biome.METROPOLIS,
  Biome.FOREST,
  Biome.SWAMP,
  Biome.BEACH,
  Biome.LAKE,
  Biome.MOUNTAIN,
  Biome.BADLANDS,
  Biome.CAVE,
  Biome.DESERT,
  Biome.ICE_CAVE,
  Biome.MEADOW,
  Biome.POWER_PLANT,
  Biome.GRAVEYARD,
  Biome.DOJO,
  Biome.FACTORY,
  Biome.RUINS,
  Biome.CONSTRUCTION_SITE,
  Biome.JUNGLE,
  Biome.FAIRY_CAVE,
  Biome.TEMPLE,
  Biome.SLUM,
  Biome.SNOWY_FOREST,
  Biome.ISLAND,
  Biome.LABORATORY
];

/**
 * Places where you could expect a town or city, some form of large civilization
 */
export const CIVILIZATION_ENCOUNTER_BIOMES = [
  Biome.TOWN,
  Biome.PLAINS,
  Biome.GRASS,
  Biome.TALL_GRASS,
  Biome.METROPOLIS,
  Biome.BEACH,
  Biome.LAKE,
  Biome.MEADOW,
  Biome.POWER_PLANT,
  Biome.GRAVEYARD,
  Biome.DOJO,
  Biome.FACTORY,
  Biome.CONSTRUCTION_SITE,
  Biome.SLUM,
  Biome.ISLAND
];

export const allMysteryEncounters: { [encounterType: number]: IMysteryEncounter } = {};


const extremeBiomeEncounters: MysteryEncounterType[] = [];

const nonExtremeBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.FIELD_TRIP
];

const humanTransitableBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.MYSTERIOUS_CHALLENGERS,
  MysteryEncounterType.SHADY_VITAMIN_DEALER
];

const civilizationBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.DEPARTMENT_STORE_SALE
];


/**
 * To add an encounter to every biome possible, use this array
 */
const anyBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.FIGHT_OR_FLIGHT,
  MysteryEncounterType.DARK_DEAL,
  MysteryEncounterType.MYSTERIOUS_CHEST,
  MysteryEncounterType.TRAINING_SESSION
];

/**
 * ENCOUNTER BIOME MAPPING
 * To add an Encounter to a biome group, instead of cluttering the map, use the biome group arrays above
 *
 * Adding specific Encounters to the mysteryEncountersByBiome map is for specific cases and special circumstances
 * that biome groups do not cover
 */
export const mysteryEncountersByBiome = new Map<Biome, MysteryEncounterType[]>([
  [Biome.TOWN, []],
  [Biome.PLAINS, []],
  [Biome.GRASS, [
    MysteryEncounterType.SLEEPING_SNORLAX,
  ]],
  [Biome.TALL_GRASS, []],
  [Biome.METROPOLIS, []],
  [Biome.FOREST, [
    MysteryEncounterType.SLEEPING_SNORLAX
  ]],

  [Biome.SEA, [
    MysteryEncounterType.LOST_AT_SEA
  ]],
  [Biome.SWAMP, []],
  [Biome.BEACH, []],
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
  [Biome.MEADOW, []],
  [Biome.POWER_PLANT, []],
  [Biome.VOLCANO, []],
  [Biome.GRAVEYARD, []],
  [Biome.DOJO, []],
  [Biome.FACTORY, []],
  [Biome.RUINS, []],
  [Biome.WASTELAND, []],
  [Biome.ABYSS, []],
  [Biome.SPACE, []],
  [Biome.CONSTRUCTION_SITE, []],
  [Biome.JUNGLE, []],
  [Biome.FAIRY_CAVE, []],
  [Biome.TEMPLE, []],
  [Biome.SLUM, []],
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
  allMysteryEncounters[MysteryEncounterType.FIELD_TRIP] = FieldTripEncounter;
  allMysteryEncounters[MysteryEncounterType.LOST_AT_SEA] = LostAtSeaEncounter;

  // Add extreme encounters to biome map
  extremeBiomeEncounters.forEach(encounter => {
    EXTREME_ENCOUNTER_BIOMES.forEach(biome => {
      const encountersForBiome = mysteryEncountersByBiome.get(biome);
      if (!encountersForBiome.includes(encounter)) {
        encountersForBiome.push(encounter);
      }
    });
  });
  // Add non-extreme encounters to biome map
  nonExtremeBiomeEncounters.forEach(encounter => {
    NON_EXTREME_ENCOUNTER_BIOMES.forEach(biome => {
      const encountersForBiome = mysteryEncountersByBiome.get(biome);
      if (!encountersForBiome.includes(encounter)) {
        encountersForBiome.push(encounter);
      }
    });
  });
  // Add human encounters to biome map
  humanTransitableBiomeEncounters.forEach(encounter => {
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      const encountersForBiome = mysteryEncountersByBiome.get(biome);
      if (!encountersForBiome.includes(encounter)) {
        encountersForBiome.push(encounter);
      }
    });
  });
  // Add civilization encounters to biome map
  civilizationBiomeEncounters.forEach(encounter => {
    CIVILIZATION_ENCOUNTER_BIOMES.forEach(biome => {
      const encountersForBiome = mysteryEncountersByBiome.get(biome);
      if (!encountersForBiome.includes(encounter)) {
        encountersForBiome.push(encounter);
      }
    });
  });

  // Add ANY biome encounters to biome map
  mysteryEncountersByBiome.forEach(biomeEncounters => {
    anyBiomeEncounters.forEach(encounter => {
      if (!biomeEncounters.includes(encounter)) {
        biomeEncounters.push(encounter);
      }
    });
  });
}
