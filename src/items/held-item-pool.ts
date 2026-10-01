import {
  type GeneratableHeldItemCategoryId,
  generatableCategoryItems,
  HeldItemCategoryId,
  HeldItemId,
} from "#enums/held-item-id";
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
  AnyHeldItemRoll,
  HeldItemConfiguration,
  HeldItemCustomWeights,
  HeldItemExclusionList,
  HeldItemPool,
  HeldItemPoolEntry,
  HeldItemResolvedWeights,
  HeldItemWeight,
} from "#types/held-item-data-types";
import { randSeedInt } from "#utils/common";
import { isCategoryId, isHeldItemPool, isItemInCategory, isItemInRequested } from "#utils/item-utils";
import { weightedPick } from "#utils/random";
import type { NonEmptyTuple } from "type-fest";

/** `LUXURY` is never rolled for held item pools. */
type PoolRarityTier = Exclude<RarityTier, RarityTier.LUXURY>;

/**
 * A default pool of held items, organized by tier.
 * Used to generate items for enemy trainers, wild Pokemon and daily run starters.
 */
type HeldItemTieredPool = Readonly<Record<PoolRarityTier, HeldItemPool>>;

export const wildHeldItemPool = {} as HeldItemTieredPool;

export const trainerHeldItemPool = {} as HeldItemTieredPool;

export const dailyStarterHeldItemPool = {} as HeldItemTieredPool;

// #region Initialization

/**
 * Initialize the wild held item pool
 */
function initWildHeldItemPool() {
  Object.assign(wildHeldItemPool, {
    [RarityTier.COMMON]: [{ entry: HeldItemCategoryId.BERRY, weight: 1 }],
    [RarityTier.GREAT]: [{ entry: HeldItemCategoryId.VITAMIN, weight: 1 }],
    [RarityTier.ULTRA]: [
      { entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 5 },
      { entry: HeldItemId.WHITE_HERB, weight: 0 },
    ],
    [RarityTier.ROGUE]: [{ entry: HeldItemId.LUCKY_EGG, weight: 4 }],
    [RarityTier.MASTER]: [{ entry: HeldItemId.GOLDEN_EGG, weight: 1 }],
  } satisfies HeldItemTieredPool);
}

/**
 * Initialize the trainer pokemon held item pool
 */
function initTrainerHeldItemPool() {
  Object.assign(trainerHeldItemPool, {
    [RarityTier.COMMON]: [
      { entry: HeldItemCategoryId.BERRY, weight: 8 },
      { entry: HeldItemCategoryId.VITAMIN, weight: 3 },
    ],
    [RarityTier.GREAT]: [{ entry: HeldItemCategoryId.VITAMIN, weight: 3 }],
    [RarityTier.ULTRA]: [
      { entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 10 },
      { entry: HeldItemId.WHITE_HERB, weight: 0 },
    ],
    [RarityTier.ROGUE]: [
      { entry: HeldItemId.FOCUS_BAND, weight: 2 },
      { entry: HeldItemId.LUCKY_EGG, weight: 4 },
      { entry: HeldItemId.QUICK_CLAW, weight: 1 },
      { entry: HeldItemId.GRIP_CLAW, weight: 1 },
      { entry: HeldItemId.WIDE_LENS, weight: 1 },
    ],
    [RarityTier.MASTER]: [
      { entry: HeldItemId.KINGS_ROCK, weight: 1 },
      { entry: HeldItemId.LEFTOVERS, weight: 1 },
      { entry: HeldItemId.SHELL_BELL, weight: 1 },
      { entry: HeldItemId.SCOPE_LENS, weight: 1 },
    ],
  } satisfies HeldItemTieredPool);
}

/**
 * Initialize the daily starter held item pool
 */
function initDailyStarterRewardPool(): void {
  Object.assign(dailyStarterHeldItemPool, {
    [RarityTier.COMMON]: [
      { entry: HeldItemCategoryId.VITAMIN, weight: 1 },
      { entry: HeldItemCategoryId.BERRY, weight: 3 },
    ],
    [RarityTier.GREAT]: [{ entry: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 5 }],
    [RarityTier.ULTRA]: [
      { entry: HeldItemId.REVIVER_SEED, weight: 4 },
      { entry: HeldItemId.SOOTHE_BELL, weight: 1 },
      { entry: HeldItemId.SOUL_DEW, weight: 1 },
      { entry: HeldItemId.GOLDEN_PUNCH, weight: 1 },
    ],
    [RarityTier.ROGUE]: [
      { entry: HeldItemId.GRIP_CLAW, weight: 5 },
      { entry: HeldItemId.BATON, weight: 2 },
      { entry: HeldItemId.FOCUS_BAND, weight: 5 },
      { entry: HeldItemId.QUICK_CLAW, weight: 3 },
      { entry: HeldItemId.KINGS_ROCK, weight: 3 },
    ],
    [RarityTier.MASTER]: [
      { entry: HeldItemId.LEFTOVERS, weight: 1 },
      { entry: HeldItemId.SHELL_BELL, weight: 1 },
    ],
  } satisfies HeldItemTieredPool);
}

/**
 * Initialize all default held item pools ({@linkcode wildHeldItemPool}, {@linkcode trainerHeldItemPool}
 * and {@linkcode dailyStarterHeldItemPool}).
 */
export function initHeldItemPools(): void {
  initWildHeldItemPool();
  initTrainerHeldItemPool();
  initDailyStarterRewardPool();
}

// #endregion Initialization

/**
 * Assign 3 randomly generated held items to each Pokemon in a daily run starter party.
 * @param party - The party of {@linkcode PlayerPokemon} to receive the items
 */
export function assignDailyRunStarterHeldItems(party: PlayerPokemon[]): void {
  const DAILY_RUN_ITEMS_PER_POKEMON = 3;
  const pool = getHeldItemPool(HeldItemPoolType.DAILY_STARTER);
  for (const p of party) {
    for (let m = 0; m < DAILY_RUN_ITEMS_PER_POKEMON; m++) {
      const tier = getDailyRarityTier();
      assignItemsFromPool(pool[tier], p, party);
    }
  }
}

/**
 * Generate a random item rarity for a daily run starter held item.
 * @returns The corresponding rarity tier to be used.
 */
function getDailyRarityTier(): PoolRarityTier {
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

/**
 * Get the default tiered pool for a given pool type.
 * @param poolType - The {@linkcode HeldItemPoolType} to retrieve
 * @returns The corresponding {@linkcode HeldItemTieredPool}
 */
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
 * Randomly generate held items from a pool and assign them to an enemy Pokemon.
 * @param count - Max number of held items the enemy should end up holding (including existing items)
 * @param enemy - The {@linkcode EnemyPokemon} to receive the items
 * @param poolType - Which {@linkcode HeldItemPoolType | tiered pool} to draw from (Wild or Trainer)
 * @param upgradeChanceDivisor - (Default `0`) If `> 0`, each generated item has a `1 / upgradeChanceDivisor` chance
 * to be bumped up one rarity tier.
 */
export function generateEnemyPokemonHeldItems(
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

  const tieredPool = getHeldItemPool(poolType);
  for (let i = 0; i < count; i++) {
    const upgraded = upgradeChanceDivisor > 0 && randSeedInt(upgradeChanceDivisor) === 0 ? 1 : 0;
    assignItemsFromPool(determineItemPool(tieredPool, upgraded), enemy);
  }
}

/**
 * Roll a random rarity tier, apply any upgrades, and return that tier's {@linkcode HeldItemPool}.
 * @param pool - The {@linkcode HeldItemTieredPool} to draw from
 * @param upgradeCount - The number of rarity tiers to bump the rolled tier up by
 * @returns The {@linkcode HeldItemPool} for the resulting tier
 */
function determineItemPool(pool: HeldItemTieredPool, upgradeCount: number): HeldItemPool {
  const tier = Phaser.Math.Clamp(
    getRandomTier() + upgradeCount,
    RarityTier.COMMON,
    RarityTier.MASTER,
  ) as PoolRarityTier;
  return pool[tier];
}

/**
 * Generate a random item rarity for a wild or trainer held item.
 *
 * Probability distribution (out of 1024):
 * - Common: 768/1024 (~75.00%)
 * - Great:  195/1024 (~19.04%)
 * - Ultra:   48/1024 (~4.69%)
 * - Rogue:   12/1024 (~1.17%)
 * - Master:   1/1024 (~0.098%)
 *
 * @returns The rarity tier
 */
function getRandomTier(): PoolRarityTier {
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

/**
 * Grant every entry of a {@linkcode HeldItemConfiguration} to a Pokemon.
 * @param config - The configuration to grant
 * @param pokemon - The Pokemon receiving the item(s)
 * @param party - The party of the side receiving the items (influences rolls like type boosters)
 */
export function assignItemsFromConfiguration(config: HeldItemConfiguration, pokemon: Pokemon, party?: Pokemon[]): void {
  for (const entry of config) {
    assignItemsFromEntry(entry, pokemon, party);
  }
}

/**
 * Pick one weighted entry from a {@linkcode HeldItemPool} and grant it to a Pokemon.
 * @param pool - The pool to pick from
 * @param pokemon - The Pokemon receiving the item(s)
 * @param party - The party of the side receiving the items (influences rolls like type boosters)
 */
export function assignItemsFromPool(pool: HeldItemPool, pokemon: Pokemon, party?: Pokemon[]): void {
  assignItemsFromEntry(pickPoolEntry(pool, pokemon), pokemon, party);
}

/**
 * Resolve a single roll and grant the result to a Pokemon.
 * @param roll - The {@linkcode AnyHeldItemRoll} to resolve
 * @param pokemon - The Pokemon receiving the item(s)
 * @param party - The party of the side receiving the items (influences rolls like type boosters)
 * @throws Error - If the roll's `exclude` list removes every entry from a pool
 *
 * @remarks
 * Resolution depends on the kind of `entry`:
 * - A specific item is added `count` times.
 * - A category is rolled `count` times independently, using its resolved weights and exclusions.
 * - A pool is filtered by its exclusions, then has an entry picked and resolved `count` times.
 */
function assignItemsFromEntry(roll: AnyHeldItemRoll, pokemon: Pokemon, party?: Pokemon[]): void {
  const { entry, count = 1, customWeights, exclude = [] } = roll;

  if (typeof entry === "number" && !isCategoryId(entry)) {
    pokemon.heldItemManager.add(entry, count);
    return;
  }

  if (typeof entry === "number") {
    for (let i = 0; i < count; i++) {
      const resolved = resolveCategoryWeights(entry, pokemon, customWeights, exclude);
      pokemon.heldItemManager.add(getNewHeldItemFromCategory(entry, pokemon, party, resolved));
    }
    return;
  }

  const pool = excludeFromPool(entry, exclude);
  if (pool == null) {
    // Exclusions should never leave a completely empty pool, so reaching this
    // means there's a misconfiguration. If we want we could have this return
    // a generic fallback instead, but that would mask the error more.
    throw new Error("Empty held item pool");
  }
  for (let i = 0; i < count; i++) {
    assignItemsFromEntry(pickPoolEntry(pool, pokemon), pokemon, party);
  }
}

/**
 * Evaluate a {@linkcode HeldItemWeight} for a given Pokemon.
 * @param weight - The weight to evaluate
 * @param pokemon - The Pokemon passed to weight functions
 * @returns The numeric weight
 */
function resolveWeight(weight: HeldItemWeight, pokemon: Pokemon): number {
  return typeof weight === "function" ? weight(pokemon) : weight;
}

/**
 * Merge a category entry's `weights` and `exclude` into plain numeric weights
 * for {@linkcode getNewHeldItemFromCategory}.
 * @param category - The category being rolled
 * @param pokemon - The Pokemon passed to weight functions
 * @param weights - The entry's custom weights
 * @param exclusions - The entry's exclusions (overrides weights to 0)
 * @returns The resolved {@linkcode HeldItemResolvedWeights}
 */
function resolveCategoryWeights(
  category: GeneratableHeldItemCategoryId,
  pokemon: Pokemon,
  weights: HeldItemCustomWeights = {},
  exclusions: HeldItemExclusionList = [],
): HeldItemResolvedWeights {
  const resolved: HeldItemResolvedWeights = {};
  for (const id of generatableCategoryItems[category]) {
    if (exclusions.includes(id)) {
      resolved[id] = 0;
      continue;
    }
    const weight = weights[id];
    if (weight != null) {
      resolved[id] = resolveWeight(weight, pokemon);
    }
  }
  return resolved;
}

// TODO I would put this in a util file, but it's an awkward function.
// It asserts its result to be compatible with NonEmptyTuple, but can't predicate directly to that type because of readonlyness
function isNonEmpty<T>(arr: readonly T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

/**
 * Apply an exclusion list to a pool.
 * - Entries for an excluded item or category, or for an item whose category is excluded, are removed.
 * - Excluded items are forwarded to the `exclude` list of category entries they belong to.
 * @param pool - The pool to filter
 * @param exclusions - The items and/or categories to exclude
 * @returns The filtered pool, or `undefined` if no entries remain
 */
export function excludeFromPool(pool: HeldItemPool, exclusions: HeldItemExclusionList): HeldItemPool | undefined {
  if (exclusions.length === 0) {
    return pool;
  }

  const filtered: HeldItemPoolEntry[] = [];
  for (const poolEntry of pool) {
    const { entry } = poolEntry;

    if (isHeldItemPool(entry)) {
      const filteredNestedPool = excludeFromPool(entry, exclusions);
      if (filteredNestedPool) {
        // TS loses context with the spread, but the assertion is clearly correct here
        filtered.push({ ...poolEntry, entry: filteredNestedPool } as HeldItemPoolEntry);
      }
      continue;
    }

    if (isItemInRequested(entry, exclusions)) {
      continue;
    }
    if (!isCategoryId(entry)) {
      filtered.push(poolEntry);
      continue;
    }

    const forwarded = exclusions.filter(id => !isCategoryId(id) && isItemInCategory(id, entry));
    if (forwarded.length === 0) {
      filtered.push(poolEntry);
      continue;
    }
    // forwarded contains only items belonging to `entry`'s category (checked by isItemInCategory)
    filtered.push({ ...poolEntry, exclude: [...(poolEntry.exclude ?? []), ...forwarded] } as HeldItemPoolEntry);
  }

  return isNonEmpty(filtered) ? filtered : undefined;
}

/**
 * Generate a new held item from the provided category
 * @param id - The id of the category to generate from
 * @param target - The pokemon receiving the item (to check max stacks, etc.)
 * @param party - The party of the side receiving the item (used for type boosters)
 * @param customWeights - Custom weights to use when generating the item
 * @returns - The {@linkcode HeldItemId} of the chosen item
 *
 * @remarks
 * The `target` and `party` parameters are used only for determining what item to generate
 * (i.e. the item is not automatically given to `target`). To generate an item only considering the target,
 * leave `party` empty. It is safe (deduplicated) to pass a target and party containing the target.
 */
export function getNewHeldItemFromCategory(
  id: GeneratableHeldItemCategoryId,
  target: Pokemon,
  party: Pokemon[] = [],
  customWeights: HeldItemResolvedWeights = {},
): HeldItemId {
  const unifiedParty = party.includes(target) ? [...party] : [target, ...party];

  switch (id) {
    case HeldItemCategoryId.BERRY:
      return getNewBerryHeldItem(customWeights, target);
    case HeldItemCategoryId.VITAMIN:
      return getNewVitaminHeldItem(customWeights, target);
    case HeldItemCategoryId.TYPE_ATTACK_BOOSTER:
      return getNewAttackTypeBoosterHeldItem(target, unifiedParty, customWeights);
  }
}

/**
 * Generate a new vitamin held item.
 * @param customWeights - Custom weights to use when generating the item (unlisted vitamins have weight 1)
 * @param target - The pokemon receiving the item (vitamins already at max stack have weight 0)
 * @returns The {@linkcode HeldItemId} of the chosen vitamin
 */
export function getNewVitaminHeldItem(customWeights: HeldItemResolvedWeights = {}, target?: Pokemon): HeldItemId {
  const items = PERMANENT_STATS.map(s => permanentStatToHeldItem[s]);
  const weights = items.map(t => (target?.heldItemManager.isMaxStack(t) ? 0 : (customWeights[t] ?? 1)));

  const itemMap = new Map<HeldItemId, number>();
  for (const [index, entry] of items.entries()) {
    itemMap.set(entry, weights[index]);
  }
  return weightedPick(itemMap);
}

/**
 * Generate a new berry held item.
 * @param customWeights - Custom weights to use when generating the item
 * @param target - The pokemon receiving the item (berries already at max stack have weight 0)
 * @returns The {@linkcode BerryItemId} of the chosen berry
 *
 * @remarks
 * Unlisted berries have a weight of `2` for Sitrus, Lum and Leppa berries and `1` otherwise.
 */
export function getNewBerryHeldItem(customWeights: HeldItemResolvedWeights = {}, target?: Pokemon): BerryItemId {
  const itemMap = new Map<BerryItemId, number>();
  for (const item of Object.values(berryTypeToHeldItem)) {
    if (target?.heldItemManager.isMaxStack(item)) {
      itemMap.set(item, 0);
      continue;
    }
    const isPreferredBerry =
      item === HeldItemId.SITRUS_BERRY || item === HeldItemId.LUM_BERRY || item === HeldItemId.LEPPA_BERRY;
    itemMap.set(item, customWeights[item] ?? (isPreferredBerry ? 2 : 1));
  }
  return weightedPick(itemMap);
}

/**
 * Generate a new type-boosting held item based on the attack types in a party's movesets.
 * @param target - The pokemon receiving the item (boosters already at max stack have weight 0)
 * @param party - The party of the side receiving the item, whose attack move types are considered
 * @param customWeights - Custom weights to use when generating the item
 * @returns The {@linkcode HeldItemId} of the chosen type booster
 *
 * @remarks
 * Each type's default weight is the number of matching attack moves in the party, capped at `3`.
 * {@linkcode PokemonType.UNKNOWN | UNKNOWN} and {@linkcode PokemonType.STELLAR | STELLAR} moves are ignored.
 * If the party has no eligible attack moves, the {@linkcode PokemonType.NORMAL | NORMAL} booster is returned.
 */
export function getNewAttackTypeBoosterHeldItem(
  target?: Pokemon,
  party: Pokemon[] = [],
  customWeights: HeldItemResolvedWeights = {},
): HeldItemId {
  const attackMoveTypes = party
    .values()
    .flatMap(p =>
      p
        .getMoveset()
        .filter(pm => pm.getMove().is("AttackMove"))
        .map(pm => p.getMoveType(pm.getMove()))
        .filter((type): type is RegularPokemonType => type !== PokemonType.UNKNOWN && type !== PokemonType.STELLAR),
    )
    .toArray();

  const attackMoveTypeWeights = new Map<RegularPokemonType, number>();
  for (const type of attackMoveTypes) {
    attackMoveTypeWeights.set(type, Math.min((attackMoveTypeWeights.get(type) ?? 0) + 1, 3));
  }

  if (attackMoveTypeWeights.size === 0) {
    // Fallback to avoid bubbling `null` through the entire item generation chain
    return attackTypeToHeldItem[PokemonType.NORMAL];
  }

  const typeMap = new Map<RegularPokemonType, number>();
  for (const [type, count] of attackMoveTypeWeights) {
    const item = attackTypeToHeldItem[type];
    typeMap.set(type, target?.heldItemManager.isMaxStack(item) ? 0 : (customWeights[item] ?? count));
  }
  return attackTypeToHeldItem[weightedPick(typeMap)];
}

/**
 * Pick one weighted entry from a pool, without resolving it.
 * @param pool - The pool to pick from
 * @param pokemon - The Pokemon the pick is for (used for weight functions and max stack filtering)
 * @returns The picked {@linkcode HeldItemPoolEntry}
 */
function pickPoolEntry(pool: HeldItemPool, pokemon: Pokemon): HeldItemPoolEntry {
  const weights = getPoolWeights(pool, pokemon);

  const poolMap = new Map<HeldItemPoolEntry, number>();
  for (const [index, entry] of pool.entries()) {
    poolMap.set(entry, weights[index]);
  }
  return weightedPick(poolMap);
}

/**
 * Compute the effective weights of a pool's entries for a given Pokemon.
 *
 * @remarks
 * Entries for specific items already at max stack are weighted `0`.
 * Categories are not filtered here (they handle max stacks internally),
 * and `count > 1` entries may still overflow the stack limit.
 */
function getPoolWeights(pool: HeldItemPool, pokemon: Pokemon): NonEmptyTuple<number> {
  return pool.map(({ entry, weight }) => {
    // filter out items at max stack count
    if (!isHeldItemPool(entry) && !isCategoryId(entry) && pokemon.heldItemManager.isMaxStack(entry)) {
      return 0;
    }
    return resolveWeight(weight, pokemon);
  });
}
