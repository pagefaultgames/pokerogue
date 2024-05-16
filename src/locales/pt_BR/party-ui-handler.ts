import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const partyUiHandler: SimpleTranslationEntries = {
    "choosePokemon": "Choose a Pokémon.",
    "cantReleaseInBattle": "You can\'t release a Pokémon that\'s in battle!",
    "what2doWithPoke": "Do what with this Pokémon?",
    "cancelShort": "Cancel",
    "selectMove": "Select a move.",
    "selectHeldItemTransfer": "Select a held item to transfer.",
    "selectSplice": "Select another Pokémon to splice.",
    "deactivate": "Deactivate",
    "activate": "Activate",
    "SEND_OUT": "Send Out",
    "SUMMARY": "Summary",
    "RELEASE": "Release",
    "CANCEL": "Cancel",
    "unpauseEvolution": "Evolutions have been unpaused for {{pokemonName}}",
    "unsplicePokemon": "`Do you really want to unsplice {{fusionSpeciesName}}\nfrom {{pokemonName}? {{fusionSpeciesName}} will be lost.",
    "spliceRevertText": "{{fusionName}} was reverted to {{pokemonName}}.",
    "releasePokemon": "Do you really want to release {{pokemonName}}?",

} as const;