import type { Challenge } from "#data/challenge";

/**
 * An enum for all the challenge types. The parameter entries on these describe the
 * parameters to use when calling the applyChallenges function.
 */
export enum ChallengeType {
  /**
   * Challenges which modify what starters you can choose
   * @see {@linkcode Challenge.applyStarterChoice}
   */
  STARTER_CHOICE,
  /**
   * Challenges which modify how many starter points you have
   * @see {@linkcode Challenge.applyStarterPoints}
   */
  STARTER_POINTS,
  /**
   * Challenges which modify how many starter points you have
   * @see {@linkcode Challenge.applyStarterPoints}
   */
  STARTER_COST,
  /**
   * Challenges which modify the starter data in starter select
   * @see {@linkcode Challenge.applyStarterSelectModify}
   */
  STARTER_SELECT_MODIFY,
  /**
   * Challenges which modify your starters in some way
   * @see {@linkcode Challenge.applyStarterModify}
   */
  STARTER_MODIFY,
  /**
   * Challenges which limit which pokemon you can have in battle.
   * @see {@linkcode Challenge.applyPokemonInBattle}
   */
  POKEMON_IN_BATTLE,
  /**
   * Adds or modifies the fixed battles in a run
   * @see {@linkcode Challenge.applyFixedBattle}
   */
  FIXED_BATTLES,
  /**
   * Modifies the effectiveness of Type matchups in battle
   * @see {@linkcode Challenge.applyTypeEffectiveness}
   */
  TYPE_EFFECTIVENESS,
  /**
   * Modifies what level the AI pokemon are. UNIMPLEMENTED.
   */
  AI_LEVEL,
  /**
   * Modifies how many move slots the AI has. UNIMPLEMENTED.
   */
  AI_MOVE_SLOTS,
  /**
   * Modifies if a pokemon has its passive. UNIMPLEMENTED.
   */
  PASSIVE_ACCESS,
  /**
   * Modifies the game mode settings in some way. UNIMPLEMENTED.
   */
  GAME_MODE_MODIFY,
  /**
   * Modifies what level AI pokemon can access a move. UNIMPLEMENTED.
   */
  MOVE_ACCESS,
  /**
   * Modifies what weight AI pokemon have when generating movesets. UNIMPLEMENTED.
   */
  MOVE_WEIGHT,
  /**
   * Modifies what the pokemon stats for Flip Stat Mode.
   */
  FLIP_STAT,
  /**
   * Challenges which conditionally enable or disable automatic party healing during biome transitions
   * @see {@linkcode Challenge.applyPartyHeal}
   */
  PARTY_HEAL,
  /**
   * Challenges which conditionally enable or disable the shop
   * @see {@linkcode Challenge.applyShop}
   */
  SHOP,
  /**
   * Challenges which validate whether a pokemon can be added to the player's party or not
   * @see {@linkcode Challenge.applyPokemonAddToParty}
   */
  POKEMON_ADD_TO_PARTY,
  /**
   * Challenges which validate whether a pokemon is allowed to fuse or not
   * @see {@linkcode Challenge.applyPokemonFusion}
   */
  POKEMON_FUSION,
  /**
   * Challenges which validate whether particular moves can or cannot be used
   * @see {@linkcode Challenge.applyPokemonMove}
   */
  POKEMON_MOVE,
  /**
   * Challenges which validate whether particular items are or are not sold in the shop
   * @see {@linkcode Challenge.applyShopItem}
   */
  SHOP_ITEM,
  /**
   * Challenges which validate whether particular items will be given as a reward after a wave
   * @see {@linkcode Challenge.applyWaveReward}
   */
  WAVE_REWARD,
  /**
   * Challenges which prevent recovery from fainting
   * @see {@linkcode Challenge.applyPreventRevive}
   */
  PREVENT_REVIVE,
  /**
   * Challenges which modify moveset generation
   * @see {@linkcode Challenge.applyMovesetModify}
   */
  MOVESET_MODIFY,
  /**
   * Challenges which modify the level up moveset of a species
   * @see {@linkcode Challenge.applyLevelUpMoveset}
   */
  LEVEL_UP_MOVESET,
  /**
   * Challenges which modify the TM compatibility list of a player Pokemon
   * @see {@linkcode Challenge.applyPlayerTMCompatibility}
   */
  PLAYER_TM_COMPATIBILITY,
  /**
   * Challenges which modify the TM compatibility list of an enemy Pokemon
   * @see {@linkcode Challenge.applyEnemyTMCompatibility}
   */
  ENEMY_TM_COMPATIBILITY,
}
