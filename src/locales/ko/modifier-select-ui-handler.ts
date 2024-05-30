import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const modifierSelectUiHandler: SimpleTranslationEntries = {
  "transfer": "도구 이동",
  "reroll": "새로고침",
  "lockRarities": "레어도 고정",
  "transferDesc": "포켓몬이 지닌 도구를 다른 포켓몬에게 옮깁니다.",
  "rerollDesc": "소지금을 사용하여 선택 가능한 도구들을 새로고침합니다.",
  "lockRaritiesDesc": "새로고침할 때 도구 레어도를 고정합니다(새로고침 비용 상승함).",
  "rerollCost": "₽{{cost}}",
  "itemCost": "₽{{cost}}"
} as const;
