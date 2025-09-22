import { getBiomeName } from "#balance/biomes";
import { BiomeId } from "#enums/biome-id";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { ATrainersTestEncounter } from "#mystery-encounters/a-trainers-test-encounter";
import { AbsoluteAvariceEncounter } from "#mystery-encounters/absolute-avarice-encounter";
import { AnOfferYouCantRefuseEncounter } from "#mystery-encounters/an-offer-you-cant-refuse-encounter";
import { BerriesAboundEncounter } from "#mystery-encounters/berries-abound-encounter";
import { BugTypeSuperfanEncounter } from "#mystery-encounters/bug-type-superfan-encounter";
import { ClowningAroundEncounter } from "#mystery-encounters/clowning-around-encounter";
import { DancingLessonsEncounter } from "#mystery-encounters/dancing-lessons-encounter";
import { DarkDealEncounter } from "#mystery-encounters/dark-deal-encounter";
import { DelibirdyEncounter } from "#mystery-encounters/delibirdy-encounter";
import { DepartmentStoreSaleEncounter } from "#mystery-encounters/department-store-sale-encounter";
import { FieldTripEncounter } from "#mystery-encounters/field-trip-encounter";
import { FieryFalloutEncounter } from "#mystery-encounters/fiery-fallout-encounter";
import { FightOrFlightEncounter } from "#mystery-encounters/fight-or-flight-encounter";
import { FunAndGamesEncounter } from "#mystery-encounters/fun-and-games-encounter";
import { GlobalTradeSystemEncounter } from "#mystery-encounters/global-trade-system-encounter";
import { LostAtSeaEncounter } from "#mystery-encounters/lost-at-sea-encounter";
import { MysteriousChallengersEncounter } from "#mystery-encounters/mysterious-challengers-encounter";
import { MysteriousChestEncounter } from "#mystery-encounters/mysterious-chest-encounter";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { PartTimerEncounter } from "#mystery-encounters/part-timer-encounter";
import { SafariZoneEncounter } from "#mystery-encounters/safari-zone-encounter";
import { ShadyVitaminDealerEncounter } from "#mystery-encounters/shady-vitamin-dealer-encounter";
import { SlumberingSnorlaxEncounter } from "#mystery-encounters/slumbering-snorlax-encounter";
import { TeleportingHijinksEncounter } from "#mystery-encounters/teleporting-hijinks-encounter";
import { TheExpertPokemonBreederEncounter } from "#mystery-encounters/the-expert-pokemon-breeder-encounter";
import { ThePokemonSalesmanEncounter } from "#mystery-encounters/the-pokemon-salesman-encounter";
import { TheStrongStuffEncounter } from "#mystery-encounters/the-strong-stuff-encounter";
import { TheWinstrateChallengeEncounter } from "#mystery-encounters/the-winstrate-challenge-encounter";
import { TrainingSessionEncounter } from "#mystery-encounters/training-session-encounter";
import { TrashToTreasureEncounter } from "#mystery-encounters/trash-to-treasure-encounter";
import { UncommonBreedEncounter } from "#mystery-encounters/uncommon-breed-encounter";
import { WeirdDreamEncounter } from "#mystery-encounters/weird-dream-encounter";

export const EXTREME_ENCOUNTER_BIOMES = [
  BiomeId.SEA,
  BiomeId.SEABED,
  BiomeId.BADLANDS,
  BiomeId.DESERT,
  BiomeId.ICE_CAVE,
  BiomeId.VOLCANO,
  BiomeId.WASTELAND,
  BiomeId.ABYSS,
  BiomeId.SPACE,
  BiomeId.END,
];

export const NON_EXTREME_ENCOUNTER_BIOMES = [
  BiomeId.TOWN,
  BiomeId.PLAINS,
  BiomeId.GRASS,
  BiomeId.TALL_GRASS,
  BiomeId.METROPOLIS,
  BiomeId.FOREST,
  BiomeId.SWAMP,
  BiomeId.BEACH,
  BiomeId.LAKE,
  BiomeId.MOUNTAIN,
  BiomeId.CAVE,
  BiomeId.MEADOW,
  BiomeId.POWER_PLANT,
  BiomeId.GRAVEYARD,
  BiomeId.DOJO,
  BiomeId.FACTORY,
  BiomeId.RUINS,
  BiomeId.CONSTRUCTION_SITE,
  BiomeId.JUNGLE,
  BiomeId.FAIRY_CAVE,
  BiomeId.TEMPLE,
  BiomeId.SLUM,
  BiomeId.SNOWY_FOREST,
  BiomeId.ISLAND,
  BiomeId.LABORATORY,
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
  BiomeId.TOWN,
  BiomeId.PLAINS,
  BiomeId.GRASS,
  BiomeId.TALL_GRASS,
  BiomeId.METROPOLIS,
  BiomeId.FOREST,
  BiomeId.SWAMP,
  BiomeId.BEACH,
  BiomeId.LAKE,
  BiomeId.MOUNTAIN,
  BiomeId.BADLANDS,
  BiomeId.CAVE,
  BiomeId.DESERT,
  BiomeId.ICE_CAVE,
  BiomeId.MEADOW,
  BiomeId.POWER_PLANT,
  BiomeId.GRAVEYARD,
  BiomeId.DOJO,
  BiomeId.FACTORY,
  BiomeId.RUINS,
  BiomeId.CONSTRUCTION_SITE,
  BiomeId.JUNGLE,
  BiomeId.FAIRY_CAVE,
  BiomeId.TEMPLE,
  BiomeId.SLUM,
  BiomeId.SNOWY_FOREST,
  BiomeId.ISLAND,
  BiomeId.LABORATORY,
];

/**
 * Places where you could expect a town or city, some form of large civilization
 */
export const CIVILIZATION_ENCOUNTER_BIOMES = [
  BiomeId.TOWN,
  BiomeId.PLAINS,
  BiomeId.GRASS,
  BiomeId.TALL_GRASS,
  BiomeId.METROPOLIS,
  BiomeId.BEACH,
  BiomeId.LAKE,
  BiomeId.MEADOW,
  BiomeId.POWER_PLANT,
  BiomeId.GRAVEYARD,
  BiomeId.DOJO,
  BiomeId.FACTORY,
  BiomeId.CONSTRUCTION_SITE,
  BiomeId.SLUM,
  BiomeId.ISLAND,
];

export const allMysteryEncounters: {
  [encounterType: number]: MysteryEncounter;
} = {};

const extremeBiomeEncounters: MysteryEncounterType[] = [];

const nonExtremeBiomeEncounters: MysteryEncounterType[] = [
  // MysteryEncounterType.FIELD_TRIP, Disabled
  MysteryEncounterType.DANCING_LESSONS, // Is also in BADLANDS, DESERT, VOLCANO, WASTELAND, ABYSS
];

const humanTransitableBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.MYSTERIOUS_CHALLENGERS,
  MysteryEncounterType.SHADY_VITAMIN_DEALER,
  MysteryEncounterType.THE_POKEMON_SALESMAN,
  // MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE, Disabled
  MysteryEncounterType.THE_WINSTRATE_CHALLENGE,
  MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER,
];

const civilizationBiomeEncounters: MysteryEncounterType[] = [
  MysteryEncounterType.DEPARTMENT_STORE_SALE,
  MysteryEncounterType.PART_TIMER,
  MysteryEncounterType.FUN_AND_GAMES,
  MysteryEncounterType.GLOBAL_TRADE_SYSTEM,
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
  MysteryEncounterType.UNCOMMON_BREED,
];

/**
 * ENCOUNTER BIOME MAPPING
 * To add an Encounter to a biome group, instead of cluttering the map, use the biome group arrays above
 *
 * Adding specific Encounters to the mysteryEncountersByBiome map is for specific cases and special circumstances
 * that biome groups do not cover
 */
export const mysteryEncountersByBiome = new Map<BiomeId, MysteryEncounterType[]>([
  [BiomeId.TOWN, []],
  [BiomeId.PLAINS, [MysteryEncounterType.SLUMBERING_SNORLAX]],
  [BiomeId.GRASS, [MysteryEncounterType.SLUMBERING_SNORLAX, MysteryEncounterType.ABSOLUTE_AVARICE]],
  [BiomeId.TALL_GRASS, [MysteryEncounterType.SLUMBERING_SNORLAX, MysteryEncounterType.ABSOLUTE_AVARICE]],
  [BiomeId.METROPOLIS, []],
  [BiomeId.FOREST, [MysteryEncounterType.SAFARI_ZONE, MysteryEncounterType.ABSOLUTE_AVARICE]],
  [BiomeId.SEA, [MysteryEncounterType.LOST_AT_SEA]],
  [BiomeId.SWAMP, [MysteryEncounterType.SAFARI_ZONE]],
  [BiomeId.BEACH, []],
  [BiomeId.LAKE, []],
  [BiomeId.SEABED, []],
  [BiomeId.MOUNTAIN, []],
  [BiomeId.BADLANDS, [MysteryEncounterType.DANCING_LESSONS]],
  [BiomeId.CAVE, [MysteryEncounterType.THE_STRONG_STUFF]],
  [BiomeId.DESERT, [MysteryEncounterType.DANCING_LESSONS]],
  [BiomeId.ICE_CAVE, []],
  [BiomeId.MEADOW, []],
  [BiomeId.POWER_PLANT, []],
  [BiomeId.VOLCANO, [MysteryEncounterType.FIERY_FALLOUT, MysteryEncounterType.DANCING_LESSONS]],
  [BiomeId.GRAVEYARD, []],
  [BiomeId.DOJO, []],
  [BiomeId.FACTORY, []],
  [BiomeId.RUINS, []],
  [BiomeId.WASTELAND, [MysteryEncounterType.DANCING_LESSONS]],
  [BiomeId.ABYSS, [MysteryEncounterType.DANCING_LESSONS]],
  [BiomeId.SPACE, [MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER]],
  [BiomeId.CONSTRUCTION_SITE, []],
  [BiomeId.JUNGLE, [MysteryEncounterType.SAFARI_ZONE]],
  [BiomeId.FAIRY_CAVE, []],
  [BiomeId.TEMPLE, []],
  [BiomeId.SLUM, []],
  [BiomeId.SNOWY_FOREST, []],
  [BiomeId.ISLAND, []],
  [BiomeId.LABORATORY, []],
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
  allMysteryEncounters[MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER] = TheExpertPokemonBreederEncounter;

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
  let _encounterBiomeTableLog = "";
  mysteryEncountersByBiome.forEach((biomeEncounters, biome) => {
    anyBiomeEncounters.forEach(encounter => {
      if (!biomeEncounters.includes(encounter)) {
        biomeEncounters.push(encounter);
      }
    });

    _encounterBiomeTableLog += `${getBiomeName(biome).toUpperCase()}: [${biomeEncounters
      .map(type => MysteryEncounterType[type].toString().toLowerCase())
      .sort()
      .join(", ")}]\n`;
  });

  //console.debug("All Mystery Encounters by Biome:\n" + encounterBiomeTableLog);
}
