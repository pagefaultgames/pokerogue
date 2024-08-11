export enum Stat {
  /** Hit Points */
  HP = 0,
  /** Attack */
  ATK,
  /** Defense */
  DEF,
  /** Special Attack */
  SPATK,
  /** Special Defense */
  SPDEF,
  /** Speed */
  SPD,
  /** Accuracy */
  ACC,
  /** Evasiveness */
  EVA
}

export const PERMANENT_STATS = [ Stat.HP, Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ] as const;
export type PermanentStat = typeof PERMANENT_STATS[number];

export const BATTLE_STATS = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD, Stat.ACC, Stat.EVA ] as const;
export type BattleStat = typeof BATTLE_STATS[number];

export const TEMP_BATTLE_STATS = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD, Stat.ACC ] as const;
export type TempBattleStat = typeof TEMP_BATTLE_STATS[number];
