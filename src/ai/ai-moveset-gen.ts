/*
 * SPDX-FileCopyrightText: 2025-2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 * SPDX-FileContributor: Xavion3
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EVOLVE_MOVE, RELEARN_MOVE } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { speciesEggMoves } from "#balance/moves/egg-moves";
import { FORBIDDEN_SINGLES_MOVES, FORBIDDEN_TM_MOVES, LEVEL_BASED_DENYLIST } from "#balance/moves/forbidden-moves";
import {
  BASE_LEVEL_WEIGHT_OFFSET,
  BASE_WEIGHT_MULTIPLIER,
  BOSS_EXTRA_WEIGHT_MULTIPLIER,
  COMMON_TIER_TM_LEVEL_REQUIREMENT,
  COMMON_TM_MOVESET_WEIGHT,
  EGG_MOVE_LEVEL_REQUIREMENT,
  EGG_MOVE_TO_LEVEL_WEIGHT,
  EGG_MOVE_WEIGHT_MAX,
  EVO_MOVE_BP_THRESHOLD,
  EVOLUTION_MOVE_WEIGHT,
  FORCED_SIGNATURE_MOVE_CHANCE,
  GREAT_TIER_TM_LEVEL_REQUIREMENT,
  GREAT_TM_MOVESET_WEIGHT,
  getMaxEggMoveCount,
  getMaxTmCount,
  LEVEL_BASED_DENYLIST_THRESHOLD,
  RARE_EGG_MOVE_LEVEL_REQUIREMENT,
  RELEARN_MOVE_WEIGHT,
  STAB_BLACKLIST,
  ULTRA_TIER_TM_LEVEL_REQUIREMENT,
  ULTRA_TM_MOVESET_WEIGHT,
} from "#balance/moves/moveset-generation";
import { FORCED_RIVAL_SIGNATURE_MOVES, FORCED_SIGNATURE_MOVES } from "#balance/moves/signature-moves";
import { SUPERCEDED_MOVES } from "#balance/moves/superceded-moves";
import { speciesTmMoves, tmPoolTiers } from "#balance/tms";
import { IS_TEST, isBeta, isDev } from "#constants/app-constants";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveCategory } from "#enums/move-category";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import type { EnemyPokemon, Pokemon } from "#field/pokemon";
import { targetSleptOrComatoseCondition, userSleptOrComatoseCondition } from "#moves/move-condition";
import { PokemonMove } from "#moves/pokemon-move";
import type { Move, StatStageChangeAttr } from "#types/move-types";
import { NumberHolder, randSeedInt, randSeedItem } from "#utils/common";
import { willTerastallize } from "#utils/pokemon-utils";

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
      // level 1 moves with bp higher than EVO_MOVE_BP_THRESHOLD are treated as "move reminder" moves and bump their weight. Trainers use actual relearn moves.
      case 1:
        if (move.power >= EVO_MOVE_BP_THRESHOLD) {
          weight = RELEARN_MOVE_WEIGHT;
        }
        break;
      case RELEARN_MOVE:
        weight = hasTrainer ? RELEARN_MOVE_WEIGHT : 0;
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

    if (FORBIDDEN_TM_MOVES.has(moveId) || levelPool.has(moveId) || eggPool.has(moveId) || tmPool.has(moveId)) {
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
    eggPool.set(moveId, Math.max(eggPool.get(moveId) ?? 0, idx === 3 ? rareEggMoveWeight : eggMoveWeight));
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
 * Filter `pool`, removing moves that are {@link SUPERCEDED_MOVES | superceded} by other moves in the pool
 * @param pool - The move pool to filter
 * @param otherPools - Other move pools to consider as available when filtering
 */
function filterSupercededMoves(pool: Map<MoveId, number>, ...otherPools: Map<MoveId, number>[]): void {
  const presentMoves = new Set<MoveId>(pool.keys());

  for (const otherPool of otherPools) {
    for (const moveId of otherPool.keys()) {
      presentMoves.add(moveId);
    }
  }
  for (const move of pool.keys()) {
    const superceded = SUPERCEDED_MOVES[move];
    if (superceded == null || new Set(superceded).isDisjointFrom(presentMoves)) {
      continue;
    }
    pool.delete(move);
  }
}

/**
 * Filter a move pool, removing moves that are not allowed based on specific conditions
 * @param pool - The move pool to filter
 * @param isBoss - Whether the Pokémon is a boss
 * @param hasTrainer - Whether the Pokémon has a trainer
 * @param pokemon - The Pokémon having its moveset generated
 */
function filterMovePool(pool: Map<MoveId, number>, isBoss: boolean, hasTrainer: boolean, pokemon: Pokemon): void {
  const isSingles = !globalScene.currentBattle?.double;
  const level = pokemon.level;
  const blockWeatherMoves =
    pokemon.hasAbilityWithAttr("PostSummonWeatherChangeAbAttr")
    || pokemon.hasAbilityWithAttr("SuppressWeatherEffectAbAttr");
  const blockTerrainMoves = pokemon.hasAbilityWithAttr("PostSummonTerrainChangeAbAttr");
  // Block status moves if pokemon has Gorilla Tactics
  const hasGorillaTactics = pokemon.hasAbilityWithAttr("GorillaTacticsAbAttr");
  for (const [moveId, weight] of pool) {
    const move = allMoves[moveId];
    if (
      weight <= 0
      || move.name.endsWith(" (N)") // Forbid unimplemented moves
      || move.hasAttr("SacrificialAttrOnHit") // No one gets Memento or Final Gambit
      || (isBoss && (move.hasAttr("SacrificialAttr") || move.hasAttr("HpSplitAttr"))) // Bosses never get self ko moves or Pain Split
      || (hasTrainer && move.hasAttr("OneHitKOAttr")) // trainers never get OHKO moves
      || ((isBoss || hasTrainer) // Following conditions do not apply to normal wild pokemon
        && ((isSingles && FORBIDDEN_SINGLES_MOVES.has(moveId)) // forbid doubles only moves in singles
          || (level >= LEVEL_BASED_DENYLIST_THRESHOLD && LEVEL_BASED_DENYLIST.has(moveId)) // forbid level based denylist moves
          || (move.hasAttr("WeatherChangeAttr") && blockWeatherMoves) // Forbid Weather moves if the pokemon has a weather summoning or suppressing ability
          || (move.hasAttr("TerrainChangeAttr") && blockTerrainMoves) // Forbid terrain moves if the pokemon has a terrain summoning ability
          || (hasGorillaTactics && move.category === MoveCategory.STATUS))) // Forbid status moves if pokemon has Gorilla Tactics
    ) {
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
  /** Memoized move effective power to avoid redundant calculations */
  const movePowers: Partial<Record<MoveId, number>> = {};
  for (const moveId of pool.keys()) {
    const move = allMoves[moveId];
    if (move.category === MoveCategory.STATUS) {
      continue;
    }
    const power = move.calculateEffectivePower(pokemon);
    movePowers[moveId] = power;
    maxPower = Math.max(maxPower, power);
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
  const adjustmentRatio = Math.min(Math.pow(statRatio, 3) * 2.0, 1);

  for (const [moveId, weight] of pool) {
    const move = allMoves[moveId];
    let adjustedWeight = weight;
    if (move.category === MoveCategory.STATUS) {
      continue;
    }
    const power = movePowers[moveId] ?? move.calculateEffectivePower(pokemon);

    // Take power and multiply by the

    // Scale weight based on their ratio to the highest power move, capping at 75% reduction
    adjustedWeight *= Phaser.Math.Clamp(power / maxPower, 0.25, 1);

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

    pool.set(moveId, adjustedWeight);
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
 * Perform a weighted coin flip which is heads with probability {@linkcode FORCED_SIGNATURE_MOVE_CHANCE}
 * @returns Whether the coin flip was heads
 */
function doSignatureCoinFlip() {
  return randSeedInt(100) < FORCED_SIGNATURE_MOVE_CHANCE;
}

/**
 * Helper method that adds the move to the Pokémon's moveset and removes it from the provided pools.
 *
 * The parameters are the exact same as those for {@linkcode forceSignatureMove}
 */
function addToMoveset(
  move: MoveId,
  pokemon: Pokemon,
  pool: Map<MoveId, number>,
  tmPool: Map<MoveId, number>,
  eggPool: Map<MoveId, number>,
  tmCount: NumberHolder,
  eggMoveCount: NumberHolder,
): boolean {
  pool.delete(move);
  if (tmPool.has(move)) {
    tmPool.delete(move);
    tmCount.value++;
  } else if (eggPool.has(move)) {
    eggPool.delete(move);
    eggMoveCount.value++;
  }
  pokemon.moveset.push(new PokemonMove(move));
  return true;
}

/**
 * Attempt to force a signature move into the Pokémon's moveset from the provided pools
 *
 * @remarks
 * Takes care of removing the move from each pool and adjusting the TM and egg move counts as necessary.
 *
 * @param pokemon - The Pokémon for which the moveset is being generated
 * @param pool - The pool of available moves
 * @param tmPool - The TM move pool
 * @param eggMovePool - The egg move pool
 * @param tmCount - A holder for the count of moves that have been added to the moveset from TMs
 * @param eggMoveCount - A holder for the count of moves that have been added to the moveset from egg moves
 * @param forRival - Whether to consider the rival-specific signature moves
 * @returns The move that was added, or `undefined` if no move was added
 *
 * @privateRemarks
 * ⚠️ If the logic of this method changes, be sure to update the doc comment on {@linkcode FORCED_SIGNATURE_MOVES},
 * which describes how signature moves are selected.
 */
function forceSignatureMove(
  pokemon: Pokemon,
  pool: Map<MoveId, number>,
  tmPool: Map<MoveId, number>,
  eggPool: Map<MoveId, number>,
  tmCount: NumberHolder,
  eggMoveCount: NumberHolder,
  forRival: boolean,
): undefined | Move {
  const speciesId = pokemon.species.speciesId;
  let forcedSignature = forRival
    ? (FORCED_RIVAL_SIGNATURE_MOVES[speciesId] ?? FORCED_SIGNATURE_MOVES[speciesId])
    : FORCED_SIGNATURE_MOVES[speciesId];
  if (forcedSignature == null) {
    return;
  }

  if (typeof forcedSignature === "number") {
    if (!(pool.has(forcedSignature) && doSignatureCoinFlip())) {
      return;
    }
  } else {
    const availableSignatures = forcedSignature.filter(m => pool.has(m));
    if (availableSignatures.length === 0 || !doSignatureCoinFlip()) {
      return;
    }
    forcedSignature = randSeedItem(availableSignatures);
  }

  addToMoveset(forcedSignature, pokemon, pool, tmPool, eggPool, tmCount, eggMoveCount);
  return allMoves[forcedSignature];
}

/**
 * Forcibly add a STAB move to the Pokémon's moveset from the provided pools.
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
  // Attempt to force a signature move first
  const typesForStab = new Set(pokemon.getTypes());
  // All Pokemon force a STAB move first
  const totalWeight = new NumberHolder(0);
  const stabMovePool = filterPool(
    pool,
    moveId => {
      const move = allMoves[moveId];
      return (
        move.category !== MoveCategory.STATUS
        && (typesForStab.has(getMoveType(move, pokemon, willTera))
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
    addToMoveset(selectedId, pokemon, pool, tmPool, eggPool, tmCount, eggMoveCount);
  }
}

/**
 * Get the type that a move will be when used by a specific Pokémon
 * @param move - The move being considered
 * @param pokemon - The pokemon using the move
 * @param willTera - Whether the pokemon will terastallize
 * @returns The type of the move, considering variable type moves
 */
function getMoveType(move: MoveId | Move, pokemon: Pokemon, willTera: boolean): PokemonType {
  if (typeof move === "number") {
    move = allMoves[move];
  }

  if (move.category !== MoveCategory.STATUS) {
    const VariableMoveTypeAttr = move.getAttrs("VariableMoveTypeAttr").at(-1);
    if (VariableMoveTypeAttr != null) {
      return VariableMoveTypeAttr.getTypeForMovegen(pokemon, move, willTera);
    }
  }

  return move.type;
}

/**
 * Compute the types of damaging moves in the Pokémon's moveset, accounting for variable type moves
 *
 * @privateRemarks
 * - Damage moves only; status moves are ignored
 * - Moves with `FixedDamageAttr` are ignored
 * - Types are via {@linkcode getMoveType} to account for variable type moves
 * @param pokemon - The pokemon to get move types for
 * @param willTera - Whether the pokemon is guaranteed to Tera
 * @returns The set of existing damaging move types in the Pokémon's moveset
 */
function getExistingDamageMoveTypes(pokemon: Pokemon, willTera: boolean): Set<PokemonType> {
  const existingMoveTypes = new Set<PokemonType>();
  for (const mo of pokemon.moveset) {
    const move = mo.getMove();
    if (move.category !== MoveCategory.STATUS && !move.hasAttr("FixedDamageAttr")) {
      existingMoveTypes.add(getMoveType(move, pokemon, willTera));
    }
  }
  return existingMoveTypes;
}

/**
 * Determine whether there is a move in the moveset that benefits from boosting the specified offensive stat.
 * @param moveset - The moveset to check against
 * @param attr - The sole `StatStageChangeAttr` from the move being considered
 * @returns Whether no moves in the moveset would benefit from the stat stage change described by `attr`
 */
export function removeSelfStatBoost(pokemon: Pokemon, attr: StatStageChangeAttr | undefined): boolean {
  if (attr == null || attr.stats.length !== 1) {
    return false;
  }
  let category: MoveCategory;
  switch (attr.stats[0]) {
    case Stat.ATK:
      category = MoveCategory.PHYSICAL;
      break;
    case Stat.SPATK:
      category = MoveCategory.SPECIAL;
      break;
    default:
      return false;
  }
  for (const pokemonMove of pokemon.moveset) {
    const move = pokemonMove.getMove();
    if (
      move.category === category
      && !move.hasAttr("FixedDamageAttr") // Fixed damage moves don't benefit from offensive boosts
      && !move.hasAttr("DefAtkAttr") // Body press doesn't benefit from offensive boosts
      && !move.hasAttr("PhotonGeyserCategoryAttr") // Photon Geyser benefits from either offesive boost
      && !move.hasAttr("ShellSideArmCategoryAttr") // Shell Side Arm benefits from either offensive boost
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Determine whether the Pokémon would benefit from Rain Dance based on its
 * current moveset and abilities.
 * @param pokemon - The Pokémon under examination
 * @returns Whether the Pokémon would benefit from Rain Dance
 */
export function shouldRemoveRainDance(pokemon: Pokemon): boolean {
  if (getExistingDamageMoveTypes(pokemon, false).has(PokemonType.WATER)) {
    return false;
  }
  for (const rainAbility of [AbilityId.RAIN_DISH, AbilityId.FORECAST, AbilityId.SWIFT_SWIM, AbilityId.DRY_SKIN]) {
    if (pokemon.hasAbility(rainAbility, false, true)) {
      return false;
    }
  }
  for (const pokemonMove of pokemon.moveset) {
    const move = pokemonMove.getMove();
    if (move.findAttr(attr => attr.is("WeatherInstantChargeAttr") && attr.weatherTypes.includes(WeatherType.RAIN))) {
      return false;
    }
  }
  return true;
}

/**
 * Determine whether the Pokémon would benefit from Sunny Day based on its
 * current moveset and abilities.
 * @param pokemon - The Pokémon under examination
 * @returns Whether the Pokémon would benefit from Sunny Day
 */
export function shouldRemoveSunnyDay(pokemon: Pokemon): boolean {
  if (getExistingDamageMoveTypes(pokemon, false).has(PokemonType.FIRE)) {
    return true;
  }
  // Solar power depends on having a move that is specially boosted
  for (const sunAbility of [
    AbilityId.CHLOROPHYLL,
    AbilityId.FLOWER_GIFT,
    AbilityId.PROTOSYNTHESIS,
    AbilityId.HARVEST,
    AbilityId.FORECAST,
  ]) {
    if (pokemon.hasAbility(sunAbility, false, true)) {
      return false;
    }
  }
  const hasSolarPower = pokemon.hasAbility(AbilityId.SOLAR_POWER, false, true);
  for (const pokemonMove of pokemon.moveset) {
    const move = pokemonMove.getMove();
    if (
      move.hasAttr("WeatherBallTypeAttr")
      || move.id === MoveId.HYDRO_STEAM
      || (move.category === MoveCategory.SPECIAL && hasSolarPower)
      || move.findAttr(attr => attr.is("WeatherInstantChargeAttr") && attr.weatherTypes.includes(WeatherType.SUNNY))
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Determine whether the Pokémon would benefit from Snow/Hail based on its
 * current moveset and abilities.
 * @param pokemon - The Pokémon under examination
 * @returns Whether the Pokémon would benefit from Snow/Hail
 */
// TODO: Extract out common functionality between this and sandstorm
export function removeSnowscapeHail(pokemon: Pokemon, willTera: boolean): boolean {
  const types = new Set(pokemon.getTypes(willTera, true));
  if (!types.isDisjointFrom(new Set([PokemonType.GROUND, PokemonType.STEEL, PokemonType.ROCK]))) {
    return false;
  }
  for (const snowAbility of [
    AbilityId.SLUSH_RUSH,
    AbilityId.FORECAST,
    AbilityId.ICE_FACE,
    AbilityId.SNOW_CLOAK,
    AbilityId.ICE_BODY,
  ]) {
    if (pokemon.hasAbility(snowAbility, false, true)) {
      return false;
    }
  }
  for (const pokemonMove of pokemon.moveset) {
    const move = pokemonMove.getMove();
    if (
      move.id === MoveId.AURORA_VEIL
      || move.findAttr(
        attr =>
          attr.is("WeatherInstantChargeAttr")
          && (attr.weatherTypes.includes(WeatherType.HAIL) || attr.weatherTypes.includes(WeatherType.SNOW)),
      )
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Determine whether the Pokémon would benefit from Sandstorm based on its
 * current moveset and abilities.
 * @param pokemon - The Pokémon under examination
 * @returns Whether the Pokémon would benefit from Sandstorm
 */
export function shouldRemoveSandstorm(pokemon: Pokemon, willTera: boolean): boolean {
  if (pokemon.getTypes(willTera, true).includes(PokemonType.ROCK)) {
    return false;
  }
  if (
    pokemon.hasAbility(AbilityId.SAND_FORCE, false, true)
    && !getExistingDamageMoveTypes(pokemon, false).isDisjointFrom(
      new Set([PokemonType.GROUND, PokemonType.STEEL, PokemonType.ROCK]),
    )
  ) {
    return false;
  }
  for (const sandAbility of [AbilityId.SAND_RUSH, AbilityId.SAND_VEIL, AbilityId.FORECAST]) {
    if (pokemon.hasAbility(sandAbility, false, true)) {
      return false;
    }
  }
  for (const pokemonMove of pokemon.moveset) {
    const move = pokemonMove.getMove();
    if (
      move.findAttr(attr => attr.is("WeatherInstantChargeAttr") && attr.weatherTypes.includes(WeatherType.SANDSTORM))
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Check if the Pokémon has a move that induces sleep or a drowsy state.
 * @param pokemon - The Pokémon under examination
 * @param targetSelf - (default `false`) If `true`, check for self status moves instead of forbidding them
 * @returns Whether the Pokémon has a sleep-inducing move in its moveset
 */
function hasSleepInducingMove(pokemon: Pokemon, targetSelf = false): boolean {
  for (const pokemonMove of pokemon.moveset) {
    const move = pokemonMove.getMove();
    if (
      move.is(targetSelf ? "SelfStatusMove" : "StatusMove")
      && (targetSelf || !move.is("SelfStatusMove"))
      && move.attrs.some(
        a =>
          (a.is("StatusEffectAttr") && a.effect === StatusEffect.SLEEP)
          || (a.is("AddBattlerTagAttr") && a.tagType === BattlerTagType.DROWSY),
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Filter a Pokémon's moveset, removing moves that are only useful in combination
 * with other moves/abilities that the Pokémon does not have.
 * @param pokemon - The Pokémon to filter the moveset of
 * @param willTera - Whether the Pokémon is guaranteed to Tera
 * @returns Whether any moves were removed from the moveset
 */
export function filterUselessMoves(pokemon: Pokemon, willTera: boolean): boolean {
  let numWeatherMoves = 0;
  const moveset = pokemon.moveset;
  for (let i = moveset.length - 1; i >= 0; i--) {
    const move = moveset[i].getMove();
    if (move.hasAttr("WeatherChangeAttr")) {
      numWeatherMoves++;
    }
    if (
      (move.id === MoveId.RAIN_DANCE && shouldRemoveRainDance(pokemon))
      || (move.id === MoveId.SUNNY_DAY && shouldRemoveSunnyDay(pokemon))
      || ((move.id === MoveId.SNOWSCAPE || move.id === MoveId.HAIL) && removeSnowscapeHail(pokemon, willTera))
      || (move.id === MoveId.SANDSTORM && shouldRemoveSandstorm(pokemon, willTera))
      || (move.is("SelfStatusMove") // Check if this is a stat boosting move that only boosts one stat
        && move.attrs.length === 1
        && removeSelfStatBoost(pokemon, move.getAttrs("StatStageChangeAttr")[0]))
      || (move.hasCondition(targetSleptOrComatoseCondition) && !hasSleepInducingMove(pokemon))
      || (move.hasCondition(userSleptOrComatoseCondition) && !hasSleepInducingMove(pokemon, true))
      || (move.id === MoveId.AURORA_VEIL // Aurora veil without hail / snowscape
        && !(
          pokemon.hasAbility(AbilityId.SNOW_WARNING, false, true)
          || moveset.some(m => [MoveId.HAIL, MoveId.SNOWSCAPE].includes(m.moveId))
        ))
      // TODO: Add condition for venom drench
    ) {
      moveset.splice(i, 1);
      return true;
    }
  }

  // After removing moves based on conditions, remove weather setting moves if there are
  // two or more in the moveset. Done after the previous loop to avoid removing
  // a weather move that meets its conditions instead of one that does not.
  if (numWeatherMoves >= 2) {
    moveset.splice(
      moveset.findIndex(m => m.getMove().hasAttr("WeatherChangeAttr")),
      1,
    );
    return true;
  }
  return false;
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

  // TODO: Optimize this by adding the information as moves are added to the moveset rather than recalculating every time
  const numDamageMoves = pokemon.moveset.filter(mo => (mo.getMove().power ?? 0) > 1).length;
  const weightDenominator = Math.max(Math.pow(4, numDamageMoves) / 8, 0.5);
  const typesForStab = new Set(pokemon.getTypes());
  const willTera = willTerastallize(pokemon);

  // Add Tera type for STAB consideration if the pokemon is going to tera
  if (willTerastallize(pokemon)) {
    typesForStab.add(pokemon.getTeraType());
  }

  const existingMoveTypes = getExistingDamageMoveTypes(pokemon, willTera);

  for (const [idx, [moveId, weight]] of pool.entries()) {
    let ret: number;
    const move = allMoves[moveId];
    if (move.category === MoveCategory.STATUS) {
      continue;
    }

    const moveType = getMoveType(move, pokemon as EnemyPokemon, willTera);

    if (existingMoveTypes.has(moveType) && moveType !== PokemonType.UNKNOWN) {
      ret = Math.sqrt(weight);
    } else {
      ret = weight / weightDenominator;
      if (typesForStab.has(moveType) && !STAB_BLACKLIST.has(moveId)) {
        ret *= 20;
      }
    }
    pool[idx] = [moveId, Math.ceil(ret)];
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
  if (isBeta || isDev || (IS_TEST && __INTERNAL_TEST_EXPORTS.forceLogging)) {
    const moveNameToWeightMap = new Map<string, number>();
    const sortedByValue = Array.from(pool.entries()).sort((a, b) => b[1] - a[1]);
    for (const [moveId, weight] of sortedByValue) {
      moveNameToWeightMap.set(allMoves[moveId].name, weight);
    }
    console.log("%cComputed move weights [%s] for %s", "color: blue", note, pokemon.name, moveNameToWeightMap);
  } else {
  }
}

/**
 * Generate a moveset for a given Pokémon based on its level, types, stats, and whether it is wild or a trainer's Pokémon.
 * @param pokemon - The Pokémon to generate a moveset for
 * @param forRival - Whether the moveset is being generated for the rival's Pokémon
 * @returns A reference to the Pokémon's moveset array
 */
export function generateMoveset(pokemon: Pokemon, forRival = false): void {
  globalScene.movesetGenInProgress = true;
  pokemon.moveset = [];
  const isBoss = pokemon.isBoss();
  // Step 1: Generate the pools from various sources: level up, egg moves, and TMs
  const learnPool = getAndWeightLevelMoves(pokemon);
  debugMoveWeights(pokemon, learnPool, "Initial Level Moves");
  const hasTrainer = pokemon.hasTrainer();
  const tmPool = new Map<MoveId, number>();
  const eggMovePool = new Map<MoveId, number>();

  if (hasTrainer || isBoss) {
    filterSupercededMoves(learnPool);
  }

  if (hasTrainer) {
    getAndWeightEggMoves(pokemon, learnPool, eggMovePool);
    if (eggMovePool.size > 0) {
      filterSupercededMoves(eggMovePool, learnPool);
      debugMoveWeights(pokemon, eggMovePool, "Initial Egg Moves");
    }
    getAndWeightTmMoves(pokemon, learnPool, eggMovePool, tmPool);
    if (tmPool.size > 0) {
      debugMoveWeights(pokemon, tmPool, "Initial Tm Moves");
      filterSupercededMoves(tmPool, learnPool, eggMovePool);
    }
  }

  // Now, combine pools into one master pool.
  // The pools are kept around so we know where the move was sourced from
  const movePool = new Map<MoveId, number>([...tmPool.entries(), ...eggMovePool.entries(), ...learnPool.entries()]);

  // Step 2: Filter out forbidden moves
  filterMovePool(movePool, isBoss, hasTrainer, pokemon);

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

  // Step 4: Attempt to force a signature move
  const forcedSignature = forceSignatureMove(
    pokemon,
    baseWeights,
    tmPool,
    eggMovePool,
    tmCount,
    eggMoveCount,
    forRival,
  );

  // Step 5: Force a STAB move if no signature was generated or was not a damaging STAB move
  if (
    forcedSignature != null
    && forcedSignature.category !== MoveCategory.STATUS
    && pokemon.getTypes().includes(getMoveType(forcedSignature, pokemon, willTera))
  ) {
    forceStabMove(baseWeights, tmPool, eggMovePool, pokemon, tmCount, eggMoveCount, willTera);
  }

  // Note: To force a secondary stab, call `forceStabMove` a second time, and pass `false` for the last parameter
  // Should also tweak the function to skip the signature move forcing step

  // Step 5: Fill in remaining slots
  const remainingPool = filterPool(baseWeights, (m: MoveId) => !pokemon.moveset.some(mo => m === mo.moveId));
  do {
    fillInRemainingMovesetSlots(pokemon, tmPool, eggMovePool, tmCount, eggMoveCount, baseWeights, remainingPool);
  } while (remainingPool.length > 0 && filterUselessMoves(pokemon, willTera));

  globalScene.movesetGenInProgress = false;
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
  forceLogging?: boolean;
} = {} as any;

if (IS_TEST) {
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
    forceLogging: false,
  });
}
