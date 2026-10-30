import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { BiomeId } from "#enums/biome-id";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { doTrainerExclamation } from "#mystery-encounters/encounter-phase-utils";
import type { RewardPool, RewardPoolEntry } from "#types/rewards";
import { randSeedFloat, randSeedInt } from "#utils/common";
import { getPartyLuckValue } from "#utils/party";
import { weightedPick } from "#utils/random";
import { NumberHolder } from "#utils/value-holder";
import type { RewardOption } from "./reward";
import { generateRewardOptionFromId } from "./reward-utils";

const BASE_CHANCE_ON_FIELD = 0.5; // 0.05
const BASE_CHANCE_ON_FIELD_DOUBLE = 0.3; // 0.03
const BASE_CHANCE_IN_PARTY = 0; // 0
const LUCK_MULTIPLIER = 0.01;

export function findHiddenItems(): Promise<void> {
  return new Promise<void>(resolve => {
    const rewardOptions: RewardOption[] = [];

    const biomeId = globalScene.arena.biomeId;

    for (const pokemon of globalScene.getPlayerParty()) {
      const baseChanceOnField =
        (globalScene.getPlayerField().length > 1 ? BASE_CHANCE_ON_FIELD_DOUBLE : BASE_CHANCE_ON_FIELD)
        + getPartyLuckValue() * LUCK_MULTIPLIER;
      const chance = new NumberHolder(pokemon.isOnField() ? baseChanceOnField : BASE_CHANCE_IN_PARTY);
      applyAbAttrs("HiddenItemChanceAbAttr", { pokemon, chance });
      if (randSeedFloat() < chance.value) {
        const rewardMap = new Map<RewardPoolEntry, number>();

        const randomNumber = randSeedInt(99, 0);
        const tier =
          randomNumber < 1
            ? RarityTier.MASTER
            : randomNumber < 5
              ? RarityTier.ROGUE
              : randomNumber < 15
                ? RarityTier.ULTRA
                : randomNumber < 40
                  ? RarityTier.GREAT
                  : RarityTier.COMMON;

        for (const entry of baseHiddenItemsPool[tier]) {
          rewardMap.set(entry, typeof entry.weight === "number" ? entry.weight : entry.weight());
        }
        editHiddenItemMapBiome(rewardMap, biomeId, tier);
        editHiddenItemMapPokemon(rewardMap, pokemon.species.speciesId, tier);
        const pickedPoolEntry = weightedPick(rewardMap);

        const rewardOption = generateRewardOptionFromId(pickedPoolEntry.id, 0, RarityTier.COMMON, 0);
        rewardOption.source = pokemon;

        rewardOptions.push(rewardOption);
      }

      // Apply Honey Gather
      const honeyGatherChance = new NumberHolder(0);
      applyAbAttrs("HoneyGatherChanceAbAttr", { pokemon, chance: honeyGatherChance });

      if (randSeedFloat() < honeyGatherChance.value) {
        const rewardOption = generateRewardOptionFromId(RewardId.RELIC_GOLD, 0, RarityTier.LUXURY, 0);
        rewardOption.source = pokemon;
        rewardOptions.push(rewardOption);
      }

      // Apply Ball Fetch
      const ballFetchChance = new NumberHolder(0);
      applyAbAttrs("BallFetchChanceAbAttr", { pokemon, chance: ballFetchChance });

      if (randSeedFloat() < ballFetchChance.value) {
        const rewardMap = new Map<RewardPoolEntry, number>();

        for (const entry of ballFetchPool) {
          rewardMap.set(entry, typeof entry.weight === "number" ? entry.weight : entry.weight());
        }
        const pickedPoolEntry = weightedPick(rewardMap);

        const rewardOption = generateRewardOptionFromId(pickedPoolEntry.id, 0, RarityTier.LUXURY, 0);
        rewardOption.source = pokemon;
        rewardOptions.push(rewardOption);
      }
    }

    if (rewardOptions.length === 0) {
      resolve();
      return;
    }

    doTrainerExclamation();

    const pokemonString = [...new Set(rewardOptions.map(ro => ro.source!))]
      .map(source => source.getNameToRender({ useIllusion: false, prependFormName: false }))
      .join(", ");

    globalScene.ui.showText(
      `${pokemonString} found some hidden items!`,
      null,
      () => {
        const customShopRewards = { guaranteedRewardOptions: rewardOptions };
        globalScene.phaseManager.unshiftNew("SelectRewardPhase", 0, undefined, customShopRewards, false, true);
        resolve();
      },
      null,
      true,
    );
  });
}

const ballFetchPool: RewardPoolEntry[] = [
  { id: RewardId.POKEBALL, weight: 50 },
  { id: RewardId.GREAT_BALL, weight: 30 },
  { id: RewardId.ULTRA_BALL, weight: 15 },
  { id: RewardId.ROGUE_BALL, weight: 4 },
  { id: RewardId.MASTER_BALL, weight: 1 },
];

const baseHiddenItemsPool: RewardPool = {
  [RarityTier.COMMON]: [
    { id: RewardId.NUGGET, weight: 1 },
    { id: RewardId.BERRY, weight: 1 },
  ],
  [RarityTier.GREAT]: [
    { id: RewardId.VITAMIN, weight: 1 },
    { id: RewardId.BIG_NUGGET, weight: 1 },
  ],
  [RarityTier.ULTRA]: [
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
    { id: RewardId.RARER_CANDY, weight: 1 },
  ],
  [RarityTier.ROGUE]: [
    { id: RewardId.RARER_CANDY, weight: 1 },
    { id: TrainerItemId.BERRY_POUCH, weight: 1 },
  ],
  [RarityTier.MASTER]: [{ id: RewardId.DNA_SPLICERS, weight: 1 }],
  [RarityTier.LUXURY]: [],
};

function editHiddenItemMapPokemon(
  rewardMap: Map<RewardPoolEntry, number>,
  speciesId: SpeciesId,
  tier: RarityTier,
): void {
  if (!hiddenItemsPokemonPools[speciesId]) {
    return;
  }
  const newEntries = hiddenItemsPokemonPools[speciesId][tier];

  for (const entry of newEntries) {
    const newWeight = typeof entry.weight === "number" ? entry.weight : entry.weight();

    const existingEntry = [...rewardMap.keys()].find(existing => existing.id === entry.id);

    if (existingEntry) {
      rewardMap.set(existingEntry, newWeight);
    } else {
      rewardMap.set(entry, newWeight);
    }
  }
}

const hiddenItemsPokemonPools: Partial<Record<SpeciesId, RewardPool>> = {
  [SpeciesId.ZYGARDE]: {
    [RarityTier.COMMON]: [{ id: RewardId.HYPER_POTION, weight: 10 }],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },
};

function editHiddenItemMapBiome(rewardMap: Map<RewardPoolEntry, number>, biomeId: BiomeId, tier: RarityTier): void {
  const newEntries = hiddenItemsBiomePools[biomeId][tier];

  for (const entry of newEntries) {
    const newWeight = typeof entry.weight === "number" ? entry.weight : entry.weight();

    const existingEntry = [...rewardMap.keys()].find(existing => existing.id === entry.id);

    if (existingEntry) {
      rewardMap.set(existingEntry, newWeight);
    } else {
      rewardMap.set(entry, newWeight);
    }
  }
}

const hiddenItemsBiomePools: Record<BiomeId, RewardPool> = {
  [BiomeId.TOWN]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POTION, weight: 1 },
      { id: RewardId.BERRY, weight: 0 },
    ],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.PLAINS]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.GRASS]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.TALL_GRASS]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.METROPOLIS]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.FOREST]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SEA]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SWAMP]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.BEACH]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.LAKE]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SEABED]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.MOUNTAIN]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.BADLANDS]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.CAVE]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.DESERT]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.ICE_CAVE]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.MEADOW]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.POWER_PLANT]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.VOLCANO]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.GRAVEYARD]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.DOJO]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.FACTORY]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.RUINS]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.WASTELAND]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.ABYSS]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SPACE]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.CONSTRUCTION_SITE]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.JUNGLE]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.FAIRY_CAVE]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.TEMPLE]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SLUM]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SNOWY_FOREST]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.ISLAND]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.LABORATORY]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.END]: {
    [RarityTier.COMMON]: [],
    [RarityTier.GREAT]: [],
    [RarityTier.ULTRA]: [],
    [RarityTier.ROGUE]: [],
    [RarityTier.MASTER]: [],
    [RarityTier.LUXURY]: [],
  },
};
