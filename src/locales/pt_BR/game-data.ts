import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const gameData: SimpleTranslationEntries = {
  "systemData": "sistema",
  "sessionData": "sessão",
  "settingsData": "configurações",
  "tutorialsData": "tutoriais",
  "seenDialoguesData": "diálogos vistos",

  "dataCouldNotBeLoaded": "Seus dados de {{dataName}} não puderam ser carregados. Eles podem estar corrompidos.",
  "dataWillBeOverridden": "Seus dados de {{dataName}} serão substituídos. Continuar?",
  "errorContactServer": "Não foi possível conectar ao servidor. Seus dados de {{dataName}} não puderam ser carregados.",
  "errorUpdating": "Um erro ocorreu ao atualizar seus dados de {{dataName}}. Por favor, contate um administrador.",
} as const;
