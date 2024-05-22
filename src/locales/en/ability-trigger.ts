import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
    'blockRecoilDamage' : `{{pokemonName}}'s {{abilityName}}\nprotected it from recoil!`,
    'stockpile' : `{{pokemonName}}\nstockpiled {{stockpileNumber}}!`,
    'badDreams': `{{pokemonName}} is tormented!`,
} as const;