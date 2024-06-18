import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const runHistory: SimpleTranslationEntries = {
  "victory": "Victory!",
  "defeatedWild": "Defeated by ",
  "defeatedTrainer": "Defeated by ",
  "defeatedTrainerDouble": "Defeated by Duo",
  "defeatedRival": "Defeated by Rival",
  "luck":"Luck",
  "score":"Score"
} as const;

//Mode Information found in game-mode.ts
//Wave / Lv found in save-slot-select-ui-handler.ts