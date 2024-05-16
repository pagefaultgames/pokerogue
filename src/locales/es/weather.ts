import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
    "sunnyStartMessage": "¡El sol pega fuerte!",
    "sunnyLapseMessage": "El sol brilla con fuerza.",
    "sunnyClearMessage": "¡El sol vuelve a brillar como\nsiempre!",

    "rainStartMessage": "¡Ha empezado a llover!",
    "rainLapseMessage": "La lluvia sigue cayendo.",
    "rainClearMessage": "La lluvia se ha detenido.",

    "sandstormStartMessage": "¡Se acerca una tormenta de arena!",
    "sandstormLapseMessage": "La tormenta de arena arrecia.",
    "sandstormClearMessage": "La tormenta de arena ha amainado.",
    "sandstormDamageMessage": "¡La tormenta de arena zarandea a\n{{pokemonPrefix}}{{pokemonName}}!",

    "hailStartMessage": "¡Ha empezado a granizar!",
    "hailLapseMessage": "Sigue granizando...",
    "hailClearMessage": "El granizo se ha detenido.",
    "hailDamageMessage": "¡El granizo zarandea a {{pokemonPrefix}}{{pokemonName}}!",

    "snowStartMessage": "¡Ha comenzado a nevar!",
    "snowLapseMessage": "La nieve sigue cayendo.",
    "snowClearMessage": "La nevada se ha detenido.",

    "fogStartMessage": "¡Ha surgido una espesa niebla!",
    "fogLapseMessage": "La niebla es densa...",
    "fogClearMessage": "La niebla se ha disipado.",

    "heavyRainStartMessage": "¡Comienza a diluviar!",
    "heavyRainLapseMessage": "El diluvio continúa...",
    "heavyRainClearMessage": "El diluvio se ha detenido.",
    
    "harshSunStartMessage": "¡El sol se vuelve abrasador!",
    "harshSunLapseMessage": "El sol sigue brillando intensamente.",
    "harshSunClearMessage": "El sol abrasador ha vuelto a\nla normalidad.",

    "strongWindsStartMessage": "¡Se avecina un fuerte viento!",
    "strongWindsLapseMessage": "El viento sopla con intensidad.",
    "strongWindsClearMessage": "Los fuertes vientos se han detenido."
}