export enum MoveCategory {
  PHYSICAL,
  SPECIAL,
  STATUS,
}

/** Type of damage categories */
export type MoveDamageCategory = Exclude<MoveCategory, MoveCategory.STATUS>;
