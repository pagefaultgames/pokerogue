import type { ObjectValues } from "#types/type-helpers";

export const ChallengeCategory = {
  MISC: 1,
  CHALLENGE: 2,
  NUZLOCKE: 3,
  RANDOMIZER: 4,
} as const;

export type ChallengeCategory = ObjectValues<typeof ChallengeCategory>;
