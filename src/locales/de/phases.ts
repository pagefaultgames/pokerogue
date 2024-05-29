import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const phases: SimpleTranslationEntries = {
  "berryNervous": "{{pokemonName}} ist zu\nnervös um Beeren zu essen!",
  "restoredHp": "Die KP von{{pokemonName}}\n wurden wiederhergestellt",
  "moveDisabled": "{{moveName}} ist blockiert!",
  "moveUsed": "{{pokemonName}} setzt\n{{moveName}} ein!",
  "attackMissed": "Die Attacke von {{pokemonName}}\n hat verfehlt!",
  "fainted": "{{pokemonName}} wurde besiegt!",
  "rewards": "Du erhältst\n{{rewardsName}}!",
  "gamemodeReward": "{{name}} beendete {{gamemodeName}}-Modus zum ersten Mal!\nDu erhältst {{rewardsName}}!",
  "retry": "Willst du diesen Kampf wiederholen?",
  "unlocked": "{{unlockableName}}\nwurde freigeschaltet.",
  "fullHp": "Die KP von {{pokemonName}}\n sind voll!",
} as const;
