/**
 * An enum for all the challenge types. The parameter entries on these describe the
 * parameters to use when calling the applyChallenges function.
 */
export enum ChallengeType {
  /**
   * Challenges which modify what starters you can choose
   * @see {@link Challenge.applyStarterChoice}
   */
  STARTER_CHOICE,
  /**
   * Challenges which modify how many starter points you have
   * @see {@link Challenge.applyStarterPoints}
   */
  STARTER_POINTS,
  /**
   * Challenges which modify how many starter points you have
   * @see {@link Challenge.applyStarterPointCost}
   */
  STARTER_COST,
  /**
   * Challenges which modify your starters in some way
   * @see {@link Challenge.applyStarterModify}
   */
  STARTER_MODIFY,
  /**
   * Challenges which limit which pokemon you can have in battle.
   * @see {@link Challenge.applyPokemonInBattle}
   */
  POKEMON_IN_BATTLE,
  /**
   * Adds or modifies the fixed battles in a run
   * @see {@link Challenge.applyFixedBattle}
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
  FLIP_STAT
}
