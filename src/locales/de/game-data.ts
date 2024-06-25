import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const gameData: SimpleTranslationEntries = {
  "systemData": "System",
  "sessionData": "Session",
  "settingsData": "Einstellungen",
  "tutorialsData": "Tutorials",
  "seenDialoguesData": "Gesehener Dialog",

  "dataCouldNotBeLoaded": "Deine {{dataName}} Daten konnten nicht geladen werden. Möglicherweise sind sie beschädigt.",
  "dataWillBeOverridden": "Deine {{dataName}} Daten werden überschrieben und die Seite wird neugeladen. Fortfahren?",
  "errorContactServer": "Konnte den Server nicht kontaktieren. Deine {{dataName}} Daten konnten nicht importiert werden.",
  "errorUpdating": "Es ist ein Fehler aufgetreten während die {{dataName}} aktualisiert wurden. Kontaktiere bitte einen Administrator.",
} as const;
