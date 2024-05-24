import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const phases: SimpleTranslationEntries = {
  "berryNervous": "{{pokemonName}} est trop\nnerveux pour manger des baies !",
  "restoredHp": "Les PV de {{pokemonName}} ont été restaurés.",
  "moveDisabled": "{{moveName}} est désactivé !",
  "moveUsed": "{{pokemonName}} utilise\n{{moveName}} !",
  "attackMissed": "L'attaque de {{pokemonName}}\na raté !",
  "fainted": "{{pokemonName}} est K.O. !",
  "rewards": "Vous avez reçu\n{{rewardsName}} !",
  "gamemodeReward": "{{name}} a battu le mode {{gamemodeName}} pour la première fois !\nVous avez reçu {{rewardsName}} !",
  "retry": "Voulez-vous recommencer depuis le début du combat ?",
  "unlocked": "{{unlockableName}}\na été débloqué.",
  "fullHp": "Les PV de {{pokemonName}} sont au maximum !",
} as const;
