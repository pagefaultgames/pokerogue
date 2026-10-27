import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { BiomeId } from "#enums/biome-id";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { doTrainerExclamation } from "#mystery-encounters/encounter-phase-utils";
import type { RewardPool, RewardPoolEntry } from "#types/rewards";
import { randSeedFloat, randSeedInt } from "#utils/common";
import { weightedPick } from "#utils/random";
import { NumberHolder } from "#utils/value-holder";
import type { RewardOption } from "./reward";
import { generateRewardOptionFromId } from "./reward-utils";

const BASE_CHANCE_ON_FIELD = 1; // 0.05
const BASE_CHANCE_IN_PARTY = 1; // 0
const LUCK_MULTIPLIER = 0.01;

export function findHiddenItems(): Promise<void> {
  return new Promise<void>(resolve => {
    const rewardOptions: RewardOption[] = [];

    const biomeId = globalScene.arena.biomeId;

    for (const pokemon of globalScene.getPlayerParty()) {
      const chance = new NumberHolder(pokemon.isOnField() ? BASE_CHANCE_ON_FIELD : BASE_CHANCE_IN_PARTY);
      chance.value += pokemon.luck * LUCK_MULTIPLIER;
      applyAbAttrs("HiddenItemChanceAbAttr", { pokemon, chance });
      if (randSeedFloat() > chance.value) {
        continue;
      }

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

      for (const entry of hiddenItemsPool[biomeId][tier]) {
        rewardMap.set(entry, typeof entry.weight === "number" ? entry.weight : 0);
      }
      const pickedPoolEntry = weightedPick(rewardMap);

      const rewardOption = generateRewardOptionFromId(pickedPoolEntry.id, 0, RarityTier.COMMON, 0);
      rewardOption.source = pokemon;

      rewardOptions.push(rewardOption);
    }

    if (rewardOptions.length === 0) {
      resolve();
    }

    doTrainerExclamation();

    const pokemonString = rewardOptions
      .map(ro => ro.source!.getNameToRender({ useIllusion: false, prependFormName: false }))
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

const hiddenItemsPool: Record<BiomeId, RewardPool> = {
  [BiomeId.TOWN]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.PLAINS]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.GRASS]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.TALL_GRASS]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.METROPOLIS]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.FOREST]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SEA]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SWAMP]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.BEACH]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.LAKE]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SEABED]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.MOUNTAIN]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.BADLANDS]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.CAVE]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.DESERT]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.ICE_CAVE]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.MEADOW]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.POWER_PLANT]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.VOLCANO]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.GRAVEYARD]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.DOJO]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.FACTORY]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.RUINS]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.WASTELAND]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.ABYSS]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SPACE]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.CONSTRUCTION_SITE]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.JUNGLE]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.FAIRY_CAVE]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.TEMPLE]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SLUM]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.SNOWY_FOREST]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.ISLAND]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.LABORATORY]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },

  [BiomeId.END]: {
    [RarityTier.COMMON]: [
      { id: RewardId.POKEBALL, weight: 1 },
      { id: RewardId.BERRY, weight: 1 },
    ],
    [RarityTier.GREAT]: [
      { id: RewardId.VITAMIN, weight: 1 },
      { id: RewardId.GREAT_BALL, weight: 1 },
    ],
    [RarityTier.ULTRA]: [
      { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 1 },
      { id: RewardId.ULTRA_BALL, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { id: RewardId.RARER_CANDY, weight: 1 },
      { id: RewardId.ROGUE_BALL, weight: 1 },
    ],
    [RarityTier.MASTER]: [{ id: RewardId.MASTER_BALL, weight: 1 }],
    [RarityTier.LUXURY]: [],
  },
};
