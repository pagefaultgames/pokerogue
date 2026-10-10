import type { ValueOf } from "type-fest";

export const ChallengeCategory = {
  GENERAL: 1,
  RANDOMIZER: 2,
  MISC: 3,
  UNUSED: 4,
} as const;

export type ChallengeCategory = ValueOf<typeof ChallengeCategory>;
