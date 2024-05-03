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
    "dailyRun": "Corsa Giornaliera (Beta)",
    "selectGameMode": "Seleziona una modalità di gioco.",
    "logInOrCreateAccount": "Log in or create an account to start. No email required!",
    "username": "Username",
    "password": "Password",
    "login": "Login",
    "register": "Register",
    "emptyUsername": "Username must not be empty",
    "invalidLoginUsername": "The provided username is invalid",
    "invalidRegisterUsername": "Username must only contain letters, numbers, or underscores",
    "invalidLoginPassword": "The provided password is invalid",
    "invalidRegisterPassword": "Password must be 6 characters or longer",
    "usernameAlreadyUsed": "The provided username is already in use",
    "accountNonExistent": "The provided user does not exist",
    "unmatchingPassword": "The provided password does not match",
    "passwordNotMatchingConfirmPassword": "Password must match confirm password",
    "confirmPassword": "Confirm Password",
    "registrationAgeWarning": "By registering, you confirm you are of 13 years of age or older.",
    "backToLogin": "Back to Login",
    "failedToLoadSaveData": "Failed to load save data. Please reload the page.\nIf this continues, please contact the administrator.",
    "sessionSuccess": "Session loaded successfully.",
    "failedToLoadSession": "Your session data could not be loaded.\nIt may be corrupted.",
    "boyOrGirl": "Are you a boy or a girl?",
    "boy": "Boy",
    "girl": "Girl",
    "dailyRankings": "Daily Rankings",
    "weeklyRankings": "Weekly Rankings",
    "noRankings": "No Rankings",
    "loading": "Loading…",
    "playersOnline": "Players Online"
} as const;