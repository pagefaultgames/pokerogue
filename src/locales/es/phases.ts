import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const phases: SimpleTranslationEntries = {
  "berryNervous": "{{pokemonName}} is too\nnervous to eat berries!",
  "restoredHp": "{{pokemonName}}'s\nHP was restored.",
  "moveDisabled": "{{moveName}} is disabled!",
  "moveUsed": "{{pokemonName}} used\n{{moveName}}!",
  "attackMissed": "{{pokemonName}}'s\nattack missed!",
  "fainted": "{{pokemonName}} fainted!",
  "rewards": "You received\n{{rewardsName}}!",
  "gamemodeReward": "{{name}} beat {{gamemodeName}} Mode for the first time!\nYou received {{rewardsName}}!",
  "retry": "Would you like to retry from the start of the battle?",
  "unlocked": "{{unlockableName}}\nhas been unlocked.",
  "fullHp": "{{pokemonName}}'s\nHP is full!",
} as const;
