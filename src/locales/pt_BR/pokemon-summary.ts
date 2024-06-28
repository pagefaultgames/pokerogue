import { TranslationEntries } from "#app/interfaces/locales";

export const pokemonSummary: TranslationEntries = {
  "pokemonInfo": "Informações do Pokémon",
  "status": "Status",
  "powerAccuracyCategory": "Poder\nPrecisão\nCategoria",
  "type": "Tipo",
  "unknownTrainer": "Desconhecido",
  "ot": "TO",
  "luck": "Sorte",
  "expPoints": "Pontos EXP.",
  "nextLv": "Próx. Nv.",
  "cancel": "Cancelar",

  "memoString": "{{natureFragment}} natureza,\n{{metFragment}}",
  "metFragment": {
    "normal": "encontrado no Nv.{{level}},\n{{biome}}.",
    "apparently": "aparentemente encontrado no Nv.{{level}},\n{{biome}}.",
  },
} as const;
