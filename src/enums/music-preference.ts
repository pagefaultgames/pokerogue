import type { ValueOf } from "type-fest";

export const MusicPreference = {
  GEN_FIVE: 0,
  ALL_GENS: 1,
} as const;

export type MusicPreference = ValueOf<typeof MusicPreference>;
