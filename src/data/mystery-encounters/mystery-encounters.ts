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
import { SlumberingSnorlaxEncounter } from "./encounters/slumbering-snorlax-encounter";
import { TrainingSessionEncounter } from "./encounters/training-session-encounter";
import MysteryEncounter from "./mystery-encounter";
import { SafariZoneEncounter } from "#app/data/mystery-encounters/encounters/safari-zone-encounter";
import { FieryFalloutEncounter } from "#app/data/mystery-encounters/encounters/fiery-fallout-encounter";
import { TheStrongStuffEncounter } from "#app/data/mystery-encounters/encounters/the-strong-stuff-encounter";
import { ThePokemonSalesmanEncounter } from "#app/data/mystery-encounters/encounters/the-pokemon-salesman-encounter";
import { AnOfferYouCantRefuseEncounter } from "#app/data/mystery-encounters/encounters/an-offer-you-cant-refuse-encounter";
import { DelibirdyEncounter } from "#app/data/mystery-encounters/encounters/delibirdy-encounter";
import { AbsoluteAvariceEncounter } from "#app/data/mystery-encounters/encounters/absolute-avarice-encounter";
import { ATrainersTestEncounter } from "#app/data/mystery-encounters/encounters/a-trainers-test-encounter";
import { TrashToTreasureEncounter } from "#app/data/mystery-encounters/encounters/trash-to-treasure-encounter";
import { BerriesAboundEncounter } from "#app/data/mystery-encounters/encounters/berries-abound-encounter";
import { ClowningAroundEncounter } from "#app/data/mystery-encounters/encounters/clowning-around-encounter";
import { PartTimerEncounter } from "#app/data/mystery-encounters/encounters/part-timer-encounter";
import { DancingLessonsEncounter } from "#app/data/mystery-encounters/encounters/dancing-lessons-encounter";
import { WeirdDreamEncounter } from "#app/data/mystery-encounters/encounters/weird-dream-encounter";
import { TheWinstrateChallengeEncounter } from "#app/data/mystery-encounters/encounters/the-winstrate-challenge-encounter";
import { TeleportingHijinksEncounter } from "#app/data/mystery-encounters/encounters/teleporting-hijinks-encounter";
import { BugTypeSuperfanEncounter } from "#app/data/mystery-encounters/encounters/bug-type-superfan-encounter";
import { FunAndGamesEncounter } from "#app/data/mystery-encounters/encounters/fun-and-games-encounter";
import { UncommonBreedEncounter } from "#app/data/mystery-encounters/encounters/uncommon-breed-encounter";
import { GlobalTradeSystemEncounter } from "#app/data/mystery-encounters/encounters/global-trade-system-encounter";

// Spawn chance: (BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT + WIGHT_INCREMENT_ON_SPAWN_MISS * <number of missed spawns>) / 256
export const BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT = 1;
export const WEIGHT_INCREMENT_ON_SPAWN_MISS = 5;
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

export const allMysteryEncounters: { [encounterType: number]: MysteryEncounter } = {};


const extremeBiomeEncounters: MysteryEncounterType[] = [];

const nonExtremeBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.FIELD_TRIP,
  MysteryEncounterType.DANCING_LESSONS, // Is also in BADLANDS, DESERT, VOLCANO, WASTELAND, ABYSS
];

const humanTransitableBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.MYSTERIOUS_CHALLENGERS,
  MysteryEncounterType.SHADY_VITAMIN_DEALER,
  MysteryEncounterType.THE_POKEMON_SALESMAN,
  MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE,
  MysteryEncounterType.THE_WINSTRATE_CHALLENGE
];

const civilizationBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.DEPARTMENT_STORE_SALE,
  MysteryEncounterType.PART_TIMER,
  MysteryEncounterType.FUN_AND_GAMES,
  MysteryEncounterType.GLOBAL_TRADE_SYSTEM
];

/**
 * To add an encounter to every biome possible, use this array
 */
const anyBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.FIGHT_OR_FLIGHT,
  MysteryEncounterType.DARK_DEAL,
  MysteryEncounterType.MYSTERIOUS_CHEST,
  MysteryEncounterType.TRAINING_SESSION,
  MysteryEncounterType.DELIBIRDY,
  MysteryEncounterType.A_TRAINERS_TEST,
  MysteryEncounterType.TRASH_TO_TREASURE,
  MysteryEncounterType.BERRIES_ABOUND,
  MysteryEncounterType.CLOWNING_AROUND,
  MysteryEncounterType.WEIRD_DREAM,
  MysteryEncounterType.TELEPORTING_HIJINKS,
  MysteryEncounterType.BUG_TYPE_SUPERFAN,
  MysteryEncounterType.UNCOMMON_BREED
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
  [Biome.PLAINS, [
    MysteryEncounterType.SLUMBERING_SNORLAX,
    MysteryEncounterType.ABSOLUTE_AVARICE
  ]],
  [Biome.GRASS, [
    MysteryEncounterType.SLUMBERING_SNORLAX,
    MysteryEncounterType.ABSOLUTE_AVARICE
  ]],
  [Biome.TALL_GRASS, [
    MysteryEncounterType.ABSOLUTE_AVARICE
  ]],
  [Biome.METROPOLIS, []],
  [Biome.FOREST, [
    MysteryEncounterType.SAFARI_ZONE,
    MysteryEncounterType.ABSOLUTE_AVARICE
  ]],

  [Biome.SEA, [
    MysteryEncounterType.LOST_AT_SEA
  ]],
  [Biome.SWAMP, [
    MysteryEncounterType.SAFARI_ZONE
  ]],
  [Biome.BEACH, []],
  [Biome.LAKE, []],
  [Biome.SEABED, []],
  [Biome.MOUNTAIN, []],
  [Biome.BADLANDS, [
    MysteryEncounterType.DANCING_LESSONS
  ]],
  [Biome.CAVE, [
    MysteryEncounterType.THE_STRONG_STUFF
  ]],
  [Biome.DESERT, [
    MysteryEncounterType.DANCING_LESSONS
  ]],
  [Biome.ICE_CAVE, []],
  [Biome.MEADOW, []],
  [Biome.POWER_PLANT, []],
  [Biome.VOLCANO, [
    MysteryEncounterType.FIERY_FALLOUT,
    MysteryEncounterType.DANCING_LESSONS
  ]],
  [Biome.GRAVEYARD, []],
  [Biome.DOJO, []],
  [Biome.FACTORY, []],
  [Biome.RUINS, []],
  [Biome.WASTELAND, [
    MysteryEncounterType.DANCING_LESSONS
  ]],
  [Biome.ABYSS, [
    MysteryEncounterType.DANCING_LESSONS
  ]],
  [Biome.SPACE, []],
  [Biome.CONSTRUCTION_SITE, []],
  [Biome.JUNGLE, [
    MysteryEncounterType.SAFARI_ZONE
  ]],
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
  allMysteryEncounters[MysteryEncounterType.SLUMBERING_SNORLAX] = SlumberingSnorlaxEncounter;
  allMysteryEncounters[MysteryEncounterType.DEPARTMENT_STORE_SALE] = DepartmentStoreSaleEncounter;
  allMysteryEncounters[MysteryEncounterType.SHADY_VITAMIN_DEALER] = ShadyVitaminDealerEncounter;
  allMysteryEncounters[MysteryEncounterType.FIELD_TRIP] = FieldTripEncounter;
  allMysteryEncounters[MysteryEncounterType.SAFARI_ZONE] = SafariZoneEncounter;
  allMysteryEncounters[MysteryEncounterType.LOST_AT_SEA] = LostAtSeaEncounter;
  allMysteryEncounters[MysteryEncounterType.FIERY_FALLOUT] = FieryFalloutEncounter;
  allMysteryEncounters[MysteryEncounterType.THE_STRONG_STUFF] = TheStrongStuffEncounter;
  allMysteryEncounters[MysteryEncounterType.THE_POKEMON_SALESMAN] = ThePokemonSalesmanEncounter;
  allMysteryEncounters[MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE] = AnOfferYouCantRefuseEncounter;
  allMysteryEncounters[MysteryEncounterType.DELIBIRDY] = DelibirdyEncounter;
  allMysteryEncounters[MysteryEncounterType.ABSOLUTE_AVARICE] = AbsoluteAvariceEncounter;
  allMysteryEncounters[MysteryEncounterType.A_TRAINERS_TEST] = ATrainersTestEncounter;
  allMysteryEncounters[MysteryEncounterType.TRASH_TO_TREASURE] = TrashToTreasureEncounter;
  allMysteryEncounters[MysteryEncounterType.BERRIES_ABOUND] = BerriesAboundEncounter;
  allMysteryEncounters[MysteryEncounterType.CLOWNING_AROUND] = ClowningAroundEncounter;
  allMysteryEncounters[MysteryEncounterType.PART_TIMER] = PartTimerEncounter;
  allMysteryEncounters[MysteryEncounterType.DANCING_LESSONS] = DancingLessonsEncounter;
  allMysteryEncounters[MysteryEncounterType.WEIRD_DREAM] = WeirdDreamEncounter;
  allMysteryEncounters[MysteryEncounterType.THE_WINSTRATE_CHALLENGE] = TheWinstrateChallengeEncounter;
  allMysteryEncounters[MysteryEncounterType.TELEPORTING_HIJINKS] = TeleportingHijinksEncounter;
  allMysteryEncounters[MysteryEncounterType.BUG_TYPE_SUPERFAN] = BugTypeSuperfanEncounter;
  allMysteryEncounters[MysteryEncounterType.FUN_AND_GAMES] = FunAndGamesEncounter;
  allMysteryEncounters[MysteryEncounterType.UNCOMMON_BREED] = UncommonBreedEncounter;
  allMysteryEncounters[MysteryEncounterType.GLOBAL_TRADE_SYSTEM] = GlobalTradeSystemEncounter;

  // Add extreme encounters to biome map
  extremeBiomeEncounters.forEach(encounter => {
    EXTREME_ENCOUNTER_BIOMES.forEach(biome => {
      const encountersForBiome = mysteryEncountersByBiome.get(biome);
      if (encountersForBiome && !encountersForBiome.includes(encounter)) {
        encountersForBiome.push(encounter);
      }
    });
  });
  // Add non-extreme encounters to biome map
  nonExtremeBiomeEncounters.forEach(encounter => {
    NON_EXTREME_ENCOUNTER_BIOMES.forEach(biome => {
      const encountersForBiome = mysteryEncountersByBiome.get(biome);
      if (encountersForBiome && !encountersForBiome.includes(encounter)) {
        encountersForBiome.push(encounter);
      }
    });
  });
  // Add human encounters to biome map
  humanTransitableBiomeEncounters.forEach(encounter => {
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      const encountersForBiome = mysteryEncountersByBiome.get(biome);
      if (encountersForBiome && !encountersForBiome.includes(encounter)) {
        encountersForBiome.push(encounter);
      }
    });
  });
  // Add civilization encounters to biome map
  civilizationBiomeEncounters.forEach(encounter => {
    CIVILIZATION_ENCOUNTER_BIOMES.forEach(biome => {
      const encountersForBiome = mysteryEncountersByBiome.get(biome);
      if (encountersForBiome && !encountersForBiome.includes(encounter)) {
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
