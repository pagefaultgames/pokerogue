import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries= {
  "blockRecoilDamage": "{{pokemonName}} ของคุณใช้ {{abilityName}}\nป้องกันความเสียหายจากการกระเด้ง!",
  "badDreams": "{{pokemonName}} ถูกทรมาน!",
  "windPowerCharged": "ถูกโจมตีโดย {{moveName}} ชาร์จ {{pokemonName}} ด้วยพลัง!",
  "perishBody": "{{pokemonName}} ของคุณใช้ {{abilityName}}\nจะทำให้ทั้งสองโปเกมอนสลบใน 3 เทิร์น!",
  "poisonHeal": "{{pokemonName}} ของคุณใช้ {{abilityName}}\nฟื้นฟู HP เล็กน้อย!",
  "iceFaceAvoidedDamage": "{{pokemonName}} หลีกเลี่ยง\nความเสียหายด้วย {{abilityName}}!"
} as const;
