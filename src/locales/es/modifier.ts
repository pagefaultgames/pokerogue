import { SimpleTranslationEntries } from "#app/plugins/i18n.js";

export const modifier: SimpleTranslationEntries = {
    "recieveModifier": "Recibe {{modifier}} {{amount}}x",
    "catchRate": "Ratio de captura: {{multiplier}}",
    "hpRestore": "Restaura {{restorePoints}} PS o {{restorePercent}}% de los PS de un Pokémon, lo que sea mayor",
    "revive": "Revive a un Pokémon y restaura el {{restorePercent}}% de los PS",
    "ppRestore": "Restaura {{restorePoints}} PP de un movimiento de un Pokémon",
    "ppRestoreAll": "Restaura {{restorePoints}} PP de todos los movimientos de un Pokémon",
    "ppUp": "Aumenta permanentemente los PP de un movimiento de un Pokémon en {{upPoints}} por cada 5 PP máximos (máximo 3)",
    "lure": "Duplica la probabilidad de que un encuentro sea una batalla doble durante {{battleCount}} batallas",
    "tempBattleStatBoost": "Aumenta el {{tempBattleStat}} de todos los miembros del equipo en 1 nivel durante 5 batallas",
    "baseStatBoost": "Aumenta el {{stat}} base del portador en un 10%. Cuanto más altos sean tus IV, mayor será el límite de acumulación.",
    "atkTypeBooster": "Aumenta el poder de los movimientos de tipo {{type}} de un Pokémon en un 20%",

} as const;
