import type { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { coerceArray, getEnumValues, randSeedFloat, randSeedInt } from "#app/utils/common";
import { BerryType } from "#enums/berry-type";
import { HeldItemCategoryId, HeldItemId, HeldItemNames, isCategoryId } from "#enums/held-item-id";
import { HeldItemPoolType } from "#enums/modifier-pool-type";
import type { PokemonType } from "#enums/pokemon-type";
import { RewardTier } from "#enums/reward-tier";
import { PERMANENT_STATS } from "#enums/stat";
import { allHeldItems } from "./all-held-items";
import {
  type HeldItemConfiguration,
  type HeldItemPool,
  type HeldItemSpecs,
  type HeldItemTieredPool,
  type HeldItemWeights,
  isHeldItemCategoryEntry,
  isHeldItemPool,
  isHeldItemSpecs,
} from "./held-item-data-types";
import { attackTypeToHeldItem } from "./held-items/attack-type-booster";
import { permanentStatToHeldItem } from "./held-items/base-stat-booster";
import { berryTypeToHeldItem } from "./held-items/berry";

export const wildHeldItemPool: HeldItemTieredPool = {};

export const trainerHeldItemPool: HeldItemTieredPool = {};

export const dailyStarterHeldItemPool: HeldItemTieredPool = {};

export function assignDailyRunStarterHeldItems(party: PlayerPokemon[]) {
  for (const p of party) {
    for (let m = 0; m < 3; m++) {
      const tierValue = randSeedInt(64);

      const tier = getDailyRewardTier(tierValue);

      const item = getNewHeldItemFromPool(
        getHeldItemPool(HeldItemPoolType.DAILY_STARTER)[tier] as HeldItemPool,
        p,
        party,
      );
      p.heldItemManager.add(item);
    }
  }
}

function getDailyRewardTier(tierValue: number): RewardTier {
  if (tierValue > 25) {
    return RewardTier.COMMON;
  }
  if (tierValue > 12) {
    return RewardTier.GREAT;
  }
  if (tierValue > 4) {
    return RewardTier.ULTRA;
  }
  if (tierValue > 0) {
    return RewardTier.ROGUE;
  }
  return RewardTier.MASTER;
}

function getHeldItemPool(poolType: HeldItemPoolType): HeldItemTieredPool {
  let pool: HeldItemTieredPool;
  switch (poolType) {
    case HeldItemPoolType.WILD:
      pool = wildHeldItemPool;
      break;
    case HeldItemPoolType.TRAINER:
      pool = trainerHeldItemPool;
      break;
    case HeldItemPoolType.DAILY_STARTER:
      pool = dailyStarterHeldItemPool;
      break;
  }
  return pool;
}

// TODO: Add proper documentation to this function (once it fully works...)
export function assignEnemyHeldItemsForWave(
  waveIndex: number,
  count: number,
  enemy: EnemyPokemon,
  poolType: HeldItemPoolType.WILD | HeldItemPoolType.TRAINER,
  upgradeChance = 0,
): void {
  for (let i = 1; i <= count; i++) {
    const item = getNewHeldItemFromTieredPool(
      getHeldItemPool(poolType),
      enemy,
      upgradeChance && !randSeedInt(upgradeChance) ? 1 : 0,
    );
    enemy.heldItemManager.add(item);
  }
  if (!(waveIndex % 1000)) {
    enemy.heldItemManager.add(HeldItemId.MINI_BLACK_HOLE);
  }
}

function getRandomTier(): RewardTier {
  const tierValue = randSeedInt(1024);

  if (tierValue > 255) {
    return RewardTier.COMMON;
  }
  if (tierValue > 60) {
    return RewardTier.GREAT;
  }
  if (tierValue > 12) {
    return RewardTier.ULTRA;
  }
  if (tierValue) {
    return RewardTier.ROGUE;
  }
  return RewardTier.MASTER;
}

function determineEnemyPoolTier(pool: HeldItemTieredPool, upgradeCount?: number): RewardTier {
  let tier = getRandomTier();

  if (!upgradeCount) {
    upgradeCount = 0;
  }

  tier += upgradeCount;
  while (tier && !pool[tier]?.length) {
    tier--;
    if (upgradeCount) {
      upgradeCount--;
    }
  }

  return tier;
}

function getNewHeldItemFromTieredPool(
  pool: HeldItemTieredPool,
  pokemon: Pokemon,
  upgradeCount: number,
): HeldItemId | HeldItemSpecs {
  const tier = determineEnemyPoolTier(pool, upgradeCount);
  const tierPool = pool[tier];

  return getNewHeldItemFromPool(tierPool!, pokemon);
}

function pickWeightedIndex(weights: number[]): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight <= 0) {
    throw new Error("Total weight must be greater than 0.");
  }

  let r = randSeedFloat() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) {
      return i;
    }
    r -= weights[i];
  }

  return -1; // TODO: Change to something more appropriate
}

export function getNewVitaminHeldItem(customWeights: HeldItemWeights = {}, target?: Pokemon): HeldItemId {
  const items = PERMANENT_STATS.map(s => permanentStatToHeldItem[s]);
  const weights = items.map(t => (target?.heldItemManager.isMaxStack(t) ? 0 : (customWeights[t] ?? 1)));
  return items[pickWeightedIndex(weights)];
}

export function getNewBerryHeldItem(customWeights: HeldItemWeights = {}, target?: Pokemon): HeldItemId {
  const berryTypes = getEnumValues(BerryType);
  const items = berryTypes.map(b => berryTypeToHeldItem[b]);

  const weights = items.map(t =>
    target?.heldItemManager.isMaxStack(t)
      ? 0
      : (customWeights[t] ??
          (t === HeldItemId.SITRUS_BERRY || t === HeldItemId.LUM_BERRY || t === HeldItemId.LEPPA_BERRY))
        ? 2
        : 1,
  );

  return items[pickWeightedIndex(weights)];
}

export function getNewAttackTypeBoosterHeldItem(
  pokemon: Pokemon | Pokemon[],
  customWeights: HeldItemWeights = {},
  target?: Pokemon,
): HeldItemId | null {
  const party = coerceArray(pokemon);

  // TODO: make this consider moves or abilities that change types
  const attackMoveTypes = party.flatMap(p =>
    p
      .getMoveset()
      .filter(m => m.getMove().is("AttackMove"))
      .map(m => m.getMove().type),
  );
  if (!attackMoveTypes.length) {
    return null;
  }

  const attackMoveTypeWeights = attackMoveTypes.reduce((map, type) => {
    const current = map.get(type) ?? 0;
    if (current < 3) {
      map.set(type, current + 1);
    }
    return map;
  }, new Map<PokemonType, number>());

  const types = Array.from(attackMoveTypeWeights.keys());

  const weights = types.map(type =>
    target?.heldItemManager.isMaxStack(attackTypeToHeldItem[type])
      ? 0
      : (customWeights[attackTypeToHeldItem[type]] ?? attackMoveTypeWeights.get(type)!),
  );

  const type = types[pickWeightedIndex(weights)];
  return attackTypeToHeldItem[type];
}

export function getNewHeldItemFromCategory(
  id: HeldItemCategoryId,
  pokemon: Pokemon | Pokemon[],
  customWeights: HeldItemWeights = {},
  target?: Pokemon,
): HeldItemId | null {
  if (id === HeldItemCategoryId.BERRY) {
    return getNewBerryHeldItem(customWeights, target);
  }
  if (id === HeldItemCategoryId.VITAMIN) {
    return getNewVitaminHeldItem(customWeights, target);
  }
  if (id === HeldItemCategoryId.TYPE_ATTACK_BOOSTER) {
    return getNewAttackTypeBoosterHeldItem(pokemon, customWeights, target);
  }
  return null;
}

function getPoolWeights(pool: HeldItemPool, pokemon: Pokemon): number[] {
  return pool.map(p => {
    let weight = typeof p.weight === "function" ? p.weight(coerceArray(pokemon)) : p.weight;

    if (typeof p.entry === "number" && !isCategoryId(p.entry)) {
      const itemId = p.entry as HeldItemId;
      console.log("ITEM ID: ", itemId, HeldItemNames[itemId]);
      console.log(allHeldItems[itemId]);

      if (pokemon.heldItemManager.getStack(itemId) >= allHeldItems[itemId].getMaxStackCount()) {
        weight = 0;
      }
    }

    return weight;
  });
}

function getNewHeldItemFromPool(pool: HeldItemPool, pokemon: Pokemon, party?: Pokemon[]): HeldItemId | HeldItemSpecs {
  const weights = getPoolWeights(pool, pokemon);

  const entry = pool[pickWeightedIndex(weights)].entry;

  if (typeof entry === "number") {
    if (isCategoryId(entry)) {
      return getNewHeldItemFromCategory(entry, party ?? pokemon, {}, pokemon) as HeldItemId;
    }
    return entry as HeldItemId;
  }

  if (isHeldItemCategoryEntry(entry)) {
    return getNewHeldItemFromCategory(entry.id, party ?? pokemon, entry?.customWeights, pokemon) as HeldItemId;
  }

  return entry as HeldItemSpecs;
}

function assignItemsFromCategory(id: HeldItemCategoryId, pokemon: Pokemon, count: number) {
  for (let i = 1; i <= count; i++) {
    const newItem = getNewHeldItemFromCategory(id, pokemon, {}, pokemon);
    if (newItem) {
      pokemon.heldItemManager.add(newItem);
    }
  }
}

export function assignItemsFromConfiguration(config: HeldItemConfiguration, pokemon: Pokemon) {
  config.forEach(item => {
    const { entry, count } = item;
    const actualCount = typeof count === "function" ? count() : (count ?? 1);

    if (typeof entry === "number") {
      if (isCategoryId(entry)) {
        assignItemsFromCategory(entry, pokemon, actualCount);
      }
      pokemon.heldItemManager.add(entry, actualCount);
    }

    if (isHeldItemSpecs(entry)) {
      pokemon.heldItemManager.add(entry);
    }

    if (isHeldItemCategoryEntry(entry)) {
      assignItemsFromCategory(entry.id, pokemon, actualCount);
    }

    if (isHeldItemPool(entry)) {
      for (let i = 1; i <= actualCount; i++) {
        const newItem = getNewHeldItemFromPool(entry, pokemon);
        if (newItem) {
          pokemon.heldItemManager.add(newItem);
        }
      }
    }
  });
}
