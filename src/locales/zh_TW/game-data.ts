import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const gameData: SimpleTranslationEntries = {
  "systemData": "system",
  "sessionData": "session",
  "settingsData": "settings",
  "tutorialsData": "tutorials",
  "seenDialoguesData": "seen dialogues",

  "dataCouldNotBeLoaded": "Your {{dataName}} data could not be loaded. It may be corrupted.",
  "dataWillBeOverridden": "Your {{dataName}} data will be overridden and the page will reload. Proceed?",
  "errorContactServer": "Could not contact the server. Your {{dataName}} data could not be imported.",
  "errorUpdating": "An error occurred while updating {{dataName}} data. Please contact the administrator.",
} as const;
