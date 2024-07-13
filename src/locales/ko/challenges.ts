import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "챌린지 조건 설정",
  "illegalEvolution": "{{pokemon}}[[는]] 현재의 챌린지에\n부적합한 포켓몬이 되었습니다!",
  "illegalMove": "{{moveName}} is not a valid move for this challenge!",
  "singleGeneration": {
    "name": "단일 세대",
    "desc": "{{gen}}의 포켓몬만 사용할 수 있습니다.",
    "desc_default": "선택한 세대의 포켓몬만 사용할 수 있습니다.",
    "gen_1": "1세대",
    "gen_2": "2세대",
    "gen_3": "3세대",
    "gen_4": "4세대",
    "gen_5": "5세대",
    "gen_6": "6세대",
    "gen_7": "7세대",
    "gen_8": "8세대",
    "gen_9": "9세대",
  },
  "singleType": {
    "name": "단일 타입",
    "desc": "{{type}} 타입의 포켓몬만 사용할 수 있습니다.",
    "desc_default": "선택한 타입의 포켓몬만 사용할 수 있습니다."
    //type in pokemon-info
  },
  "nuzlocke": {
    "name": "Nuzlocke",
    "desc": "The Nuzlocke Challenge offers various restrictions to create a special challenge.",
    "desc.1": "- No revives.\n- Only the first Pokémon after a biome change can be added to the party.\n",
    "desc.2": "- No revives.\n- Only the first Pokémon after a biome change can be added to the party.\n- No heal at the end of every 10th wave.\n- No legendary starters.",
    "value.0": "Off",
    "value.1": "Regular",
    "value.2": "Hardcore",
  }
} as const;
