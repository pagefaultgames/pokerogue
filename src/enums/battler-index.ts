export enum BattlerIndex {
  ATTACKER = -1,
  PLAYER,
  PLAYER_2,
  ENEMY,
  ENEMY_2,
}

export type FieldBattlerIndex = BattlerIndex.PLAYER | BattlerIndex.PLAYER_2 | BattlerIndex.ENEMY | BattlerIndex.ENEMY_2;
