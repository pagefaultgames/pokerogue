import { SimpleTranslationEntries, ChallengeTranslationEntries } from "#app/plugins/i18n";

export const challengeUiHandler: SimpleTranslationEntries = {
  "CHALLENGE_TITLE": "Challenge Modifiers",
  "CHALLENGE_POINTS": "Bad Ideas",
  "CONFIRM_START": "Proceed with these challenges?"
} as const;

export const challenges: ChallengeTranslationEntries = {
  singleGeneration: {
    name: "Mono Gen",
    description: "Only allows using pokemon from the chosen generation"
  },
  singleType: {
    name: "Mono Type",
    description: "Only allows using pokemon of the chosen type"
  },
  lowerMaxStarterCost: {
    name: "Lower Starter Cap",
    description: "Only allows pokemon up to the specified cost"
  },
  lowerStarterPoints: {
    name: "Less Starter Points",
    description: "Lowers your available points to the specified value"
  }
} as const;
