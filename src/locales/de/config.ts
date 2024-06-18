import { ability } from "./ability";
import { abilityTriggers } from "./ability-trigger";
import { PGFachv, PGMachv } from "./achv";
import { battle } from "./battle";
import { battleMessageUiHandler } from "./battle-message-ui-handler";
import { berry } from "./berry";
import { biome } from "./biome";
import { challenges } from "./challenges";
import { commandUiHandler } from "./command-ui-handler";
import {
  PGFbattleSpecDialogue,
  PGFdialogue,
  PGFdoubleBattleDialogue,
  PGFmiscDialogue,
  PGMbattleSpecDialogue,
  PGMdialogue,
  PGMdoubleBattleDialogue,
  PGMmiscDialogue
} from "./dialogue";
import { egg } from "./egg";
import { fightUiHandler } from "./fight-ui-handler";
import { gameMode } from "./game-mode";
import { gameStatsUiHandler } from "./game-stats-ui-handler";
import { growth } from "./growth";
import { menu } from "./menu";
import { menuUiHandler } from "./menu-ui-handler";
import { modifierType } from "./modifier-type";
import { move } from "./move";
import { nature } from "./nature";
import { pokeball } from "./pokeball";
import { pokemon } from "./pokemon";
import { pokemonInfo } from "./pokemon-info";
import { pokemonInfoContainer } from "./pokemon-info-container";
import { saveSlotSelectUiHandler } from "./save-slot-select-ui-handler";
import { splashMessages } from "./splash-messages";
import { starterSelectUiHandler } from "./starter-select-ui-handler";
import { titles, trainerClasses, trainerNames } from "./trainers";
import { tutorial } from "./tutorial";
import { voucher } from "./voucher";
import { weather } from "./weather";
import { partyUiHandler } from "./party-ui-handler";
import { settings } from "#app/locales/de/settings.js";

export const deConfig = {
  ability: ability,
  abilityTriggers: abilityTriggers,
  battle: battle,
  battleMessageUiHandler: battleMessageUiHandler,
  berry: berry,
  biome: biome,
  challenges: challenges,
  commandUiHandler: commandUiHandler,
  PGMachv: PGMachv,
  PGFachv: PGFachv,
  PGMdialogue: PGMdialogue,
  PGFdialogue: PGFdialogue,
  PGMbattleSpecDialogue: PGMbattleSpecDialogue,
  PGFbattleSpecDialogue: PGFbattleSpecDialogue,
  PGMmiscDialogue: PGMmiscDialogue,
  PGFmiscDialogue: PGFmiscDialogue,
  PGMdoubleBattleDialogue: PGMdoubleBattleDialogue,
  PGFdoubleBattleDialogue: PGFdoubleBattleDialogue,
  egg: egg,
  fightUiHandler: fightUiHandler,
  gameMode: gameMode,
  gameStatsUiHandler: gameStatsUiHandler,
  growth: growth,
  menu: menu,
  menuUiHandler: menuUiHandler,
  modifierType: modifierType,
  move: move,
  nature: nature,
  pokeball: pokeball,
  pokemon: pokemon,
  pokemonInfo: pokemonInfo,
  pokemonInfoContainer: pokemonInfoContainer,
  saveSlotSelectUiHandler: saveSlotSelectUiHandler,
  settings: settings,
  splashMessages: splashMessages,
  starterSelectUiHandler: starterSelectUiHandler,
  titles: titles,
  trainerClasses: trainerClasses,
  trainerNames: trainerNames,
  tutorial: tutorial,
  voucher: voucher,
  weather: weather,
  partyUiHandler: partyUiHandler
};
