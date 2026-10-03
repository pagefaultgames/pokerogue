import type { ValueOf } from "type-fest";

export const EggSkipPreference = {
  NEVER: 0,
  ASK: 1,
  ALWAYS: 2,
} as const;

export type EggSkipPreference = ValueOf<typeof EggSkipPreference>;
