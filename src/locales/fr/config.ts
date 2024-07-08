import { ability } from "./ability";
import { abilityTriggers } from "./ability-trigger";
import { PGFachv, PGMachv } from "./achv";
import { battle } from "./battle";
import { battleMessageUiHandler } from "./battle-message-ui-handler";
import { berry } from "./berry";
import { bgmName } from "./bgm-name";
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
import { modifier } from "./modifier";
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
import { statusEffect } from "./status-effect";
import { titles, trainerClasses, trainerNames } from "./trainers";
import { tutorial } from "./tutorial";
import { voucher } from "./voucher";
import { terrain, weather } from "./weather";
import { partyUiHandler } from "./party-ui-handler";
import { settings } from "./settings.js";
import { common } from "./common.js";
import { modifierSelectUiHandler } from "./modifier-select-ui-handler";

export const frConfig = {
  ability: ability,
  abilityTriggers: abilityTriggers,
  battle: battle,
  battleMessageUiHandler: battleMessageUiHandler,
  berry: berry,
  bgmName: bgmName,
  biome: biome,
  challenges: challenges,
  commandUiHandler: commandUiHandler,
  common: common,
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
  modifier: modifier,
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
  statusEffect: statusEffect,
  terrain: terrain,
  titles: titles,
  trainerClasses: trainerClasses,
  trainerNames: trainerNames,
  tutorial: tutorial,
  voucher: voucher,
  weather: weather,
  partyUiHandler: partyUiHandler,
  modifierSelectUiHandler: modifierSelectUiHandler
};
