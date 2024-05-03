import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**
 * The menu namespace holds most miscellaneous text that isn't directly part of the game's
 * contents or directly related to Pokemon data. This includes menu navigation, settings,
 * account interactions, descriptive text, etc.
 */
export const menu: SimpleTranslationEntries = {
    "cancel": "Annulla",
    "continue": "Continua",
    "newGame": "Nuova Partita",
    "loadGame": "Carica Partita",
    "dailyRun": "Run Giornaliera (Beta)",
    "selectGameMode": "Seleziona una modalità di gioco.",
    "logInOrCreateAccount": "Effettua il log-in o registrati per giocare, non è richiesta nessuna mail!",
    "username": "Username",
    "password": "Password",
    "login": "Login",
    "register": "Registrati",
    "emptyUsername": "L'username non può essere vuoto",
    "invalidLoginUsername": "L'username scelto non è valido",
    "invalidRegisterUsername": "L'username può contenere lettere, numeri o underscore",
    "invalidLoginPassword": "La password sceltra non è valida",
    "invalidRegisterPassword": "La Password deve avere 6 o più caratteri",
    "usernameAlreadyUsed": "L'username scelto è già in uso",
    "accountNonExistent": "L'username inserito non è valido",
    "unmatchingPassword": "La password inserita non corrisponde",
    "passwordNotMatchingConfirmPassword": "Le password devono essere uguali!",
    "confirmPassword": "Conferma password",
    "registrationAgeWarning": "Con la registrazione, confermi di avere 13 anni o più.",
    "backToLogin": "Torna al login",
    "failedToLoadSaveData": "Impossibile caricare i dati, prova a ricaricare la pagina.\nSe il problema persiste, contatta un amministratore.",
    "sessionSuccess": "Sessione caricata con successo.",
    "failedToLoadSession": "I tuoi dati relativi alla sessione non sono stati caricati.\nPotrebbero essere corrotti.",
    "boyOrGirl": "Sei un ragazzo o una ragazza?",
    "boy": "Ragazzo",
    "girl": "Ragazza",
    "dailyRankings": "Classifica Giornaliera",
    "weeklyRankings": "Classifica Settimanale",
    "noRankings": "Classifica Assente",
    "loading": "Caricamento",
    "playersOnline": "Giocatori Online"
} as const;