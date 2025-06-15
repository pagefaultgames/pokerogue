import type { Head, Tail } from "#app/@types/utility-types/tuple";

// biome-ignore lint/correctness/noUnusedImports: Type Imports
import type { PermanentStat, BattleStat } from "#enums/stat";

type StatTuple = [
  hp: number,
  atk: number,
  def: number,
  spAtk: number,
  spDef: number,
  spd: number,
  acc: number,
  eva: number,
];

/** Tuple containing all {@linkcode PermanentStat}s of a Pokemon. */
export type PermanentStatTuple = Head<Head<StatTuple>>;
/** Tuple containing all {@linkcode BattleStat}s of a Pokemon. */
export type BattleStatTuple = Tail<PermanentStatTuple>;

// Since typescript lacks integer range unions, we have to use THIS abomination to strongly type an IV
export type IVType =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31;

type toIvTuple<T extends [...any]> = { [k in keyof T]: IVType };

export type IVTuple = toIvTuple<PermanentStatTuple>;
