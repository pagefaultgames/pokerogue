import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const fightUiHandler: SimpleTranslationEntries = {
  "pp": "PP",
  "power": "พลัง",
  "accuracy": "ความแม่นยำ",
  "abilityFlyInText": " {{pokemonName}} ของคุณใช้ {{passive}}{{abilityName}}",
  "passive": "พาสซีฟ " // ช่องว่างที่ส่วนท้ายสำคัญ
} as const;
