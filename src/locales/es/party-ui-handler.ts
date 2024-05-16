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
    "unpauseEvolution": "Se ha reactivado la evolución de\n{{pokemonName}}",
    "unsplicePokemon": "`¿Quieres anular la fusión entre {{fusionSpeciesName}}\ny {{pokemonName}? Perderás a {{fusionSpeciesName}}.",
    "spliceRevertText": "{{fusionName}} se ha revertido a {{pokemonName}}.",
    "releasePokemon": "¿Quieres liberar a {{pokemonName}}?",
} as const;