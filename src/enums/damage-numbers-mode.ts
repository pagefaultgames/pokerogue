import type { ValueOf } from "type-fest";

export const DamageNumbersMode = {
  OFF: 0,
  SIMPLE: 1,
  FANCY: 2,
} as const;

export type DamageNumbersMode = ValueOf<typeof DamageNumbersMode>;
