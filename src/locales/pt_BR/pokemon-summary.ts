import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Info. Pokémon",
  "status": "Status",
  "powerAccuracyCategory": "Poder\nPrecisão\nCategoria",
  "type": "Tipo",
  "unknownTrainer": "Desconhecido",
  "ot": "TO",
  "nature": "natureza",
  "expPoints": "Pontos EXP.",
  "nextLv": "Próx. Nv.",
  "cancel": "Cancelar",

  "memoString": "Natureza {{natureFragment}},\n{{metFragment}}",
  "metFragment": {
    "normal": "encontrado no Nv.{{level}},\n{{biome}}.",
    "apparently": "aparentemente encontrado no Nv.{{level}},\n{{biome}}.",
  },
} as const;
