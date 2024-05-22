import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
    'blockRecoilDamage' : `{{abilityName}}\nde {{pokemonName}} le protège du contrecoup !`,
    'stockpile' : `{{pokemonName}}\nen a stocké {{stockpileNumber}}!`,
    'badDreams': `{{pokemonName}} a le sommeil agité !`
} as const;
