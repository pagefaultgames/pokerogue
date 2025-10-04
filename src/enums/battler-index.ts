/**
 * The index of a given Pokemon on-field. \
 * Used as an index into `globalScene.getField`, as well as for most target-specifying effects.
 */
export enum BattlerIndex {
  ATTACKER = -1,
  PLAYER,
  PLAYER_2,
  ENEMY,
  ENEMY_2,
}

export type FieldBattlerIndex = BattlerIndex.PLAYER | BattlerIndex.PLAYER_2 | BattlerIndex.ENEMY | BattlerIndex.ENEMY_2;
