import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}}[[는]] {{abilityName}} 때문에\n반동 데미지를 받지 않는다!",
  "badDreams": "{{pokemonName}}[[는]]\n나이트메어 때문에 시달리고 있다!",
  "windPowerCharged": "{{pokemonName}}[[는]]\n{{moveName}}에 맞아 충전되었다!",
  "perishBody": "{{pokemonName}}의 {{abilityName}} 때문에\n양쪽 포켓몬 모두는 3턴 후에 쓰러져 버린다!",
  "poisonHeal": "{{pokemonName}}[[는]] {{abilityName}}[[로]]인해\n조금 회복했다.",
  "iceFaceAvoidedDamage": "{{pokemonName}}[[는]] {{abilityName}} 때문에\n데미지를 받지 않는다!",
} as const;
