import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**
 * The menu namespace holds most miscellaneous text that isn't directly part of the game's
 * contents or directly related to Pokemon data. This includes menu navigation, settings,
 * account interactions, descriptive text, etc.
 */
export const menu: SimpleTranslationEntries = {
    "cancel": "Cancelar",
    "continue": "Continuar",
    "dailyRun": "Reto diario (Beta)",
    "loadGame": "Cargar partida",
    "newGame": "Nueva partida",
    "selectGameMode": "Elige un modo de juego.",
    "logInOrCreateAccount": "Inicia sesión o crea una cuenta para empezar. ¡No se requiere correo electrónico!",
    "failedToLoadSaveData": "No se ha podido cargar los datos guardados. Por favor, recarga la página.\nSi el fallo continúa, por favor contacta al administrador.",
    "sessionSuccess": "Sesión cargada con éxito.",
    "failedToLoadSession": "No se ha podido cargar los datos de tu sesión.\nPuede que estén corruptos.",
    "boyOrGirl": "¿Eres un chico o una chica?",
    "boy": "Chico",
    "girl": "Chica",
    "dailyRankings": "Rankings Diarios",
    "weeklyRankings": "Rankings Semanales",
    "noRankings": "Sin Rankings",
    "loading": "Cargando…",
    "playersOnline": "Jugadores en Línea",
    "empty":"Vacío",
    "yes":"Sí",
    "no":"No",
    "confirmStartTeam":'¿Comenzar con estos Pokémon?',
} as const;