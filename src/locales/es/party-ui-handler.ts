import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const partyUiHandler: SimpleTranslationEntries = {
    "choosePokemon": "Elige un Pokémon.",
    "cantReleaseInBattle": "¡No puedes liberar un Pokémon en combate!",
    "what2doWithPoke": "¿Qué hacer con este Pokémon?",
    "cancelShort": "Cancel",
    "selectMove": "Elige un movimiento.",
    "selectHeldItemTransfer": "Elige qué objeto transferir.",
    "selectSplice": "Elige otro Pokémon para la fusión.",
    "deactivate": "Desactivar",
    "activate": "Activar",
    "SEND_OUT": "Cambiar",
    "SUMMARY": "Datos",
    "RELEASE": "Liberar",
    "CANCEL": "Cancelar",
    "unpauseEvolution": "Evolutions have been unpaused for {{pokemonName}}",
    "unsplicePokemon": "`Do you really want to unsplice {{fusionSpeciesName}}\nfrom {{pokemonName}? {{fusionSpeciesName}} will be lost.",
    "spliceRevertText": "{{fusionName}} was reverted to {{pokemonName}}.",
    "releasePokemon": "Do you really want to release {{pokemonName}}?",

} as const;