import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const gameData: SimpleTranslationEntries = {
  "systemData": "système",
  "sessionData": "de session",
  "settingsData": "des paramètres",
  "tutorialsData": "des tutoriels",
  "seenDialoguesData": "des dialogues connus",

  "dataCouldNotBeLoaded": "Impossible de charger les données {{dataName}}. Elles sont peut-être corrompues.",
  "dataWillBeOverridden": "Les données {{dataName}} seront effacées. Continuer ?",
  "errorContactServer": "Connexion au serveur impossible. Les données {{dataName}} n’ont pas eu être importées.",
  "errorUpdating": "Une erreur est survenue lors du chargement des données {{dataName}}. Contactez un administrateur.",
} as const;
