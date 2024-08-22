import { ability } from "./ability";
import { abilityTriggers } from "./ability-trigger";
import { PGFachv, PGMachv } from "./achv";
import { arenaFlyout } from "./arena-flyout";
import { arenaTag } from "./arena-tag";
import { battle } from "./battle";
import { battleScene } from "./battle-scene";
import { battleInfo } from "./battle-info";
import { battleMessageUiHandler } from "./battle-message-ui-handler";
import { battlerTags } from "./battler-tags";
import { berry } from "./berry";
import { bgmName } from "./bgm-name";
import { biome } from "./biome";
import { challenges } from "./challenges";
import { commandUiHandler } from "./command-ui-handler";
import { common } from "./common.js";
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
import { filterBar } from "./filter-bar";
import { gameMode } from "./game-mode";
import { gameStatsUiHandler } from "./game-stats-ui-handler";
import { growth } from "./growth";
import { menu } from "./menu";
import { menuUiHandler } from "./menu-ui-handler";
import { modifier } from "./modifier";
import { modifierSelectUiHandler } from "./modifier-select-ui-handler";
import { modifierType } from "./modifier-type";
import { move } from "./move";
import { moveTriggers } from "./move-trigger";
import { nature } from "./nature";
import { partyUiHandler } from "./party-ui-handler";
import { pokeball } from "./pokeball";
import { pokemon } from "./pokemon";
import { battlePokemonForm, pokemonForm } from "./pokemon-form";
import { pokemonInfo } from "./pokemon-info";
import { pokemonInfoContainer } from "./pokemon-info-container";
import { pokemonSummary } from "./pokemon-summary";
import { saveSlotSelectUiHandler } from "./save-slot-select-ui-handler";
import { settings } from "./settings.js";
import { splashMessages } from "./splash-messages";
import { starterSelectUiHandler } from "./starter-select-ui-handler";
import { statusEffect } from "./status-effect";
import { titles, trainerClasses, trainerNames } from "./trainers";
import { tutorial } from "./tutorial";
import { voucher } from "./voucher";
import { terrain, weather } from "./weather";

export const ptBrConfig = {
  ability: ability,
  abilityTriggers: abilityTriggers,
  arenaFlyout: arenaFlyout,
  arenaTag: arenaTag,
  battle: battle,
  battleScene: battleScene,
  battleInfo: battleInfo,
  battleMessageUiHandler: battleMessageUiHandler,
  battlePokemonForm: battlePokemonForm,
  battlerTags: battlerTags,
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
  filterBar: filterBar,
  gameMode: gameMode,
  gameStatsUiHandler: gameStatsUiHandler,
  growth: growth,
  menu: menu,
  menuUiHandler: menuUiHandler,
  modifier: modifier,
  modifierSelectUiHandler: modifierSelectUiHandler,
  modifierType: modifierType,
  move: move,
  moveTriggers: moveTriggers,
  nature: nature,
  partyUiHandler: partyUiHandler,
  pokeball: pokeball,
  pokemon: pokemon,
  pokemonForm: pokemonForm,
  pokemonInfo: pokemonInfo,
  pokemonInfoContainer: pokemonInfoContainer,
  pokemonSummary: pokemonSummary,
  saveSlotSelectUiHandler: saveSlotSelectUiHandler,
  statusEffect: statusEffect,
  terrain: terrain,
  settings: settings,
  splashMessages: splashMessages,
  starterSelectUiHandler: starterSelectUiHandler,
  titles: titles,
  trainerClasses: trainerClasses,
  trainerNames: trainerNames,
  tutorial: tutorial,
  voucher: voucher,
  weather: weather
};
