import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
    'blockRecoilDamage' : `{{pokemonName}} 的 {{abilityName}}\n抵消了反作用力！`,
    'stockpile' : `{{pokemonName}}\n累积{{stockpileNumber}}点力量!`
} as const;