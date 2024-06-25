import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const partyUiHandler: SimpleTranslationEntries = {
  "ALL": "Tout",
  "SEND_OUT": "Envoyer",
  "SUMMARY": "Résumé",
  "CANCEL": "Annuler",
  "RELEASE": "Relâcher",
  "APPLY": "Appliquer",
  "TEACH": "Apprendre",
  "UNSPLICE": "Séparer",
  "ACTIVATE": "Activer",
  "DEACTIVATE": "Désactiver",

  "choosePokemon": "Sélectionnez un Pokémon.",
  "noEnergy": "{{pokemonName}} n’a plus l’énergie\nde se battre !",
  "hasEnergy": "{{pokemonName}} peut toujours\nse battre !",
  "cantBeUsed": "{{pokemonName}} ne peut pas\nse battre pour ce challenge !",
  "tooManyItems": "{{pokemonName}} porte trop\nd’exemplaires de cet objet !",
  "anyEffect": "Cela n’aura aucun effet.",
  "unpausedEvolutions": "{{pokemonName}} peut de nouveau évoluer.",
  "unspliceConfirmation": "Voulez-vous vraiment séparer {{fusionName}}\nde {{pokemonName}} ? {{fusionName}} sera perdu.",
  "wasReverted": "{{fusionName}} est redevenu {{pokemonName}}.",
  "releaseConfirmation": "Voulez-vous relâcher {{pokemonName}} ?",
  "releaseInBattle": "Vous ne pouvez pas relâcher Pokémon en combat !",
  "doWhat": "Que faire avec ce Pokémon ?",
  "selectAMove": "Sélectionnez une capacité.",
  "changeQuantity": "Sélect. un objet à transférer.\nChangez la quantité avec < et >.",
  "selectAnotherPokemonToSplice": "Sélectionnez un autre Pokémon à séparer.",
  "cancel": "Sortir",

  // Slot TM text
  "able": "Apte",
  "notAble": "Pas Apte",
  "learned": "Appris",

  // Releasing messages
  "goodbye": "Au revoir, {{pokemonName}} !",
  "byebye": "Bye-bye, {{pokemonName}} !",
  "farewell": "Adieu, {{pokemonName}} !",
  "soLong": "Salut, {{pokemonName}} !",
  "thisIsWhereWePart": "C’est là qu’on se sépare, {{pokemonName}}!",
  "illMissYou": "Tu vas me manquer, {{pokemonName}} !",
  "illNeverForgetYou": "Je ne t’oublierai pas, {{pokemonName}} !",
  "untilWeMeetAgain": "À la prochaine, {{pokemonName}} !",
  "sayonara": "Sayonara, {{pokemonName}} !",
  "smellYaLater": "À la revoyure, {{pokemonName}} !",
} as const;
