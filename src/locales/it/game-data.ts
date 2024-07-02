import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const gameData: SimpleTranslationEntries = {
  "systemData": "sistema",
  "sessionData": "sessione",
  "settingsData": "impostazioni",
  "tutorialsData": "tutorials",
  "seenDialoguesData": "dialoghi già visti",

  "dataCouldNotBeLoaded": "I tuoi dati {{dataName}} non possono essere caricati. Potrebbero essere corrotti.",
  "dataWillBeOverridden": "I tuoi dati {{dataName}} saranno sovrascritti e la pagina verrà ricaricata. Confermi?",
  "errorContactServer": "Errore nel contattare il server. I tuoi dati {{dataName}} non possono essere importati.",
  "errorUpdating": "Abbiamo riscontrato errori nel caricare i dati {{dataName}}. Contatta l'amministratore.",
} as const;
