import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const gameData: SimpleTranslationEntries = {
  "systemData": "sistema",
  "sessionData": "sesión",
  "settingsData": "ajustes",
  "tutorialsData": "tutoriales",
  "seenDialoguesData": "diálogos leídos",

  "dataCouldNotBeLoaded": "Tus datos "{{dataName}}" no se han podido cargar. Puede que estén corruptos.",
  "dataWillBeOverridden": "Tus datos "{{dataName}}" se sobreescribirán y la página recargará, ¿estás seguro?",
  "errorContactServer": "No se pudo contactar con el servidor. Tus datos "{{dataName}}" no han podido ser importados.",
  "errorUpdating": "Un error ha ocurrido mientras se subían los datos "{{dataName}}". Por favor, ponte en contacto con el administrador.",
} as const;
