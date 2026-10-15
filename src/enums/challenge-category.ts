import type { ValueOf } from "type-fest";

export const ChallengeCategory = {
  DIFFICULTY: 1,
  STARTERS: 2,
  RANDOMIZER: 3,
  GIMMICK: 4,
  UNUSED: 5,
} as const;

export type ChallengeCategory = ValueOf<typeof ChallengeCategory>;
