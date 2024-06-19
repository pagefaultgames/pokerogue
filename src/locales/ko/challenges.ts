import { TranslationEntries } from "#app/interfaces/locales";

export const challenges: TranslationEntries = {
  "title": "챌린지 조건 설정",
  "illegalEvolution": "{{pokemon}} changed into an ineligble pokémon\nfor this challenge!",
  "usePokemon": "{{desc}}의 포켓몬만 사용할 수 있습니다.",
  "singleGeneration": {
    "name": "단일 세대",
    "desc_default": "선택한 세대",
    "desc_1": "1세대",
    "desc_2": "2세대",
    "desc_3": "3세대",
    "desc_4": "4세대",
    "desc_5": "5세대",
    "desc_6": "6세대",
    "desc_7": "7세대",
    "desc_8": "8세대",
    "desc_9": "9세대",
  },
  "singleType": {
    "name": "단일 타입",
    "desc": "{{type}} 타입",
    "desc_default": "선택한 타입"
  },
} as const;
