import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const abilityTriggers: SimpleTranslationEntries = {
    'blockRecoilDamage' : `{{pokemonName}}'s {{abilityName}}\nprotected it from recoil!`,
    'stockpile' : `{{pokemonName}}\nstockpiled {{stockpileNumber}}!`,
    'badDreams' : `{{abilityName}} de {{pokemonName}}\nprotegeu-o do dano de recuo!`
} as const;