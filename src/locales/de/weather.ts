import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
    "sunnyStartMessage": "Die Sonne hellt auf!",
    "sunnyLapseMessage": "Die Sonne blendet.",
    "sunnyClearMessage": "Die Sonne schwächt ab.",

    "rainStartMessage": "Es fängt an zu regnen!",
    "rainLapseMessage": "Es regnet weiterhin.",
    "rainClearMessage": "Es hört auf zu regnen.",

    "sandstormStartMessage": "Ein Sandsturm braut sich zusammen!",
    "sandstormLapseMessage": "Der Sandsturm tobt.",
    "sandstormClearMessage": "Der Sandsturm lässt nach.",
    "sandstormDamageMessage": "{{pokemonPrefix}}{{pokemonName}} ist vom\nSandsturm beeinträchtigt!",

    "hailStartMessage": "Es fängt an zu hageln!",
    "hailLapseMessage": "Es hagelt weiterhin.",
    "hailClearMessage": "Es hört auf zu hageln.",
    "hailDamageMessage": "{{pokemonPrefix}}{{pokemonName}} ist vom\nHagel beeinträchtigt!",

    "snowStartMessage": "Es fängt an zu schneien!",
    "snowLapseMessage": "Es schneit weiterhin.",
    "snowClearMessage": "Es hört auf zu schneien.",

    "fogStartMessage": "Es fängt an zu nebeln!",
    "fogLapseMessage": "Es nebelt weiterhin.",
    "fogClearMessage": "Es hört auf zu nebeln.",

    "heavyRainStartMessage": "Ein Starkregen beginnt!",
    "heavyRainLapseMessage": "Der Starkregen hält an.",
    "heavyRainClearMessage": "Der Starkregen lässt nach.",
    
    "harshSunStartMessage": "Das Sonnenlicht wird wärmer!",
    "harshSunLapseMessage": "Das Sonnenlicht brennt.",
    "harshSunClearMessage": "Das Sonnenlicht schwächt ab.",

    "strongWindsStartMessage": "Ein starker Wind zieht auf!",
    "strongWindsLapseMessage": "Der starke Wind tobt.",
    "strongWindsClearMessage": "Der starke Wind legt sich."
}
