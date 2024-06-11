import { SimpleTranslationEntries } from "#app/plugins/i18n";

/**
 * The weather namespace holds text displayed when weather is active during a battle
 */
export const weather: SimpleTranslationEntries = {
  "sunnyStartMessage": "¡El sol esta brillando!",
  "sunnyLapseMessage": "Hace mucho sol...",
  "sunnyClearMessage": "Se ha ido el sol.",

  "rainStartMessage": "¡Ha empezado a llover!",
  "rainLapseMessage": "Sigue lloviendo...",
  "rainClearMessage": "Ha dejado de llover.",

  "sandstormStartMessage": "¡Se ha desatado una tormenta de arena!",
  "sandstormLapseMessage": "La tormenta de arena arrecia...",
  "sandstormClearMessage": "La tormenta de arena termino.",
  "sandstormDamageMessage": "¡La tormenta de arena zarandea al\n{{pokemonNameWithAffix}}!",

  "hailStartMessage": "¡Ha empezado a granizar!",
  "hailLapseMessage": "Sigue granizando...",
  "hailClearMessage": "Had dejado de granizar.",
  "hailDamageMessage": "El granizo golpea al\n{{pokemonNameWithAffix}}!",

  "snowStartMessage": "¡Ha empezado a nevar!",
  "snowLapseMessage": "Sigue nevando...",
  "snowClearMessage": "Ha dejado de nevar.",

  "fogStartMessage": "La niebla es densa...",
  "fogLapseMessage": "Sigue la niebla...",
  "fogClearMessage": "La niebla ha desaparecido.",

  "heavyRainStartMessage": "¡Ha empezado a diluviar!",
  "heavyRainLapseMessage": "Sigue diluviando...",
  "heavyRainClearMessage": "Ha dejado de diluviar.",

  "harshSunStartMessage": "¡El sol que hace ahora es realmente abrasador!",
  "harshSunLapseMessage": "El sol sigue abrasando.",
  "harshSunClearMessage": "El sol vuelve a brillar como siempre.",

  "strongWindsStartMessage": "¡Comenzó un fuerte viento!",
  "strongWindsLapseMessage": "El viento sopla intensamente.",
  "strongWindsClearMessage": "El fuerte viento cesó."
};
