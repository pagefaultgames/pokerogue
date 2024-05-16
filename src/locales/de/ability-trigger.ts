import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
    'blockRecoilDamage' : `{{pokemonName}} wurde durch {{abilityName}}\nvor Rückstoß geschützt!`,
    'stockpile' : `{{pokemonName}}\n hat {{stockpileNumber}} gehortet!`
} as const;
