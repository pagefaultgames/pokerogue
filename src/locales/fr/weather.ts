import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
    "sunnyStartMessage": "Les rayons du soleil brillent !",
    "sunnyLapseMessage": "Les rayons du soleil brillent fort.",
    "sunnyClearMessage": "Les rayons du soleil se dissipent.",

    "rainStartMessage": "Il commence à pleuvoir !",
    "rainLapseMessage": "La pluie continue.",
    "rainClearMessage": "La pluie s'est arrêtée.",

    "sandstormStartMessage": "Une tempête de sable se prépare !",
    "sandstormLapseMessage": "La tempête de sable fait rage.",
    "sandstormClearMessage": "La tempête de sable se calme.",
    "sandstormDamageMessage": "{{pokemonPrefix}}{{pokemonName}} subit les dégâts\nde la tempête de sable !",

    "hailStartMessage": "Il commence à grêler !",
    "hailLapseMessage": "La grêle continue.",
    "hailClearMessage": "La grêle s'est arrêtée.",
    "hailDamageMessage": "{{pokemonPrefix}}{{pokemonName}} subit les dégâts\nde la grêle !",

    "snowStartMessage": "Il commence à neiger !",
    "snowLapseMessage": "La neige continue de tomber.",
    "snowClearMessage": "La neige s'est arrêtée.",

    "fogStartMessage": "Un brouillard épais émerge !",
    "fogLapseMessage": "Le brouillard continue.",
    "fogClearMessage": "Le brouillard a disparu.",

    "heavyRainStartMessage": "Une pluie battante s'abat soudainement !",
    "heavyRainLapseMessage": "La pluie battante continue.",
    "heavyRainClearMessage": "La pluie battante s'est arrêtée.",
    
    "harshSunStartMessage": "Les rayons du soleil s'intensifient !",
    "harshSunLapseMessage": "Le soleil est brûlant.",
    "harshSunClearMessage": "Le soleil brûlant se dissipe.",

    "strongWindsStartMessage": "Un vent violent se lève !",
    "strongWindsLapseMessage": "Le vent souffle violemment.",
    "strongWindsClearMessage": "Le vent violent s'est arrêté."
}