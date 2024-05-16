import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const partyUiHandler: SimpleTranslationEntries = {
    "choosePokemon": "Choisissez un Pokémon.",
    "cantReleaseInBattle": "Impossible de relâcher un Pokémon au combat !",
    "what2doWithPoke": "Que faire avec ce Pokémon ?",
    "cancelShort": "Annuler",
    "selectMove": "Sélectionnez une capacité.",
    "selectHeldItemTransfer": "Sélectionnez un objet à transférer.",
    "selectSplice": "Choisissez-en un autre à fusionner.",
    "deactivate": "Désactiver",
    "activate": "Activer",
    "SEND_OUT": "Envoyer",
    "SUMMARY": "Résumé",
    "RELEASE": "Relâcher",
    "CANCEL": "Annuler",
    "unpauseEvolution": "Evolutions have been unpaused for {{pokemonName}}",
    "unsplicePokemon": "`Do you really want to unsplice {{fusionSpeciesName}}\nfrom {{pokemonName}? {{fusionSpeciesName}} will be lost.",
    "spliceRevertText": "{{fusionName}} was reverted to {{pokemonName}}.",
    "releasePokemon": "Do you really want to release {{pokemonName}}?",
} as const;

