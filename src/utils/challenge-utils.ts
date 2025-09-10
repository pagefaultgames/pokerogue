// biome-ignore-all lint/style/useUnifiedTypeSignatures: Rule does not allow stuff with JSDoc comments

import type { FixedBattleConfig } from "#app/battle";
import { globalScene } from "#app/global-scene";
import { pokemonEvolutions } from "#balance/pokemon-evolutions";
import { pokemonFormChanges } from "#data/pokemon-forms";
import type { PokemonSpecies } from "#data/pokemon-species";
import { ChallengeType } from "#enums/challenge-type";
import { Challenges } from "#enums/challenges";
import type { MoveId } from "#enums/move-id";
import type { MoveSourceType } from "#enums/move-source-type";
import type { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import type { ModifierTypeOption } from "#modifiers/modifier-type";
import type { DexAttrProps, StarterDataEntry } from "#system/game-data";
import type { DexEntry } from "#types/dex-data";
import { BooleanHolder, type NumberHolder } from "./common";
import { getPokemonSpecies } from "./pokemon-utils";

/**
 * @param challengeType - {@linkcode ChallengeType.STARTER_CHOICE}
 * @param pokemon - The {@linkcode PokemonSpecies} to check the validity of
 * @param valid - A {@linkcode BooleanHolder} holding the checked species' validity;
 * will be set to `false` if the species is disallowed
 * @param dexAttr - The {@linkcode DexAttrProps | Dex attributes} of the species
 * @returns `true` if any challenge was successfully applied
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
 * Apply all challenges that modify selectable starter data.
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_SELECT_MODIFY
 * @param speciesId {@link SpeciesId} The speciesId of the pokemon
 * @param dexEntry {@link DexEntry} The pokedex data associated to the pokemon.
 * @param starterDataEntry {@link StarterDataEntry} The starter data associated to the pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.STARTER_SELECT_MODIFY,
  speciesId: SpeciesId,
  dexEntry: DexEntry,
  starterDataEntry: StarterDataEntry,
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
 * Apply all challenges that conditionally enable or disable automatic party healing during biome transitions
 * @param challengeType - {@linkcode ChallengeType.PARTY_HEAL}
 * @param status - Whether party healing is enabled or not
 * @returns `true` if any challenge was successfully applied, `false` otherwise
 */
export function applyChallenges(challengeType: ChallengeType.PARTY_HEAL, status: BooleanHolder): boolean;

/**
 * Apply all challenges that conditionally enable or disable the shop
 * @param challengeType - {@linkcode ChallengeType.SHOP}
 * @param status - Whether party healing is enabled or not
 * @returns `true` if any challenge was successfully applied, `false` otherwise
 */
export function applyChallenges(challengeType: ChallengeType.SHOP, status: BooleanHolder): boolean;

/**
 * Apply all challenges that validate whether a pokemon can be added to the player's party or not
 * @param challengeType - {@linkcode ChallengeType.POKEMON_ADD_TO_PARTY}
 * @param pokemon - The pokemon being caught
 * @param status - Whether the pokemon can be added to the party or not
 * @return `true` if any challenge was sucessfully applied, `false` otherwise
 */
export function applyChallenges(
  challengeType: ChallengeType.POKEMON_ADD_TO_PARTY,
  pokemon: EnemyPokemon,
  status: BooleanHolder,
): boolean;

/**
 * Apply all challenges that validate whether a pokemon is allowed to fuse or not
 * @param challengeType - {@linkcode ChallengeType.POKEMON_FUSION}
 * @param pokemon - The pokemon being checked
 * @param status - Whether the selected pokemon is allowed to fuse or not
 * @return `true` if any challenge was sucessfully applied, `false` otherwise
 */
export function applyChallenges(
  challengeType: ChallengeType.POKEMON_FUSION,
  pokemon: PlayerPokemon,
  status: BooleanHolder,
): boolean;

/**
 * Apply all challenges that validate whether particular moves can or cannot be used
 * @param challengeType - {@linkcode ChallengeType.POKEMON_MOVE}
 * @param moveId - The move being checked
 * @param status - Whether the move can be used or not
 * @return `true` if any challenge was sucessfully applied, `false` otherwise
 */
export function applyChallenges(
  challengeType: ChallengeType.POKEMON_MOVE,
  moveId: MoveId,
  status: BooleanHolder,
): boolean;

/**
 * Apply all challenges that validate whether particular items are or are not sold in the shop
 * @param challengeType - {@linkcode ChallengeType.SHOP_ITEM}
 * @param shopItem - The item being checked
 * @param status - Whether the item should be added to the shop or not
 * @return `true` if any challenge was sucessfully applied, `false` otherwise
 */
export function applyChallenges(
  challengeType: ChallengeType.SHOP_ITEM,
  shopItem: ModifierTypeOption | null,
  status: BooleanHolder,
): boolean;

/**
 * Apply all challenges that validate whether particular items will be given as a reward after a wave
 * @param challengeType - {@linkcode ChallengeType.WAVE_REWARD}
 * @param reward - The reward being checked
 * @param status - Whether the reward should be added to the reward options or not
 * @return `true` if any challenge was sucessfully applied, `false` otherwise
 */
export function applyChallenges(
  challengeType: ChallengeType.WAVE_REWARD,
  reward: ModifierTypeOption | null,
  status: BooleanHolder,
): boolean;

/**
 * Apply all challenges that prevent recovery from fainting
 * @param challengeType - {@linkcode ChallengeType.PREVENT_REVIVE}
 * @param status - Whether fainting is a permanent status or not
 * @return `true` if any challenge was sucessfully applied, `false` otherwise
 */
export function applyChallenges(challengeType: ChallengeType.PREVENT_REVIVE, status: BooleanHolder): boolean;

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
        case ChallengeType.STARTER_SELECT_MODIFY:
          ret ||= c.applyStarterSelectModify(args[0], args[1], args[2]);
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
        case ChallengeType.PARTY_HEAL:
          ret ||= c.applyPartyHeal(args[0]);
          break;
        case ChallengeType.SHOP:
          ret ||= c.applyShop(args[0]);
          break;
        case ChallengeType.POKEMON_ADD_TO_PARTY:
          ret ||= c.applyPokemonAddToParty(args[0], args[1]);
          break;
        case ChallengeType.POKEMON_FUSION:
          ret ||= c.applyPokemonFusion(args[0], args[1]);
          break;
        case ChallengeType.POKEMON_MOVE:
          ret ||= c.applyPokemonMove(args[0], args[1]);
          break;
        case ChallengeType.SHOP_ITEM:
          ret ||= c.applyShopItem(args[0], args[1]);
          break;
        case ChallengeType.WAVE_REWARD:
          ret ||= c.applyWaveReward(args[0], args[1]);
          break;
        case ChallengeType.PREVENT_REVIVE:
          ret ||= c.applyPreventRevive(args[0]);
          break;
      }
    }
  });
  return ret;
}

/**
 * Apply all challenges to the given starter (and form) to check its validity.
 * Differs from {@linkcode checkSpeciesValidForChallenge} which only checks form changes.
 * @param species - The {@linkcode PokemonSpecies} to check the validity of.
 * @param dexAttr - The {@linkcode DexAttrProps | dex attributes} of the species, including its form index.
 * @param soft - If `true`, allow it if it could become valid through evolution or form change.
 * @returns `true` if the species is considered valid.
 */
export function checkStarterValidForChallenge(species: PokemonSpecies, props: DexAttrProps, soft: boolean) {
  if (!soft) {
    const isValidForChallenge = new BooleanHolder(true);
    applyChallenges(ChallengeType.STARTER_CHOICE, species, isValidForChallenge, props);
    return isValidForChallenge.value;
  }
  // We check the validity of every evolution and form change, and require that at least one is valid
  const speciesToCheck = [species.speciesId];
  while (speciesToCheck.length > 0) {
    const checking = speciesToCheck.pop();
    // Linter complains if we don't handle this
    if (!checking) {
      return false;
    }
    const checkingSpecies = getPokemonSpecies(checking);
    if (checkSpeciesValidForChallenge(checkingSpecies, props, true)) {
      return true;
    }
    if (checking && pokemonEvolutions.hasOwnProperty(checking)) {
      pokemonEvolutions[checking].forEach(e => {
        // Form check to deal with cases such as Basculin -> Basculegion
        // TODO: does this miss anything if checking forms of a stage 2 Pokémon?
        if (!e?.preFormKey || e.preFormKey === species.forms[props.formIndex].formKey) {
          speciesToCheck.push(e.speciesId);
        }
      });
    }
  }
  return false;
}

/**
 * Apply all challenges to the given species (and form) to check its validity.
 * Differs from {@linkcode checkStarterValidForChallenge} which also checks evolutions.
 * @param species - The {@linkcode PokemonSpecies} to check the validity of.
 * @param dexAttr - The {@linkcode DexAttrProps | dex attributes} of the species, including its form index.
 * @param soft - If `true`, allow it if it could become valid through a form change.
 * @returns `true` if the species is considered valid.
 */
export function checkSpeciesValidForChallenge(species: PokemonSpecies, props: DexAttrProps, soft: boolean) {
  const isValidForChallenge = new BooleanHolder(true);
  applyChallenges(ChallengeType.STARTER_CHOICE, species, isValidForChallenge, props);
  if (!soft || !pokemonFormChanges.hasOwnProperty(species.speciesId)) {
    return isValidForChallenge.value;
  }
  // If the form in props is valid, return true before checking other form changes
  if (soft && isValidForChallenge.value) {
    return true;
  }

  const result = pokemonFormChanges[species.speciesId].some(f1 => {
    // Exclude form changes that require the mon to be on the field to begin with
    if (!("item" in f1.trigger)) {
      return false;
    }

    return species.forms.some((f2, formIndex) => {
      if (f1.formKey === f2.formKey) {
        const formProps = { ...props, formIndex };
        const isFormValidForChallenge = new BooleanHolder(true);
        applyChallenges(ChallengeType.STARTER_CHOICE, species, isFormValidForChallenge, formProps);
        return isFormValidForChallenge.value;
      }
      return false;
    });
  });
  return result;
}

/** @returns Whether the current game mode meets the criteria to be considered a Nuzlocke challenge */
export function isNuzlockeChallenge(): boolean {
  let isFreshStart = false;
  let isLimitedCatch = false;
  let isHardcore = false;
  for (const challenge of globalScene.gameMode.challenges) {
    // value is 0 if challenge is not active
    if (!challenge.value) {
      continue;
    }
    switch (challenge.id) {
      case Challenges.FRESH_START:
        isFreshStart = true;
        break;
      case Challenges.LIMITED_CATCH:
        isLimitedCatch = true;
        break;
      case Challenges.HARDCORE:
        isHardcore = true;
        break;
    }
  }
  return isFreshStart && isLimitedCatch && isHardcore;
}
