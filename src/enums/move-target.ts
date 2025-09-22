export enum MoveTarget {
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_the_user Moves that target the User} */
  USER,
  OTHER,
  ALL_OTHERS,
  NEAR_OTHER,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_all_adjacent_Pok%C3%A9mon Moves that target all adjacent Pokemon} */
  ALL_NEAR_OTHERS,
  NEAR_ENEMY,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_all_adjacent_foes Moves that target all adjacent foes} */
  ALL_NEAR_ENEMIES,
  RANDOM_NEAR_ENEMY,
  ALL_ENEMIES,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Counterattacks Counterattacks} */
  ATTACKER,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_one_adjacent_ally Moves that target one adjacent ally} */
  NEAR_ALLY,
  ALLY,
  USER_OR_NEAR_ALLY,
  USER_AND_ALLIES,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_all_Pok%C3%A9mon Moves that target all Pokemon} */
  ALL,
  USER_SIDE,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Entry_hazard-creating_moves Entry hazard-creating moves} */
  ENEMY_SIDE,
  BOTH_SIDES,
  PARTY,
  CURSE,
}
