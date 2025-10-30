export enum MoveCategory {
  PHYSICAL,
  SPECIAL,
  STATUS,
}

/** Type representing the category of a damaging move (physical/special) */
export type MoveDamageCategory = Exclude<MoveCategory, MoveCategory.STATUS>;
