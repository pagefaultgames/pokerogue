import MysteryEncounter from "../mystery-encounter";
import {DarkDealEncounter} from "./dark-deal";
import {MysteriousChallengersEncounter} from "./mysterious-challengers";
import {MysteriousChestEncounter} from "./mysterious-chest";
import {FightOrFlightEncounter} from "#app/data/mystery-encounters/fight-or-flight";
import {TrainingSessionEncounter} from "#app/data/mystery-encounters/training-session";
import { Biome } from "#app/enums/biome";
import { SleepingSnorlaxEncounter } from "./sleeping-snorlax";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";

// Spawn chance: (BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT + WIGHT_INCREMENT_ON_SPAWN_MISS * <number of missed spawns>) / 256
export const BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT = 1;
export const WIGHT_INCREMENT_ON_SPAWN_MISS = 5;
export const AVERAGE_ENCOUNTERS_PER_RUN_TARGET = 15;

export const allMysteryEncounters : {[encounterType:string]: MysteryEncounter} = {};

// Add MysteryEncounterType to biomes to enable it exclusively for those biomes
// To enable an encounter in all biomes, do not add to this map
export const mysteryEncountersByBiome = new Map<Biome, MysteryEncounterType[]>([
  [Biome.TOWN, [
  ]],
  [Biome.PLAINS,[

  ]],
  [Biome.GRASS, [
    MysteryEncounterType.SLEEPING_SNORLAX
  ]],
  [Biome.TALL_GRASS, [

  ]],
  [Biome.METROPOLIS, [

  ]],
  [Biome.FOREST, [
    MysteryEncounterType.SLEEPING_SNORLAX
  ]],

  [Biome.SEA, [

  ]],
  [Biome.SWAMP, [

  ]],
  [Biome.BEACH, [

  ]],
  [Biome.LAKE, [

  ]],
  [Biome.SEABED, [

  ]],
  [Biome.MOUNTAIN, [
    MysteryEncounterType.SLEEPING_SNORLAX
  ]],
  [Biome.BADLANDS, [

  ]],
  [Biome.CAVE, [
    MysteryEncounterType.SLEEPING_SNORLAX
  ]],
  [Biome.DESERT, [

  ]],
  [Biome.ICE_CAVE, [

  ]],
  [Biome.MEADOW, [

  ]],
  [Biome.POWER_PLANT, [

  ]],
  [Biome.VOLCANO, [

  ]],
  [Biome.GRAVEYARD, [

  ]],
  [Biome.DOJO, [

  ]],
  [Biome.FACTORY, [

  ]],
  [Biome.RUINS, [

  ]],
  [Biome.WASTELAND, [

  ]],
  [Biome.ABYSS, [

  ]],
  [Biome.SPACE, [

  ]],
  [Biome.CONSTRUCTION_SITE, [

  ]],
  [Biome.JUNGLE, [

  ]],
  [Biome.FAIRY_CAVE, [

  ]],
  [Biome.TEMPLE, [

  ]],
  [Biome.SLUM, [

  ]],
  [Biome.SNOWY_FOREST, [

  ]],
  [Biome.ISLAND, [

  ]],
  [Biome.LABORATORY, [

  ]]
]);

// Only add your MysterEncounter here if you want it to be in every biome.
// We recommend designing biome-specific encounters for better flavor and variance
export function initMysteryEncounters() {
  allMysteryEncounters[MysteryEncounterType.MYSTERIOUS_CHALLENGERS] = MysteriousChallengersEncounter;
  allMysteryEncounters[MysteryEncounterType.MYSTERIOUS_CHEST] = MysteriousChestEncounter;
  allMysteryEncounters[MysteryEncounterType.DARK_DEAL] =  DarkDealEncounter;
  allMysteryEncounters[MysteryEncounterType.FIGHT_OR_FLIGHT] = FightOrFlightEncounter;
  allMysteryEncounters[MysteryEncounterType.TRAINING_SESSION] = TrainingSessionEncounter;
  allMysteryEncounters[MysteryEncounterType.SLEEPING_SNORLAX] = SleepingSnorlaxEncounter;

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
