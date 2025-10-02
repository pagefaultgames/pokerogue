import { globalScene } from "#app/global-scene";
import { speciesEggMoves } from "#balance/egg-moves";
import {
  BASE_LEVEL_WEIGHT_OFFSET,
  BASE_WEIGHT_MULTIPLIER,
  BOSS_EXTRA_WEIGHT_MULTIPLIER,
  COMMON_TIER_TM_LEVEL_REQUIREMENT,
  COMMON_TM_MOVESET_WEIGHT,
  EGG_MOVE_LEVEL_REQUIREMENT,
  EGG_MOVE_TO_LEVEL_WEIGHT,
  EGG_MOVE_WEIGHT_MAX,
  EVOLUTION_MOVE_WEIGHT,
  GREAT_TIER_TM_LEVEL_REQUIREMENT,
  GREAT_TM_MOVESET_WEIGHT,
  getMaxEggMoveCount,
  getMaxTmCount,
  RARE_EGG_MOVE_LEVEL_REQUIREMENT,
  STAB_BLACKLIST,
  ULTRA_TIER_TM_LEVEL_REQUIREMENT,
  ULTRA_TM_MOVESET_WEIGHT,
} from "#balance/moveset-generation";
import { EVOLVE_MOVE, RELEARN_MOVE } from "#balance/pokemon-level-moves";
import { speciesTmMoves, tmPoolTiers } from "#balance/tms";
import { allMoves } from "#data/data-lists";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveCategory } from "#enums/move-category";
import type { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { EnemyPokemon, Pokemon } from "#field/pokemon";
import { PokemonMove } from "#moves/pokemon-move";
import { NumberHolder, randSeedInt } from "#utils/common";
import { willTerastallize } from "#utils/pokemon-utils";
import { isBeta } from "#utils/utility-vars";

/**
 * Compute and assign a weight to the level-up moves currently available to the Pokémon
 *
 * @param pokemon - The Pokémon to generate a level-based move pool for
 * @returns A map of move IDs to their computed weights
 *
 * @remarks
 * A move's weight is determined by its level, as follows:
 * 1. If the level is an {@linkcode EVOLVE_MOVE} move, weight is 60
 * 2. If it is level 1 with 80+ BP, it is considered a "move reminder" move and
 *    weight is 60
 * 3. If the Pokémon has a trainer and the move is a {@linkcode RELEARN_MOVE},
 *    weight is 60
 * 4. Otherwise, weight is the earliest level the move can be learned + 20
 */
function getAndWeightLevelMoves(pokemon: Pokemon): Map<MoveId, number> {
  const movePool = new Map<MoveId, number>();
  let allLevelMoves: [number, MoveId][];
  // TODO: Investigate why there needs to be error handling here
  try {
    allLevelMoves = pokemon.getLevelMoves(1, true, true, pokemon.hasTrainer());
  } catch (e) {
    console.warn("Error encountered trying to generate moveset for %s: %s", pokemon.species.name, e);
    return movePool;
  }

  const level = pokemon.level;
  const hasTrainer = pokemon.hasTrainer();

  for (const levelMove of allLevelMoves) {
    const [learnLevel, id] = levelMove;
    if (level < learnLevel) {
      break;
    }
    const move = allMoves[id];
    // Skip unimplemented moves or moves that are already in the pool
    if (move.name.endsWith(" (N)") || movePool.has(id)) {
      continue;
    }

    let weight = learnLevel + BASE_LEVEL_WEIGHT_OFFSET;
    switch (learnLevel) {
      case EVOLVE_MOVE:
        weight = EVOLUTION_MOVE_WEIGHT;
        break;
      // Assume level 1 moves with 80+ BP are "move reminder" moves and bump their weight. Trainers use actual relearn moves.
      case 1:
        if (move.power >= 80) {
          weight = 60;
        }
        break;
      case RELEARN_MOVE:
        if (hasTrainer) {
          weight = 60;
        }
    }

    movePool.set(id, weight);
  }

  return movePool;
}

/**
 * Determine which TM tiers a Pokémon can learn based on its level
 * @param level - The level of the Pokémon
 * @returns A tuple indicating whether the Pokémon can learn common, great, and ultra tier TMs
 */
function getAllowedTmTiers(level: number): [common: boolean, great: boolean, ultra: boolean] {
  return [
    level >= COMMON_TIER_TM_LEVEL_REQUIREMENT,
    level >= GREAT_TIER_TM_LEVEL_REQUIREMENT,
    level >= ULTRA_TIER_TM_LEVEL_REQUIREMENT,
  ];
}

/**
 * Get the TMs that a species can learn based on its ID and formKey
 * @param speciesId - The species ID of the Pokémon
 * @param level - The level of the Pokémon
 * @param formKey - The form key of the Pokémon
 * @param levelPool - The current level-based move pool, to avoid duplicates
 * @param tmPool - The TM move pool to add to, which will be modified in place
 * @param allowedTiers - The tiers of TMs the Pokémon is allowed to learn
 *
 * @privateRemarks
 * Split out from `getAndWeightTmMoves` to allow fusion species to add their TMs
 * without duplicating code.
 */
function getTmPoolForSpecies(
  speciesId: number,
  level: number,
  formKey: string,
  levelPool: ReadonlyMap<MoveId, number>,
  eggPool: ReadonlyMap<MoveId, number>,
  tmPool: Map<MoveId, number>,
  allowedTiers = getAllowedTmTiers(level),
): void {
  const [allowCommon, allowGreat, allowUltra] = allowedTiers;
  const tms = speciesTmMoves[speciesId];
  // Species with no learnable TMs (e.g. Ditto) don't have entries in the `speciesTmMoves` object,
  // so this is needed to avoid iterating over `undefined`
  if (tms == null) {
    return;
  }

  let moveId: MoveId;
  for (const tm of tms) {
    if (Array.isArray(tm)) {
      if (tm[0] !== formKey) {
        continue;
      }
      moveId = tm[1];
    } else {
      moveId = tm;
    }

    if (levelPool.has(moveId) || eggPool.has(moveId) || tmPool.has(moveId)) {
      continue;
    }
    switch (tmPoolTiers[moveId]) {
      case ModifierTier.COMMON:
        allowCommon && tmPool.set(moveId, COMMON_TM_MOVESET_WEIGHT);
        break;
      case ModifierTier.GREAT:
        allowGreat && tmPool.set(moveId, GREAT_TM_MOVESET_WEIGHT);
        break;
      case ModifierTier.ULTRA:
        allowUltra && tmPool.set(moveId, ULTRA_TM_MOVESET_WEIGHT);
        break;
    }
  }
}

/**
 * Compute and assign a weight to the TM moves currently available to the Pokémon
 * @param pokemon - The Pokémon to generate a TM-based move pool for
 * @param currentSet - The current movepool, to avoid duplicates
 * @param tmPool - The TM move pool to add to, which will be modified in place
 * @returns A map of move IDs to their computed weights
 *
 * @remarks
 * Only trainer pokemon can learn TM moves, and there are restrictions
 * as to how many and which TMs are available based on the level of the Pokémon.
 * 1. Before level 25, no TM moves are available
 * 2. Between levels 25 and 40, only COMMON tier TMs are available,
 */
function getAndWeightTmMoves(
  pokemon: Pokemon,
  currentPool: ReadonlyMap<MoveId, number>,
  eggPool: ReadonlyMap<MoveId, number>,
  tmPool: Map<MoveId, number>,
): void {
  const level = pokemon.level;
  const allowedTiers = getAllowedTmTiers(level);
  if (!allowedTiers.includes(true)) {
    return;
  }

  const form = pokemon.species.forms[pokemon.formIndex]?.formKey ?? "";
  getTmPoolForSpecies(pokemon.species.speciesId, level, form, currentPool, eggPool, tmPool, allowedTiers);
  const fusionFormKey = pokemon.getFusionFormKey();
  const fusionSpecies = pokemon.fusionSpecies?.speciesId;
  if (fusionSpecies != null && fusionFormKey != null && fusionFormKey !== "") {
    getTmPoolForSpecies(fusionSpecies, level, fusionFormKey, currentPool, eggPool, tmPool, allowedTiers);
  }
}

/**
 * Get the weight multiplier for an egg move
 * @param levelPool - Map of level up moves to their weights
 * @param level - The level of the Pokémon
 * @param forRare - Whether this is for a rare egg move
 * @param isBoss - Whether the Pokémon having the egg move generated is a boss Pokémon
 */
export function getEggMoveWeight(
  // biome-ignore-start lint/correctness/noUnusedFunctionParameters: Saved to allow this algorithm to be tweaked easily without adjusting signatures
  levelPool: ReadonlyMap<MoveId, number>,
  level: number,
  forRare: boolean,
  isBoss: boolean,
  // biome-ignore-end lint/correctness/noUnusedFunctionParameters: Endrange
): number {
  const levelUpWeightedEggMoveWeight = Math.round(Math.max(...levelPool.values()) * EGG_MOVE_TO_LEVEL_WEIGHT);
  // Rare egg moves are always weighted at 5/6 the weight of normal egg moves
  return Math.min(levelUpWeightedEggMoveWeight, EGG_MOVE_WEIGHT_MAX) * (forRare ? 5 / 6 : 1);
}

/**
 * Submethod of {@linkcode getAndWeightEggMoves} that adds egg moves for a specific species to the egg move pool
 *
 * @param rootSpeciesId - The ID of the root species for which to generate the egg move pool.
 * @param levelPool - A readonly map of move IDs to their levels, representing moves already learned by leveling up.
 * @param eggPool - A map to be populated with egg move IDs and their corresponding weights.
 * @param eggMoveWeight - The default weight to assign to regular egg moves.
 * @param excludeRare - If true, excludes rare egg moves
 * @param rareEggMoveWeight - The weight to assign to rare egg moves; default 0
 *
 * @privateRemarks
 * Split from `getAndWeightEggMoves` to allow fusion species to add their egg moves without duplicating code.
 *
 * @remarks
 * - Moves present in `levelPool` are excluded from the egg pool.
 * - If `excludeRare` is true, rare egg moves (at index 3) are skipped.
 * - Rare egg moves are assigned `rareEggMoveWeight`, while others receive `eggMoveWeight`.
 */
function getEggPoolForSpecies(
  rootSpeciesId: SpeciesId,
  levelPool: ReadonlyMap<MoveId, number>,
  eggPool: Map<MoveId, number>,
  eggMoveWeight: number,
  excludeRare: boolean,
  rareEggMoveWeight = 0,
): void {
  const eggMoves = speciesEggMoves[rootSpeciesId];
  if (eggMoves == null) {
    return;
  }
  for (const [idx, moveId] of eggMoves.entries()) {
    if (levelPool.has(moveId) || (idx === 3 && excludeRare)) {
      continue;
    }
    eggPool.set(Math.max(moveId, eggPool.get(moveId) ?? 0), idx === 3 ? rareEggMoveWeight : eggMoveWeight);
  }
}

/**
 * Compute and assign a weight to the egg moves currently available to the Pokémon
 * @param pokemon - The Pokémon to generate egg moves for
 * @param levelPool - The map of level-based moves to their weights
 * @param eggPool - A map of move IDs to their weights for egg moves that will be modified in place
 *
 * @remarks
 * This function checks if the Pokémon meets the requirements to learn egg moves,
 * and if allowed, calculates the weights for regular and rare egg moves using the provided pools.
 */
function getAndWeightEggMoves(
  pokemon: Pokemon,
  levelPool: ReadonlyMap<MoveId, number>,
  eggPool: Map<MoveId, number>,
): void {
  const level = pokemon.level;
  if (level < EGG_MOVE_LEVEL_REQUIREMENT || !globalScene.currentBattle?.trainer?.config.allowEggMoves) {
    return;
  }
  const isBoss = pokemon.isBoss();
  const excludeRare = isBoss || level < RARE_EGG_MOVE_LEVEL_REQUIREMENT;
  const eggMoveWeight = getEggMoveWeight(levelPool, level, false, isBoss);
  let rareEggMoveWeight: number | undefined;
  if (!excludeRare) {
    rareEggMoveWeight = getEggMoveWeight(levelPool, level, true, isBoss);
  }
  getEggPoolForSpecies(
    pokemon.species.getRootSpeciesId(),
    levelPool,
    eggPool,
    eggMoveWeight,
    excludeRare,
    rareEggMoveWeight,
  );

  const fusionSpecies = pokemon.fusionSpecies?.getRootSpeciesId();
  if (fusionSpecies != null) {
    getEggPoolForSpecies(fusionSpecies, levelPool, eggPool, eggMoveWeight, excludeRare, rareEggMoveWeight);
  }
}

/**
 * Filter a move pool, removing moves that are not allowed based on conditions
 * @param pool - The move pool to filter
 * @param isBoss - Whether the Pokémon is a boss
 * @param hasTrainer - Whether the Pokémon has a trainer
 */
function filterMovePool(pool: Map<MoveId, number>, isBoss: boolean, hasTrainer: boolean): void {
  for (const [moveId, weight] of pool) {
    if (weight <= 0) {
      pool.delete(moveId);
      continue;
    }
    const move = allMoves[moveId];
    // Forbid unimplemented moves
    if (move.name.endsWith(" (N)")) {
      pool.delete(moveId);
      continue;
    }
    // Bosses never get self ko moves or Pain Split
    if (isBoss && (move.hasAttr("SacrificialAttr") || move.hasAttr("HpSplitAttr"))) {
      pool.delete(moveId);
    }

    // No one gets Memento or Final Gambit
    if (move.hasAttr("SacrificialAttrOnHit")) {
      pool.delete(moveId);
      continue;
    }

    // Trainers never get OHKO moves
    if (hasTrainer && move.hasAttr("OneHitKOAttr")) {
      pool.delete(moveId);
    }
  }
}

/**
 * Perform Trainer-specific adjustments to move weights in a move pool
 * @param pool - The move pool to adjust
 */
function adjustWeightsForTrainer(pool: Map<MoveId, number>): void {
  for (const [moveId, weight] of pool.entries()) {
    const move = allMoves[moveId];
    let adjustedWeight = weight;
    // Half the weight of self KO moves on trainers
    adjustedWeight *= move.hasAttr("SacrificialAttr") ? 0.5 : 1;

    // Trainers get a weight bump to stat buffing moves
    adjustedWeight *= move.getAttrs("StatStageChangeAttr").some(a => a.stages > 1 && a.selfTarget) ? 1.25 : 1;

    // Trainers get a weight decrease to multiturn moves
    adjustedWeight *= !!move.isChargingMove() || !!move.hasAttr("RechargeAttr") ? 0.7 : 1;
    if (adjustedWeight !== weight) {
      pool.set(moveId, adjustedWeight);
    }
  }
}

/**
 * Adjust weights of damaging moves in a move pool based on their power and category
 *
 * @param pool - The move pool to adjust
 * @param pokemon - The Pokémon for which the moveset is being generated
 * @param willTera - Whether the Pokémon is expected to Tera (i.e., has instant Tera on a Trainer Pokémon); default `false`
 * @remarks
 * Caps max power at 90 to avoid something like hyper beam ruining the stats.
 * pokemon is a pretty soft weighting factor, although it is scaled with the weight multiplier.
 */
function adjustDamageMoveWeights(pool: Map<MoveId, number>, pokemon: Pokemon, willTera = false): void {
  // begin max power at 40 to avoid inflating weights too much when there are only low power moves
  let maxPower = 40;
  for (const moveId of pool.keys()) {
    const move = allMoves[moveId];
    maxPower = Math.max(maxPower, move.calculateEffectivePower());
    if (maxPower >= 90) {
      maxPower = 90;
      break;
    }
  }

  const atk = pokemon.getStat(Stat.ATK);
  const spAtk = pokemon.getStat(Stat.SPATK);
  const lowerStat = Math.min(atk, spAtk);
  const higherStat = Math.max(atk, spAtk);
  const worseCategory = atk > spAtk ? MoveCategory.SPECIAL : MoveCategory.PHYSICAL;
  const statRatio = lowerStat / higherStat;
  const adjustmentRatio = Math.min(Math.pow(statRatio, 3) * 1.3, 1);

  for (const [moveId, weight] of pool) {
    const move = allMoves[moveId];
    let adjustedWeight = weight;
    if (move.category === MoveCategory.STATUS) {
      continue;
    }
    // Scale weight based on their ratio to the highest power move, capping at 50% reduction
    adjustedWeight *= Math.max(Math.min(move.calculateEffectivePower() / maxPower, 1), 0.5);

    // Scale weight based the stat it uses to deal damage, based on the ratio between said stat
    // and the higher stat
    if (move.hasAttr("DefAtkAttr")) {
      const def = pokemon.getStat(Stat.DEF);
      const defRatio = def / higherStat;
      const defAdjustRatio = Math.min(Math.pow(defRatio, 3) * 1.3, 1.1);
      adjustedWeight *= defAdjustRatio;
    } else if (
      move.category === worseCategory
      && !move.hasAttr("PhotonGeyserCategoryAttr")
      && !move.hasAttr("ShellSideArmCategoryAttr")
      && !(move.hasAttr("TeraMoveCategoryAttr") && willTera)
    ) {
      // Raw multiply each move's category by the stat it uses to deal damage
      // moves that always use the higher offensive stat are left unadjusted
      adjustedWeight *= adjustmentRatio;
    }

    if (adjustedWeight !== weight) {
      pool.set(moveId, adjustedWeight);
    }
  }
}

/**
 * Calculate the total weight of all moves in a move pool
 * @param pool - The move pool to calculate the total weight for
 * @returns The total weight of all moves in the pool
 */
function calculateTotalPoolWeight(pool: Map<MoveId, number>): number {
  let totalWeight = 0;
  for (const weight of pool.values()) {
    totalWeight += weight;
  }
  return totalWeight;
}

/**
 * Filter a pool and return a new array of moves that pass the predicate
 * @param pool - The move pool to filter
 * @param predicate - The predicate function to determine if a move should be included
 * @param totalWeight - An output parameter to hold the total weight of the filtered pool. Its value is reset to 0 if provided.
 * @returns An array of move ID and weight tuples that pass the predicate
 */
function filterPool(
  pool: ReadonlyMap<MoveId, number>,
  predicate: (moveId: MoveId) => boolean,
  totalWeight?: NumberHolder,
): [id: MoveId, weight: number][] {
  let hasTotalWeight = false;
  if (totalWeight != null) {
    totalWeight.value = 0;
    hasTotalWeight = true;
  }
  const newPool: [id: MoveId, weight: number][] = [];
  for (const [moveId, weight] of pool) {
    if (predicate(moveId)) {
      newPool.push([moveId, weight]);
      if (hasTotalWeight) {
        // Bang is safe here because we set `hasTotalWeight` in the if check above
        totalWeight!.value += weight;
      }
    }
  }

  return newPool;
}

/**
 * Forcibly add a STAB move to the Pokémon's moveset from the provided pools
 *
 * @remarks
 * If no STAB move is available, add any damaging move.
 * If no damaging move is available, no move is added
 * @param pool - The master move pool
 * @param tmPool - The TM move pool
 * @param eggPool - The egg move pool
 * @param pokemon - The Pokémon for which the moveset is being generated
 * @param tmCount - A holder for the count of TM moves selected
 * @param eggMoveCount - A holder for the count of egg moves selected
 * @param willTera - Whether the Pokémon is expected to Tera (i.e., has instant Tera on a Trainer Pokémon); default `false`
 * @param forceAnyDamageIfNoStab - If true, will force any damaging move if no STAB move is available
 */
// biome-ignore lint/nursery/useMaxParams: This is a complex function that needs all these parameters
function forceStabMove(
  pool: Map<MoveId, number>,
  tmPool: Map<MoveId, number>,
  eggPool: Map<MoveId, number>,
  pokemon: Pokemon,
  tmCount: NumberHolder,
  eggMoveCount: NumberHolder,
  willTera = false,
  forceAnyDamageIfNoStab = false,
): void {
  // All Pokemon force a STAB move first
  const totalWeight = new NumberHolder(0);
  const stabMovePool = filterPool(
    pool,
    moveId => {
      const move = allMoves[moveId];
      return (
        move.category !== MoveCategory.STATUS
        && (pokemon.isOfType(move.type)
          || (willTera && move.hasAttr("TeraBlastTypeAttr") && pokemon.getTeraType() !== PokemonType.STELLAR))
        && !STAB_BLACKLIST.has(moveId)
      );
    },
    totalWeight,
  );

  const chosenPool =
    stabMovePool.length > 0 || !forceAnyDamageIfNoStab
      ? stabMovePool
      : filterPool(pool, m => allMoves[m].category !== MoveCategory.STATUS && !STAB_BLACKLIST.has(m), totalWeight);

  if (chosenPool.length > 0) {
    let rand = randSeedInt(totalWeight.value);
    let index = 0;
    while (rand > chosenPool[index][1]) {
      rand -= chosenPool[index++][1];
    }
    const selectedId = chosenPool[index][0];
    pool.delete(selectedId);
    if (tmPool.has(selectedId)) {
      tmPool.delete(selectedId);
      tmCount.value++;
    } else if (eggPool.has(selectedId)) {
      eggPool.delete(selectedId);
      eggMoveCount.value++;
    }
    pokemon.moveset.push(new PokemonMove(selectedId));
  }
}

/**
 * Adjust weights in the remaining move pool based on existing moves in the Pokémon's moveset
 *
 * @remarks
 * Submethod for step 5 of moveset generation
 * @param pool - The move pool to filter
 * @param pokemon - The Pokémon for which the moveset is being generated
 */
function filterRemainingTrainerMovePool(pool: [id: MoveId, weight: number][], pokemon: Pokemon) {
  // Sqrt the weight of any damaging moves with overlapping types. pokemon is about a 0.05 - 0.1 multiplier.
  // Other damaging moves 2x weight if 0-1 damaging moves, 0.5x if 2, 0.125x if 3. These weights get 20x if STAB.
  // Status moves remain unchanged on weight, pokemon encourages 1-2
  for (const [idx, [moveId, weight]] of pool.entries()) {
    let ret: number;
    if (
      pokemon.moveset.some(
        mo => mo.getMove().category !== MoveCategory.STATUS && mo.getMove().type === allMoves[moveId].type,
      )
    ) {
      ret = Math.ceil(Math.sqrt(weight));
    } else if (allMoves[moveId].category !== MoveCategory.STATUS) {
      ret = Math.ceil(
        (weight / Math.max(Math.pow(4, pokemon.moveset.filter(mo => (mo.getMove().power ?? 0) > 1).length) / 8, 0.5))
          * (pokemon.isOfType(allMoves[moveId].type) && !STAB_BLACKLIST.has(moveId) ? 20 : 1),
      );
    } else {
      ret = weight;
    }
    pool[idx] = [moveId, ret];
  }
}

/**
 * Fill in the remaining slots in the Pokémon's moveset from the provided pools
 * @param pokemon - The Pokémon for which the moveset is being generated
 * @param tmPool - The TM move pool
 * @param eggMovePool - The egg move pool
 * @param tmCount - A holder for the count of moves that have been added to the moveset from TMs
 * @param eggMoveCount - A holder for the count of moves that have been added to the moveset from egg moves
 * @param baseWeights - The base weights of all moves in the master pool
 * @param remainingPool - The remaining move pool to select from
 */
function fillInRemainingMovesetSlots(
  pokemon: Pokemon,
  tmPool: Map<MoveId, number>,
  eggMovePool: Map<MoveId, number>,
  tmCount: NumberHolder,
  eggMoveCount: NumberHolder,
  baseWeights: Map<MoveId, number>,
  remainingPool: [id: MoveId, weight: number][],
): void {
  const tmCap = getMaxTmCount(pokemon.level);
  const eggCap = getMaxEggMoveCount(pokemon.level);
  const remainingPoolWeight = new NumberHolder(0);
  while (pokemon.moveset.length < 4) {
    const nonLevelMoveCount = tmCount.value + eggMoveCount.value;
    remainingPool = filterPool(
      baseWeights,
      (m: MoveId) =>
        !pokemon.moveset.some(
          mo =>
            m === mo.moveId || (allMoves[m]?.hasAttr("SacrificialAttr") && mo.getMove()?.hasAttr("SacrificialAttr")), // Only one self-KO move allowed
        )
        && (nonLevelMoveCount < tmCap || !tmPool.has(m))
        && (nonLevelMoveCount < eggCap || !eggMovePool.has(m)),
      remainingPoolWeight,
    );
    if (pokemon.hasTrainer()) {
      filterRemainingTrainerMovePool(remainingPool, pokemon);
    }
    // Ensure loop cannot run infinitely if there are no allowed moves left to
    // fill the remaining slots
    if (remainingPool.length === 0) {
      return;
    }
    const totalWeight = remainingPool.reduce((v, m) => v + m[1], 0);
    let rand = randSeedInt(totalWeight);
    let index = 0;
    while (rand > remainingPool[index][1]) {
      rand -= remainingPool[index++][1];
    }
    const selectedMoveId = remainingPool[index][0];
    baseWeights.delete(selectedMoveId);
    if (tmPool.has(selectedMoveId)) {
      tmCount.value++;
      tmPool.delete(selectedMoveId);
    } else if (eggMovePool.has(selectedMoveId)) {
      eggMoveCount.value++;
      eggMovePool.delete(selectedMoveId);
    }
    pokemon.moveset.push(new PokemonMove(selectedMoveId));
  }
}

/**
 * Debugging function to log computed move weights for a Pokémon
 * @param pokemon - The Pokémon for which the move weights were computed
 * @param pool - The move pool containing move IDs and their weights
 * @param note - Short note to include in the log for context
 */
function debugMoveWeights(pokemon: Pokemon, pool: Map<MoveId, number>, note: string): void {
  if ((isBeta || import.meta.env.DEV) && import.meta.env.NODE_ENV !== "test") {
    const moveNameToWeightMap = new Map<string, number>();
    const sortedByValue = Array.from(pool.entries()).sort((a, b) => b[1] - a[1]);
    for (const [moveId, weight] of sortedByValue) {
      moveNameToWeightMap.set(allMoves[moveId].name, weight);
    }
    console.log("%cComputed move weights [%s] for %s", "color: blue", note, pokemon.name, moveNameToWeightMap);
  }
}

/**
 * Generate a moveset for a given Pokémon based on its level, types, stats, and whether it is wild or a trainer's Pokémon.
 * @param pokemon - The Pokémon to generate a moveset for
 * @returns A reference to the Pokémon's moveset array
 */
export function generateMoveset(pokemon: Pokemon): void {
  pokemon.moveset = [];
  // Step 1: Generate the pools from various sources: level up, egg moves, and TMs
  const learnPool = getAndWeightLevelMoves(pokemon);
  debugMoveWeights(pokemon, learnPool, "Initial Level Moves");
  const hasTrainer = pokemon.hasTrainer();
  const tmPool = new Map<MoveId, number>();
  const eggMovePool = new Map<MoveId, number>();

  if (hasTrainer) {
    getAndWeightEggMoves(pokemon, learnPool, eggMovePool);
    eggMovePool.size > 0 && debugMoveWeights(pokemon, eggMovePool, "Initial Egg Moves");
    getAndWeightTmMoves(pokemon, learnPool, eggMovePool, tmPool);
    tmPool.size > 0 && debugMoveWeights(pokemon, tmPool, "Initial Tm Moves");
  }

  // Now, combine pools into one master pool.
  // The pools are kept around so we know where the move was sourced from
  const movePool = new Map<MoveId, number>([...tmPool.entries(), ...eggMovePool.entries(), ...learnPool.entries()]);

  // Step 2: Filter out forbidden moves
  const isBoss = pokemon.isBoss();
  filterMovePool(movePool, isBoss, hasTrainer);

  // Step 3: Adjust weights for trainers
  if (hasTrainer) {
    adjustWeightsForTrainer(movePool);
  }

  /** Determine whether this pokemon will instantly tera */
  const willTera = hasTrainer && willTerastallize(pokemon as EnemyPokemon);

  adjustDamageMoveWeights(movePool, pokemon, willTera);

  /** The higher this is, the greater the impact of weight. At `0` all moves are equal weight. */
  let weightMultiplier = BASE_WEIGHT_MULTIPLIER;
  if (isBoss) {
    weightMultiplier += BOSS_EXTRA_WEIGHT_MULTIPLIER;
  }

  const baseWeights = new Map<MoveId, number>(movePool);
  for (const [moveId, weight] of baseWeights) {
    if (weight <= 0) {
      baseWeights.delete(moveId);
      continue;
    }
    baseWeights.set(moveId, Math.ceil(Math.pow(weight, weightMultiplier) * 100));
  }

  const tmCount = new NumberHolder(0);
  const eggMoveCount = new NumberHolder(0);

  debugMoveWeights(pokemon, baseWeights, "Pre STAB Move");

  // Step 4: Force a STAB move if possible
  forceStabMove(movePool, tmPool, eggMovePool, pokemon, tmCount, eggMoveCount, willTera);
  // Note: To force a secondary stab, call this a second time, and pass `false` for the last parameter
  // Would also tweak the function to not consider moves already in the moveset
  // e.g. forceStabMove(..., false);

  // Step 5: Fill in remaining slots
  fillInRemainingMovesetSlots(
    pokemon,
    tmPool,
    eggMovePool,
    tmCount,
    eggMoveCount,
    baseWeights,
    filterPool(baseWeights, (m: MoveId) => !pokemon.moveset.some(mo => m === mo.moveId)),
  );
}

/**
 * Exports for internal testing purposes.
 * ⚠️ These *must not* be used outside of tests, as they will not be defined.
 * @internal
 */
export const __INTERNAL_TEST_EXPORTS: {
  getAndWeightLevelMoves: typeof getAndWeightLevelMoves;
  getAllowedTmTiers: typeof getAllowedTmTiers;
  getTmPoolForSpecies: typeof getTmPoolForSpecies;
  getAndWeightTmMoves: typeof getAndWeightTmMoves;
  getEggMoveWeight: typeof getEggMoveWeight;
  getEggPoolForSpecies: typeof getEggPoolForSpecies;
  getAndWeightEggMoves: typeof getAndWeightEggMoves;
  filterMovePool: typeof filterMovePool;
  adjustWeightsForTrainer: typeof adjustWeightsForTrainer;
  adjustDamageMoveWeights: typeof adjustDamageMoveWeights;
  calculateTotalPoolWeight: typeof calculateTotalPoolWeight;
  filterPool: typeof filterPool;
  forceStabMove: typeof forceStabMove;
  filterRemainingTrainerMovePool: typeof filterRemainingTrainerMovePool;
  fillInRemainingMovesetSlots: typeof fillInRemainingMovesetSlots;
} = {} as any;

// We can't use `import.meta.vitest` here, because this would not be set
// until the tests themselves begin to run, which is after imports
// So we rely on NODE_ENV being test instead
if (import.meta.env.NODE_ENV === "test") {
  Object.assign(__INTERNAL_TEST_EXPORTS, {
    getAndWeightLevelMoves,
    getAllowedTmTiers,
    getTmPoolForSpecies,
    getAndWeightTmMoves,
    getEggMoveWeight,
    getEggPoolForSpecies,
    getAndWeightEggMoves,
    filterMovePool,
    adjustWeightsForTrainer,
    adjustDamageMoveWeights,
    calculateTotalPoolWeight,
    filterPool,
    forceStabMove,
    filterRemainingTrainerMovePool,
    fillInRemainingMovesetSlots,
  });
}
