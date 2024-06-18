import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}}\nde {{pokemonName}} le protège du contrecoup !",
  "badDreams": "{{pokemonName}} a le sommeil agité !",
  "windPowerCharged": "{{pokemonName}} a été touché par la capacité {{moveName}} et se charge en électricité !",
  "perishBody": "{{abilityName}} de {{pokemonName}}\nmettra les deux Pokémon K.O. dans trois tours !",
  "poisonHeal": "{{abilityName}} de {{pokemonName}}\nrestaure un peu ses PV !",
  "iceFaceAvoidedDamage": "{{pokemonName}} évite les dégâts\navec {{abilityName}} !"
} as const;
