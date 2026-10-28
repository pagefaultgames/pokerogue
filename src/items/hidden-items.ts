import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { BiomeId } from "#enums/biome-id";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { doTrainerExclamation } from "#mystery-encounters/encounter-phase-utils";
import type { RewardPoolEntry } from "#types/rewards";
import { randSeedFloat } from "#utils/common";
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

      for (const entry of hiddenItemsPool[biomeId]) {
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

const hiddenItemsPool: Record<BiomeId, RewardPoolEntry[]> = {
  [BiomeId.TOWN]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.PLAINS]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.GRASS]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.TALL_GRASS]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.METROPOLIS]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.FOREST]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.SEA]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.SWAMP]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.BEACH]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.LAKE]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.SEABED]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.MOUNTAIN]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.BADLANDS]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.CAVE]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.DESERT]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.ICE_CAVE]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.MEADOW]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.POWER_PLANT]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.VOLCANO]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.GRAVEYARD]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.DOJO]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.FACTORY]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.RUINS]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.WASTELAND]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.ABYSS]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.SPACE]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.CONSTRUCTION_SITE]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.JUNGLE]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.FAIRY_CAVE]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.TEMPLE]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.SLUM]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.SNOWY_FOREST]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.ISLAND]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.LABORATORY]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],

  [BiomeId.END]: [
    { id: RewardId.NUGGET, weight: 25 },
    { id: RewardId.BERRY, weight: 25 },
    { id: RewardId.VITAMIN, weight: 15 },
    { id: RewardId.BIG_NUGGET, weight: 15 },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 6 },
    { id: RewardId.RARER_CANDY, weight: 6 },
    { id: RewardId.RELIC_GOLD, weight: 3 },
    { id: RewardId.RARER_CANDY, weight: 3 },
    { id: RewardId.MASTER_BALL, weight: 1 },
    { id: RewardId.DNA_SPLICERS, weight: 1 },
  ],
};
