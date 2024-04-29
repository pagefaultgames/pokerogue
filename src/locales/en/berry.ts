import { BerryTranslationEntries } from "#app/plugins/i18n.js";

export const berry: BerryTranslationEntries = {
    "SITRUS": {
        "name": "Sitrus",
        "description": "Restores 25% HP if HP is below 50%"
    },
    "LUM" : {
        "name": "Lum",
        "description": "Cures any non-volatile status condition and confusion"
    },
    "ENIGMA": {
        "name": "Enigma",
        "description": "Restores 25% HP if hit by a super effective move"
    },
    "LIECHI": {
        "name": "Liechi",
        "description": "$t('modifier.berry')"
    },
    "GANLON": {
        "name": "Ganlon",
        "description": "$t('modifier.berry')"
    },
    "PETAYA": {
        "name": "Petaya",
        "description": "$t('modifier.berry')"
    },
    "APICOT": {
        "name": "Apicot",
        "description": "$t('modifier.berry')"
    },
    "SALAC": {
        "name": "Salac",
        "description": "$t('modifier.berry')"
    },
    "LANSAT": {
        "name": "Lansat",
        "description": "Raises critical hit ratio if HP is below 25%"
    },
    "STARF": {
        "name": "Starf",
        "description": "Sharply raises a random stat if HP is below 25%"
    },
    "LEPPA": {
        "name": "Leppa",
        "description": "Restores 10 PP to a move if its PP reaches 0"
    },
} as const;