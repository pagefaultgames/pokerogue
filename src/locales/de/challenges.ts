import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "Herausforderungsmodifikatoren",
  "illegalEvolution": "{{pokemon}} hat sich in ein Pokémon verwandelt, dass für diese Herausforderung nicht zulässig ist!",
  "illegalMove": "{{moveName}} ist nicht für diese Herausforderung zulässig!",
  "singleGeneration": {
    "name": "Mono-Generation",
    "desc": "Du kannst nur Pokémon aus der {{gen}} Generation verwenden.",
    "desc_default": "Du kannst nur Pokémon gewählten Generation verwenden.",
    "gen_1": "ersten",
    "gen_2": "zweiten",
    "gen_3": "dritten",
    "gen_4": "vierten",
    "gen_5": "fünften",
    "gen_6": "sechsten",
    "gen_7": "siebten",
    "gen_8": "achten",
    "gen_9": "neunten",
  },
  "singleType": {
    "name": "Mono-Typ",
    "desc": "Du kannst nur Pokémon des Typs {{type}} verwenden.",
    "desc_default": "Du kannst nur Pokémon des gewählten Typs verwenden."
    // types in pokemon-info
  },
  "nuzlocke": {
    "name": "Nuzlocke",
    "desc": "Die Nuzlocke Herausforderung beinhaltet verschiedene Einschränkungen, um eine besondere Herausforderung zu gestalten.",
    "desc.1": "- Keine Beleber.\n- Nur das erste Pokémon nach einem Biomwechsel kann zum Team hinzugefügt werden.\n",
    "desc.2": "- Keine Beleber.\n- Nur das erste Pokémon nach einem Biomwechsel kann zum Team hinzugefügt werden.\n- Keine Heilung bei Biomwechsel.\n- Keine Legendären Starter.",
    "value.0": "Aus",
    "value.1": "Regulär",
    "value.2": "Hardcore",
  },
  "freshStart": {
    "name": "Neuanfang",
    "desc": "Du kannst nur die ursprünglichen Starter verwenden, genau so, als hättest du gerade erst mit Pokérogue begonnen.",
    "value.0": "Aus",
    "value.1": "An",
  }
} as const;
