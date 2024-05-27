import { ability } from "./ability";
import { abilityTriggers } from "./ability-trigger";
import { battle } from "./battle";
import { commandUiHandler } from "./command-ui-handler";
import { egg } from "./egg";
import { fightUiHandler } from "./fight-ui-handler";
import { growth } from "./growth";
import { menu } from "./menu";
import { menuUiHandler } from "./menu-ui-handler";
import { modifierType } from "./modifier-type";
import { move } from "./move";
import { nature } from "./nature";
import { pokeball } from "./pokeball";
import { pokemon } from "./pokemon";
import { pokemonInfo } from "./pokemon-info";
import { splashMessages } from "./splash-messages";
import { starterSelectUiHandler } from "./starter-select-ui-handler";
import { titles, trainerClasses, trainerNames } from "./trainers";
import { tutorial } from "./tutorial";
import { weather } from "./weather";
import { berry } from "./berry";
import { voucher } from "./voucher";
import { biome } from "./biome";



export const ptBrConfig = {
  ability: ability,
  abilityTriggers: abilityTriggers,
  battle: battle,
  commandUiHandler: commandUiHandler,
  egg: egg,
  fightUiHandler: fightUiHandler,
  menuUiHandler: menuUiHandler,
  menu: menu,
  move: move,
  pokeball: pokeball,
  pokemonInfo: pokemonInfo,
  pokemon: pokemon,
  starterSelectUiHandler: starterSelectUiHandler,
  titles: titles,
  trainerClasses: trainerClasses,
  trainerNames: trainerNames,
  tutorial: tutorial,
  splashMessages: splashMessages,
  nature: nature,
  growth: growth,
  weather: weather,
  modifierType: modifierType,
  berry: berry,
  voucher: voucher,
  biome: biome,
};
