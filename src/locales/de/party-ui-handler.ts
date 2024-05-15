import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const partyUiHandler: SimpleTranslationEntries = {
    "choosePokemon": "Wähle ein Pokémon.",
    "cantReleaseInBattle": "Kämpfende Pokémon können\n nicht freigelassen werden.",
    "what2doWithPoke": "Was möchtest du mit diesem Pokémon tun?",
    "cancelShort": "Abbrechen",
    "selectMove": "Wähle eine Attacke.",
    "selectHeldItemTransfer": "Wähle welches Item du übertragen möchtest.",
    "selectSplice": "Wähle ein Pokémon zum verbinden.",
    "deactivate": "Deaktivieren",
    "activate": "Aktivieren",
    "SEND_OUT": "Einwechseln",
    "SUMMARY": "Info",
    "RELEASE": "Freilassen",
    "CANCEL": "Abbrechen",
    "unpauseEvolution": "{{pokemonName}} kann jetzt wieder\nentwickelt werden.",
    "unsplicePokemon": "Willst du wirklich {{fusionSpeciesName}}\nvon {{pokemonName}} trennen? {{fusionSpeciesName}} wird freigelassen.",
    "spliceRevertText": "{{fusionName}} wurde wieder zu {{pokemonName}}.",
    "releasePokemon": "Willst du {{pokemonName}} wirklich freilassen?",
} as const;