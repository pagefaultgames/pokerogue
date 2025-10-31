import { allHeldItems } from "#data/data-lists";
import { BerryType } from "#enums/berry-type";
import { HeldItemCategoryId, HeldItemId, HeldItemNames, isCategoryId } from "#enums/held-item-id";
import type { PokemonType } from "#enums/pokemon-type";
import { HeldItemPoolType } from "#enums/reward-pool-type";
import { RarityTier } from "#enums/reward-tier";
import { PERMANENT_STATS } from "#enums/stat";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { permanentStatToHeldItem } from "#items/base-stat-multiply";
import { berryTypeToHeldItem } from "#items/berry";
import {
  type HeldItemConfiguration,
  type HeldItemPool,
  type HeldItemSaveData,
  type HeldItemSpecs,
  type HeldItemTieredPool,
  type HeldItemWeights,
  isHeldItemCategoryEntry,
  isHeldItemPool,
  isHeldItemSpecs,
} from "#types/held-item-data-types";
import { coerceArray, pickWeightedIndex, randSeedInt } from "#utils/common";
import { getEnumValues } from "#utils/enums";

export const wildHeldItemPool: HeldItemTieredPool = {};

export const trainerHeldItemPool: HeldItemTieredPool = {};

export const dailyStarterHeldItemPool: HeldItemTieredPool = {};

export function assignDailyRunStarterHeldItems(party: PlayerPokemon[]) {
  for (const p of party) {
    for (let m = 0; m < 3; m++) {
      const tierValue = randSeedInt(64);

      const tier = getDailyRarityTier(tierValue);

      const item = getNewHeldItemFromPool(
        getHeldItemPool(HeldItemPoolType.DAILY_STARTER)[tier] as HeldItemPool,
        p,
        party,
      );
      p.heldItemManager.add(item);
    }
  }
}

function getDailyRarityTier(tierValue: number): RarityTier {
  if (tierValue > 25) {
    return RarityTier.COMMON;
  }
  if (tierValue > 12) {
    return RarityTier.GREAT;
  }
  if (tierValue > 4) {
    return RarityTier.ULTRA;
  }
  if (tierValue > 0) {
    return RarityTier.ROGUE;
  }
  return RarityTier.MASTER;
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
  const existingItemCount = enemy.heldItemManager.getHeldItemCount();
  count -= existingItemCount;
  if (count <= 0) {
    return;
  }
  console.log(existingItemCount, count);
  for (let i = 1; i <= count; i++) {
    const item = getNewHeldItemFromTieredPool(
      getHeldItemPool(poolType),
      enemy,
      upgradeChance && !randSeedInt(upgradeChance) ? 1 : 0,
    );
    if (item) {
      enemy.heldItemManager.add(item);
    }
  }
  if (!(waveIndex % 1000)) {
    enemy.heldItemManager.add(HeldItemId.MINI_BLACK_HOLE);
  }
}

function getRandomTier(): RarityTier {
  const tierValue = randSeedInt(1024);

  if (tierValue > 255) {
    return RarityTier.COMMON;
  }
  if (tierValue > 60) {
    return RarityTier.GREAT;
  }
  if (tierValue > 12) {
    return RarityTier.ULTRA;
  }
  if (tierValue) {
    return RarityTier.ROGUE;
  }
  return RarityTier.MASTER;
}

function determineItemPoolTier(pool: HeldItemTieredPool, upgradeCount?: number): RarityTier {
  let tier = getRandomTier();

  if (!upgradeCount) {
    upgradeCount = 0;
  }

  tier += upgradeCount;
  while (tier && pool[tier]?.length === 0) {
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
  const tier = determineItemPoolTier(pool, upgradeCount);
  const tierPool = pool[tier];

  return getNewHeldItemFromPool(tierPool!, pokemon);
}

export function getNewVitaminHeldItem(customWeights: HeldItemWeights = {}, target?: Pokemon): HeldItemId {
  const items = PERMANENT_STATS.map(s => permanentStatToHeldItem[s]);
  const weights = items.map(t => (target?.heldItemManager.isMaxStack(t) ? 0 : (customWeights[t] ?? 1)));
  const pickedIndex = pickWeightedIndex(weights);
  return pickedIndex != null ? items[pickedIndex] : 0;
}

export function getNewBerryHeldItem(customWeights: HeldItemWeights = {}, target?: Pokemon): HeldItemId {
  const berryTypes = getEnumValues(BerryType);
  const items = berryTypes.map(b => berryTypeToHeldItem[b]);

  const weights = items.map(t =>
    target?.heldItemManager.isMaxStack(t)
      ? 0
      : (customWeights[t]
          ?? (t === HeldItemId.SITRUS_BERRY || t === HeldItemId.LUM_BERRY || t === HeldItemId.LEPPA_BERRY))
        ? 2
        : 1,
  );

  const pickedIndex = pickWeightedIndex(weights);
  return pickedIndex != null ? items[pickedIndex] : 0;
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
      .map(m => p.getMoveType(m.getMove(), true)),
  );
  if (attackMoveTypes.length === 0) {
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

  const pickedIndex = pickWeightedIndex(weights);
  return pickedIndex != null ? attackTypeToHeldItem[types[pickedIndex]] : 0;
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

  const pickedIndex = pickWeightedIndex(weights);
  if (pickedIndex == null) {
    return 0;
  }
  const entry = pool[pickedIndex].entry;

  if (typeof entry === "number") {
    if (isCategoryId(entry)) {
      return getNewHeldItemFromCategory(entry, party ?? pokemon, {}, pokemon) as HeldItemId;
    }
    return entry as HeldItemId;
  }

  if (isHeldItemPool(entry)) {
    return getNewHeldItemFromPool(entry, pokemon, party) as HeldItemId;
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
      pokemon.heldItemManager.add(entry as HeldItemId, actualCount);
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

// TODO: Handle form change items
export function saveDataToConfig(saveData: HeldItemSaveData): HeldItemConfiguration {
  const config: HeldItemConfiguration = [];
  for (const specs of saveData) {
    config.push({ entry: specs, count: 1 });
  }
  return config;
}
