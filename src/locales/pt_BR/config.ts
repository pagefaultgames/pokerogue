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
import { battleMessageUiHandler } from "./battle-message-ui-handler";
import { berry } from "./berry";
import { gameStatsUiHandler } from "./game-stats-ui-handler";
import { voucher } from "./voucher";
import {
  PGMdialogue,
  PGFdialogue,
  PGMbattleSpecDialogue,
  PGFbattleSpecDialogue,
  PGMmiscDialogue,
  PGFmiscDialogue, PGMdoubleBattleDialogue, PGFdoubleBattleDialogue
} from "./dialogue";
import { biome } from "./biome";

export const ptBrConfig = {
  ability: ability,
  abilityTriggers: abilityTriggers,
  battle: battle,
  commandUiHandler: commandUiHandler,
  egg: egg,
  fightUiHandler: fightUiHandler,
  growth: growth,
  menu: menu,
  menuUiHandler: menuUiHandler,
  modifierType: modifierType,
  move: move,
  nature: nature,
  pokeball: pokeball,
  pokemon: pokemon,
  pokemonInfo: pokemonInfo,
  splashMessages: splashMessages,
  starterSelectUiHandler: starterSelectUiHandler,
  titles: titles,
  trainerClasses: trainerClasses,
  trainerNames: trainerNames,
  tutorial: tutorial,
  weather: weather,
  battleMessageUiHandler: battleMessageUiHandler,
  berry: berry,
  gameStatsUiHandler: gameStatsUiHandler,
  voucher: voucher,
  biome: biome,
  PGMdialogue: PGMdialogue,
  PGFdialogue: PGFdialogue,
  PGMbattleSpecDialogue: PGMbattleSpecDialogue,
  PGFbattleSpecDialogue: PGFbattleSpecDialogue,
  PGMmiscDialogue: PGMmiscDialogue,
  PGFmiscDialogue: PGFmiscDialogue,
  PGMdoubleBattleDialogue: PGMdoubleBattleDialogue,
  PGFdoubleBattleDialogue: PGFdoubleBattleDialogue
};
