import { HeldItemCategoryId, HeldItemId, isCategoryId } from "#enums/held-item-id";
import { PokemonType, type RegularPokemonType } from "#enums/pokemon-type";
import { HeldItemPoolType } from "#enums/reward-pool-type";
import { RarityTier } from "#enums/reward-tier";
import { PERMANENT_STATS } from "#enums/stat";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import type { BerryItemId } from "#items/all-held-items";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { permanentStatToHeldItem } from "#items/base-stat-multiply";
import { berryTypeToHeldItem } from "#items/berry";
import type {
  HeldItemConfiguration,
  HeldItemPool,
  HeldItemSaveData,
  HeldItemSpecs,
  HeldItemWeights,
} from "#types/held-item-data-types";
import type { Mutable } from "#types/type-helpers";
import { coerceArray, pickWeightedIndex, randSeedInt } from "#utils/common";
import { isHeldItemCategoryEntry, isHeldItemPool, isHeldItemSpecs } from "#utils/item-utils";
import type { NonEmptyTuple } from "type-fest";

/**
 * A default pool of held items, organized by tier. \
 * Used to generate items for enemy trainers, wild Pokemon and daily run starters.
 */
type HeldItemTieredPool = Readonly<Record<RarityTier, HeldItemPool>>;

export const wildHeldItemPool = {} as HeldItemTieredPool;

export const trainerHeldItemPool = {} as HeldItemTieredPool;

export const dailyStarterHeldItemPool = {} as HeldItemTieredPool;

// #region Initialization

/**
 * Initialize the wild held item pool
 */
function initWildHeldItemPool() {
  (wildHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.COMMON] = [
    { entry: HeldItemCategoryId.BERRY, weight: 1 },
  ];
  (wildHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.GREAT] = [
    { entry: HeldItemCategoryId.BASE_STAT_BOOST, weight: 1 },
  ];
  (wildHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.ULTRA] = [
    { entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 5 },
    { entry: HeldItemId.WHITE_HERB, weight: 0 },
  ];
  (wildHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.ROGUE] = [{ entry: HeldItemId.LUCKY_EGG, weight: 4 }];
  (wildHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.MASTER] = [{ entry: HeldItemId.GOLDEN_EGG, weight: 1 }];
}

/**
 * Initialize the trainer pokemon held item pool
 */
function initTrainerHeldItemPool() {
  (trainerHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.COMMON] = [
    { entry: HeldItemCategoryId.BERRY, weight: 8 },
    { entry: HeldItemCategoryId.BASE_STAT_BOOST, weight: 3 },
  ];
  (trainerHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.GREAT] = [
    { entry: HeldItemCategoryId.BASE_STAT_BOOST, weight: 3 },
  ];
  (trainerHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.ULTRA] = [
    { entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 10 },
    { entry: HeldItemId.WHITE_HERB, weight: 0 },
  ];
  (trainerHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.ROGUE] = [
    { entry: HeldItemId.FOCUS_BAND, weight: 2 },
    { entry: HeldItemId.LUCKY_EGG, weight: 4 },
    { entry: HeldItemId.QUICK_CLAW, weight: 1 },
    { entry: HeldItemId.GRIP_CLAW, weight: 1 },
    { entry: HeldItemId.WIDE_LENS, weight: 1 },
  ];
  (trainerHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.MASTER] = [
    { entry: HeldItemId.KINGS_ROCK, weight: 1 },
    { entry: HeldItemId.LEFTOVERS, weight: 1 },
    { entry: HeldItemId.SHELL_BELL, weight: 1 },
    { entry: HeldItemId.SCOPE_LENS, weight: 1 },
  ];
}

/**
 * Initialize the daily starter held item pool
 */
function initDailyStarterRewardPool(): void {
  (dailyStarterHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.COMMON] = [
    { entry: HeldItemCategoryId.BASE_STAT_BOOST, weight: 1 },
    { entry: HeldItemCategoryId.BERRY, weight: 3 },
  ];
  (dailyStarterHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.GREAT] = [
    { entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 5 },
  ];
  (dailyStarterHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.ULTRA] = [
    { entry: HeldItemId.REVIVER_SEED, weight: 4 },
    { entry: HeldItemId.SOOTHE_BELL, weight: 1 },
    { entry: HeldItemId.SOUL_DEW, weight: 1 },
    { entry: HeldItemId.GOLDEN_PUNCH, weight: 1 },
  ];
  (dailyStarterHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.ROGUE] = [
    { entry: HeldItemId.GRIP_CLAW, weight: 5 },
    { entry: HeldItemId.BATON, weight: 2 },
    { entry: HeldItemId.FOCUS_BAND, weight: 5 },
    { entry: HeldItemId.QUICK_CLAW, weight: 3 },
    { entry: HeldItemId.KINGS_ROCK, weight: 3 },
  ];
  (dailyStarterHeldItemPool as Mutable<HeldItemTieredPool>)[RarityTier.MASTER] = [
    { entry: HeldItemId.LEFTOVERS, weight: 1 },
    { entry: HeldItemId.SHELL_BELL, weight: 1 },
  ];
}

export function initHeldItemPools(): void {
  initWildHeldItemPool();
  initTrainerHeldItemPool();
  initDailyStarterRewardPool();
}

// #endregion Initialization

export function assignDailyRunStarterHeldItems(party: PlayerPokemon[]) {
  const DAILY_RUN_ITEMS_PER_POKEMON = 3;
  const pool = getHeldItemPool(HeldItemPoolType.DAILY_STARTER);
  for (const p of party) {
    for (let m = 0; m < DAILY_RUN_ITEMS_PER_POKEMON; m++) {
      const tier = getDailyRarityTier();

      const item = getNewHeldItemFromPool(pool[tier], p, party);
      if (item) {
        p.heldItemManager.add(item);
      }
    }
  }
}

/**
 * Generate a random item rarity for a daily run starter held item.
 * @returns The corresponding rarity tier to be used.
 */
function getDailyRarityTier(): RarityTier {
  const roll = randSeedInt(64);
  if (roll > 25) {
    return RarityTier.COMMON;
  }
  if (roll > 12) {
    return RarityTier.GREAT;
  }
  if (roll > 4) {
    return RarityTier.ULTRA;
  }
  if (roll > 0) {
    return RarityTier.ROGUE;
  }
  return RarityTier.MASTER;
}

function getHeldItemPool(poolType: HeldItemPoolType): HeldItemTieredPool {
  switch (poolType) {
    case HeldItemPoolType.WILD:
      return wildHeldItemPool;
    case HeldItemPoolType.TRAINER:
      return trainerHeldItemPool;
    case HeldItemPoolType.DAILY_STARTER:
      return dailyStarterHeldItemPool;
  }
}

/**
 * Assign randomly generated held items to an enemy Pokemon.
 * @param waveIndex - Index of the current wave
 * @param count - Max number of held items the enemy should end up holding (including existing items)
 * @param enemy - The {@linkcode EnemyPokemon} to receive the items
 * @param poolType - Which tiered pool to draw from ({@linkcode HeldItemPoolType.WILD | WILD} or {@linkcode HeldItemPoolType.TRAINER | TRAINER})
 * @param upgradeChanceDivisor - If `> 0`, each generated item has a `1 / upgradeChanceDivisor` chance
 * to be bumped up one rarity tier. `0` (default) disables tier upgrades.
 *
 * @privateRemarks
 * The `waveIndex` parameter currently only exists to assign black hole on X000 waves,
 * but can be used for any other wave-specific items if needed.
 */
export function assignEnemyHeldItemsForWave(
  waveIndex: number,
  count: number,
  enemy: EnemyPokemon,
  poolType: HeldItemPoolType.WILD | HeldItemPoolType.TRAINER,
  upgradeChanceDivisor = 0,
): void {
  const existingItemCount = enemy.heldItemManager.getItemCount();
  count -= existingItemCount;
  if (count <= 0) {
    return;
  }

  for (let i = 0; i < count; i++) {
    const upgraded = upgradeChanceDivisor > 0 && randSeedInt(upgradeChanceDivisor) === 0 ? 1 : 0;
    const item = getNewHeldItemFromTieredPool(getHeldItemPool(poolType), enemy, upgraded);
    if (item) {
      enemy.heldItemManager.add(item);
    }
  }

  if (!(waveIndex % 1000)) {
    enemy.heldItemManager.add(HeldItemId.MINI_BLACK_HOLE);
  }
}

function getNewHeldItemFromTieredPool(
  pool: HeldItemTieredPool,
  pokemon: Pokemon,
  upgradeCount: number,
): HeldItemId | HeldItemSpecs | null {
  const tierPool = determineItemPool(pool, upgradeCount);
  return getNewHeldItemFromPool(tierPool, pokemon);
}

function determineItemPool(pool: HeldItemTieredPool, upgradeCount: number): HeldItemPool {
  const tier = Phaser.Math.Clamp(getRandomTier() + upgradeCount, RarityTier.COMMON, RarityTier.MASTER) as RarityTier;
  return pool[tier];
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
  if (tierValue > 0) {
    return RarityTier.ROGUE;
  }
  return RarityTier.MASTER;
}

export function assignItemsFromConfiguration(config: HeldItemConfiguration, pokemon: Pokemon) {
  for (const { entry, count } of config) {
    const actualCount = typeof count === "function" ? count() : (count ?? 1);

    if (typeof entry === "number") {
      if (isCategoryId(entry)) {
        assignItemsFromCategory(entry, pokemon, actualCount);
      } else {
        pokemon.heldItemManager.add(entry, actualCount);
      }
      continue;
    }

    if (isHeldItemSpecs(entry)) {
      pokemon.heldItemManager.add(entry);
      continue;
    }

    // TODO: Overly permissive type - this should not be able to take a HeldItemCategoryEntry if
    // the result would be analogous to passing the category directly
    if (isHeldItemCategoryEntry(entry)) {
      assignItemsFromCategory(entry.id, pokemon, actualCount);
      continue;
    }

    entry satisfies HeldItemPool;
    for (let i = 0; i < actualCount; i++) {
      const newItem = getNewHeldItemFromPool(entry, pokemon);
      if (newItem) {
        pokemon.heldItemManager.add(newItem);
      }
    }
  }
}

function assignItemsFromCategory(id: HeldItemCategoryId, pokemon: Pokemon, count: number) {
  for (let i = 0; i < count; i++) {
    const newItem = getNewHeldItemFromCategory(id, pokemon, undefined, pokemon);
    if (newItem) {
      pokemon.heldItemManager.add(newItem);
    }
  }
}

// TODO: Explain what this function returning `null` even means,
// and whether it should be allowed to accept invalid categories at all
// (possibly tightening the kind of item categories placeable inside pools as a result)
export function getNewHeldItemFromCategory(
  id: HeldItemCategoryId,
  pokemon: Pokemon | Pokemon[],
  customWeights: HeldItemWeights = {},
  target?: Pokemon,
): HeldItemId | null {
  switch (id) {
    case HeldItemCategoryId.BERRY:
      return getNewBerryHeldItem(customWeights, target);
    case HeldItemCategoryId.VITAMIN:
      return getNewVitaminHeldItem(customWeights, target);
    case HeldItemCategoryId.TYPE_ATTACK_BOOSTER:
      return getNewAttackTypeBoosterHeldItem(pokemon, customWeights, target);
    default:
      return null;
  }
}

export function getNewVitaminHeldItem(customWeights: HeldItemWeights = {}, target?: Pokemon): HeldItemId {
  const items = PERMANENT_STATS.map(s => permanentStatToHeldItem[s]);
  const weights = items.map(t => (target?.heldItemManager.isMaxStack(t) ? 0 : (customWeights[t] ?? 1)));

  const pickedIndex = pickWeightedIndex(weights);
  return items[pickedIndex];
}

export function getNewBerryHeldItem(customWeights: HeldItemWeights = {}, target?: Pokemon): BerryItemId {
  const items = Object.values(berryTypeToHeldItem) as unknown as NonEmptyTuple<BerryItemId>;

  const weights = items.map(t =>
    target?.heldItemManager.isMaxStack(t)
      ? 0
      : (customWeights[t]
          ?? (t === HeldItemId.SITRUS_BERRY || t === HeldItemId.LUM_BERRY || t === HeldItemId.LEPPA_BERRY))
        ? 2
        : 1,
  );

  const pickedIndex = pickWeightedIndex(weights);
  return items[pickedIndex];
}

export function getNewAttackTypeBoosterHeldItem(
  pokemon: Pokemon | Pokemon[],
  customWeights: HeldItemWeights = {},
  target?: Pokemon,
): HeldItemId | null {
  const party = coerceArray(pokemon);

  const attackMoveTypes = party
    .values()
    .flatMap(p =>
      p
        .getMoveset()
        .filter(pm => pm.getMove().is("AttackMove"))
        .map(pm => p.getMoveType(pm.getMove()))
        .filter(type => type !== PokemonType.UNKNOWN && type !== PokemonType.STELLAR),
    )
    .toArray();

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

  // guaranteed to be safe, since above map is nonempty
  const types = attackMoveTypeWeights.keys().toArray() as unknown as NonEmptyTuple<RegularPokemonType>;

  const weights = types.map(type =>
    target?.heldItemManager.isMaxStack(attackTypeToHeldItem[type])
      ? 0
      : (customWeights[attackTypeToHeldItem[type]] ?? attackMoveTypeWeights.get(type)!),
  );

  const pickedIndex = pickWeightedIndex(weights);
  return attackTypeToHeldItem[types[pickedIndex]];
}

function getNewHeldItemFromPool(
  pool: HeldItemPool,
  pokemon: Pokemon,
  party?: Pokemon[],
): HeldItemId | HeldItemSpecs | null {
  const weights = getPoolWeights(pool, pokemon);

  const pickedIndex = pickWeightedIndex(weights);
  const { entry } = pool[pickedIndex];

  if (typeof entry === "number") {
    if (isCategoryId(entry)) {
      // TODO: This is the only thing that can return `null` directly;
      // we should simply make held item pools unable to contain values that would result in a failed input

      return getNewHeldItemFromCategory(entry, party ?? pokemon, {}, pokemon);
    }
    return entry;
  }

  if (isHeldItemPool(entry)) {
    return getNewHeldItemFromPool(entry, pokemon, party);
  }

  if (isHeldItemCategoryEntry(entry)) {
    return getNewHeldItemFromCategory(entry.id, party ?? pokemon, entry.customWeights, pokemon);
  }

  return entry satisfies HeldItemSpecs;
}

function getPoolWeights(pool: HeldItemPool, pokemon: Pokemon): NonEmptyTuple<number> {
  return pool.map(p => {
    const weight = typeof p.weight === "function" ? p.weight(pokemon) : p.weight;

    // filter out items at max stack count
    if (typeof p.entry === "number" && !isCategoryId(p.entry) && pokemon.heldItemManager.isMaxStack(p.entry)) {
      return 0;
    }

    return weight;
  });
}

// TODO: Handle form change items
// TODO: This is duplicated from `HeldItemManager.generateSaveData` - should be a single source of truth
export function saveDataToConfig(saveData: HeldItemSaveData): HeldItemConfiguration {
  return saveData.map(specs => ({ entry: specs, count: 1 }));
}
