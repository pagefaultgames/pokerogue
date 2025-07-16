import type { FixedBattleConfig } from "#app/battle";
import { globalScene } from "#app/global-scene";
import type { PokemonSpecies } from "#data/pokemon-species";
import { ChallengeType } from "#enums/challenge-type";
import type { MoveId } from "#enums/move-id";
import type { MoveSourceType } from "#enums/move-source-type";
import type { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import type { ModifierTypeOption } from "#modifiers/modifier-type";
import type { PokemonMove } from "#moves/pokemon-move";
import type { DexAttrProps } from "#system/game-data";
import type { BooleanHolder, NumberHolder } from "#utils/common";

/**
 * Apply all challenges that modify starter choice.
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_CHOICE
 * @param pokemon {@link PokemonSpecies} The pokemon to check the validity of.
 * @param valid {@link BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
 * @param dexAttr {@link DexAttrProps} The dex attributes of the pokemon.
 * @returns True if any challenge was successfully applied.
 */

export function applyChallenges(
  challengeType: ChallengeType.STARTER_CHOICE,
  pokemon: PokemonSpecies,
  valid: BooleanHolder,
  dexAttr: DexAttrProps,
): boolean;
/**
 * Apply all challenges that modify available total starter points.
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_POINTS
 * @param points {@link NumberHolder} The amount of points you have available.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.STARTER_POINTS, points: NumberHolder): boolean;
/**
 * Apply all challenges that modify the cost of a starter.
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_COST
 * @param species {@link SpeciesId} The pokemon to change the cost of.
 * @param points {@link NumberHolder} The cost of the pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.STARTER_COST,
  species: SpeciesId,
  cost: NumberHolder,
): boolean;
/**
 * Apply all challenges that modify a starter after selection.
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_MODIFY
 * @param pokemon {@link Pokemon} The starter pokemon to modify.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.STARTER_MODIFY, pokemon: Pokemon): boolean;
/**
 * Apply all challenges that what pokemon you can have in battle.
 * @param challengeType {@link ChallengeType} ChallengeType.POKEMON_IN_BATTLE
 * @param pokemon {@link Pokemon} The pokemon to check the validity of.
 * @param valid {@link BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.POKEMON_IN_BATTLE,
  pokemon: Pokemon,
  valid: BooleanHolder,
): boolean;
/**
 * Apply all challenges that modify what fixed battles there are.
 * @param challengeType {@link ChallengeType} ChallengeType.FIXED_BATTLES
 * @param waveIndex {@link Number} The current wave index.
 * @param battleConfig {@link FixedBattleConfig} The battle config to modify.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.FIXED_BATTLES,
  waveIndex: number,
  battleConfig: FixedBattleConfig,
): boolean;
/**
 * Apply all challenges that modify type effectiveness.
 * @param challengeType {@linkcode ChallengeType} ChallengeType.TYPE_EFFECTIVENESS
 * @param effectiveness {@linkcode NumberHolder} The current effectiveness of the move.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.TYPE_EFFECTIVENESS, effectiveness: NumberHolder): boolean;
/**
 * Apply all challenges that modify what level AI are.
 * @param challengeType {@link ChallengeType} ChallengeType.AI_LEVEL
 * @param level {@link NumberHolder} The generated level of the pokemon.
 * @param levelCap {@link Number} The maximum level cap for the current wave.
 * @param isTrainer {@link Boolean} Whether this is a trainer pokemon.
 * @param isBoss {@link Boolean} Whether this is a non-trainer boss pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.AI_LEVEL,
  level: NumberHolder,
  levelCap: number,
  isTrainer: boolean,
  isBoss: boolean,
): boolean;
/**
 * Apply all challenges that modify how many move slots the AI has.
 * @param challengeType {@link ChallengeType} ChallengeType.AI_MOVE_SLOTS
 * @param pokemon {@link Pokemon} The pokemon being considered.
 * @param moveSlots {@link NumberHolder} The amount of move slots.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.AI_MOVE_SLOTS,
  pokemon: Pokemon,
  moveSlots: NumberHolder,
): boolean;
/**
 * Apply all challenges that modify whether a pokemon has its passive.
 * @param challengeType {@link ChallengeType} ChallengeType.PASSIVE_ACCESS
 * @param pokemon {@link Pokemon} The pokemon to modify.
 * @param hasPassive {@link BooleanHolder} Whether it has its passive.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.PASSIVE_ACCESS,
  pokemon: Pokemon,
  hasPassive: BooleanHolder,
): boolean;
/**
 * Apply all challenges that modify the game modes settings.
 * @param challengeType {@link ChallengeType} ChallengeType.GAME_MODE_MODIFY
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.GAME_MODE_MODIFY): boolean;
/**
 * Apply all challenges that modify what level a pokemon can access a move.
 * @param challengeType {@link ChallengeType} ChallengeType.MOVE_ACCESS
 * @param pokemon {@link Pokemon} What pokemon would learn the move.
 * @param moveSource {@link MoveSourceType} What source the pokemon would get the move from.
 * @param move {@link MoveId} The move in question.
 * @param level {@link NumberHolder} The level threshold for access.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.MOVE_ACCESS,
  pokemon: Pokemon,
  moveSource: MoveSourceType,
  move: MoveId,
  level: NumberHolder,
): boolean;
/**
 * Apply all challenges that modify what weight a pokemon gives to move generation
 * @param challengeType {@link ChallengeType} ChallengeType.MOVE_WEIGHT
 * @param pokemon {@link Pokemon} What pokemon would learn the move.
 * @param moveSource {@link MoveSourceType} What source the pokemon would get the move from.
 * @param move {@link MoveId} The move in question.
 * @param weight {@link NumberHolder} The weight of the move.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.MOVE_WEIGHT,
  pokemon: Pokemon,
  moveSource: MoveSourceType,
  move: MoveId,
  weight: NumberHolder,
): boolean;

export function applyChallenges(challengeType: ChallengeType.FLIP_STAT, pokemon: Pokemon, baseStats: number[]): boolean;
/**
 * Apply all challenges that modify whether a pokemon can be auto healed or not in wave 10m.
 * @param challengeType {@link ChallengeType} ChallengeType.NO_HEAL_PHASE
 * @param applyHealPhase {@link BooleanHolder} Whether it should apply the heal phase.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.NO_HEAL_PHASE, applyHealPhase: BooleanHolder): boolean;
/**
 * Apply all challenges that modify whether the shop will appear.
 * @param challengeType {@link ChallengeType} ChallengeType.NO_SHOP_PHASE
 * @param applyShopPhase {@link BooleanHolder} Whether it should apply the shop phase.
 * @returns True if any challenge was successfully applied.
 */

export function applyChallenges(challengeType: ChallengeType.NO_SHOP_PHASE, applyShopPhase: BooleanHolder): boolean;
/**
 * Apply all challenges that modify whether a shop item should be blacklisted.
 * @param challengeType {@link ChallengeType} ChallengeType.SHOP_ITEM_BLACKLIST
 * @param shopItem {@link ModifierTypeOption} The shop item in question.
 * @param isValid {@link BooleanHolder} Whether the shop should have the item.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.SHOP_ITEM_BLACKLIST,
  shopItem: ModifierTypeOption | null,
  isValid: BooleanHolder,
): boolean;
/**
 * Apply all challenges that modify whether a reward item should be blacklisted.
 * @param challengeType {@link ChallengeType} ChallengeType.RANDOM_ITEM_BLACKLIST
 * @param randomItem {@link ModifierTypeOption} The random item in question.
 * @param isValid {@link BooleanHolder} Whether it should load the random item.
 * @returns True if any challenge was successfully applied.
 */

export function applyChallenges(
  challengeType: ChallengeType.RANDOM_ITEM_BLACKLIST,
  randomItem: ModifierTypeOption | null,
  isValid: BooleanHolder,
): boolean;
/**
 * Apply all challenges that modify whether a pokemon move should be blacklisted.
 * @param challengeType {@link ChallengeType} ChallengeType.MOVE_BLACKLIST
 * @param move {@link PokemonMove} The move in question.
 * @param isValid {@link BooleanHolder} Whether the move should be allowed.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.MOVE_BLACKLIST,
  move: PokemonMove,
  isValid: BooleanHolder,
): boolean;
/**
 * Apply all challenges that modify whether a pokemon should be removed from the team.
 * @param challengeType {@link ChallengeType} ChallengeType.DELETE_POKEMON
 * @param canStay {@link BooleanHolder} Whether the pokemon can stay in team after death.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.DELETE_POKEMON, canStay: BooleanHolder): boolean;
/**
 * Apply all challenges that modify whether a pokemon should revive.
 * @param challengeType {@link ChallengeType} ChallengeType.PREVENT_REVIVE
 * @param canBeRevived {@link BooleanHolder} Whether it should revive the fainted Pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.PREVENT_REVIVE, canBeRevived: BooleanHolder): boolean;
/**
 * Apply all challenges that modify whether a pokemon can be caught.
 * @param challengeType {@link ChallengeType} ChallengeType.ADD_POKEMON_TO_PARTY
 * @param waveIndex {@link BooleanHolder} The current wave.
 * @param canAddToParty {@link BooleanHolder} Whether the pokemon can be caught.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.ADD_POKEMON_TO_PARTY,
  waveIndex: number,
  canAddToParty: BooleanHolder,
): boolean;
/**
 * Apply all challenges that modify whether a pokemon can fuse.
 * @param challengeType {@link ChallengeType} ChallengeType.SHOULD_FUSE
 * @param pokemon {@link Pokemon} The first chosen pokemon for fusion.
 * @param pokemonTofuse {@link Pokemon} The second chosen pokemon for fusion.
 * @param canFuse {@link BooleanHolder} Whether the pokemons can fuse.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.SHOULD_FUSE,
  pokemon: Pokemon,
  pokemonTofuse: Pokemon,
  canFuse: BooleanHolder,
): boolean;

export function applyChallenges(challengeType: ChallengeType, ...args: any[]): boolean {
  let ret = false;
  globalScene.gameMode.challenges.forEach(c => {
    if (c.value !== 0) {
      switch (challengeType) {
        case ChallengeType.STARTER_CHOICE:
          ret ||= c.applyStarterChoice(args[0], args[1], args[2]);
          break;
        case ChallengeType.STARTER_POINTS:
          ret ||= c.applyStarterPoints(args[0]);
          break;
        case ChallengeType.STARTER_COST:
          ret ||= c.applyStarterCost(args[0], args[1]);
          break;
        case ChallengeType.STARTER_MODIFY:
          ret ||= c.applyStarterModify(args[0]);
          break;
        case ChallengeType.POKEMON_IN_BATTLE:
          ret ||= c.applyPokemonInBattle(args[0], args[1]);
          break;
        case ChallengeType.FIXED_BATTLES:
          ret ||= c.applyFixedBattle(args[0], args[1]);
          break;
        case ChallengeType.TYPE_EFFECTIVENESS:
          ret ||= c.applyTypeEffectiveness(args[0]);
          break;
        case ChallengeType.AI_LEVEL:
          ret ||= c.applyLevelChange(args[0], args[1], args[2], args[3]);
          break;
        case ChallengeType.AI_MOVE_SLOTS:
          ret ||= c.applyMoveSlot(args[0], args[1]);
          break;
        case ChallengeType.PASSIVE_ACCESS:
          ret ||= c.applyPassiveAccess(args[0], args[1]);
          break;
        case ChallengeType.GAME_MODE_MODIFY:
          ret ||= c.applyGameModeModify();
          break;
        case ChallengeType.MOVE_ACCESS:
          ret ||= c.applyMoveAccessLevel(args[0], args[1], args[2], args[3]);
          break;
        case ChallengeType.MOVE_WEIGHT:
          ret ||= c.applyMoveWeight(args[0], args[1], args[2], args[3]);
          break;
        case ChallengeType.FLIP_STAT:
          ret ||= c.applyFlipStat(args[0], args[1]);
          break;
        case ChallengeType.NO_HEAL_PHASE:
          ret ||= c.applyNoHealPhase(args[0]);
          break;
        case ChallengeType.NO_SHOP_PHASE:
          ret ||= c.applyNoShopPhase(args[0]);
          break;
        case ChallengeType.SHOP_ITEM_BLACKLIST:
          ret ||= c.applyShopItemBlacklist(args[0], args[1]);
          break;
        case ChallengeType.RANDOM_ITEM_BLACKLIST:
          ret ||= c.applyRandomItemBlacklist(args[0], args[1]);
          break;
        case ChallengeType.MOVE_BLACKLIST:
          ret ||= c.applyMoveBlacklist(args[0], args[1]);
          break;
        case ChallengeType.DELETE_POKEMON:
          ret ||= c.applyDeletePokemon(args[0]);
          break;
        case ChallengeType.PREVENT_REVIVE:
          ret ||= c.applyRevivePrevention(args[0]);
          break;
        case ChallengeType.ADD_POKEMON_TO_PARTY:
          ret ||= c.applyAddPokemonToParty(args[0], args[1]);
          break;
        case ChallengeType.SHOULD_FUSE:
          ret ||= c.applyShouldFuse(args[0], args[1], args[2]);
          break;
      }
    }
  });
  return ret;
}
