import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{abilityName}}\nde {{pokemonName}} le protège du contrecoup !",
  "badDreams": "{{pokemonName}} a le sommeil agité !",
  "costar": "{{pokemonName}} copie les changements de stats\nde {{allyName}} !",
  "iceFaceAvoidedDamage": "{{pokemonName}} évite les dégâts\navec {{abilityName}} !",
  "perishBody": "{{abilityName}} de {{pokemonName}}\nmettra les deux Pokémon K.O. dans trois tours !",
  "poisonHeal": "{{abilityName}} de {{pokemonName}}\nrestaure un peu ses PV !",
  "trace": "{{pokemonName}} copie le talent {{abilityName}}\nde {{targetName}} !",
  "windPowerCharged": "{{pokemonName}} a été touché par la capacité\n{{moveName}} et se charge en électricité !",
  "quickDraw": "Le talent Tir Vif de {{pokemonName}}\nlui permet d’agir plus vite que d’habitude !",
  "disguiseAvoidedDamage" : "Le déguisement de {{pokemonName}} tombe !",
} as const;
