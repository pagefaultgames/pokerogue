import { ability } from "./ability";
import { abilityTriggers } from "./ability-trigger";
import { arenaFlyout } from "./arena-flyout";
import { arenaTag } from "./arena-tag";
import { PGFachv, PGMachv } from "./achv";
import { battle } from "./battle";
import { battleInfo } from "./battle-info";
import { battleMessageUiHandler } from "./battle-message-ui-handler";
import { battlerTags } from "./battler-tags";
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
import { filterBar } from "./filter-bar";
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
import { pokemonForm, battlePokemonForm } from "./pokemon-form";
import { pokemonInfo } from "./pokemon-info";
import { pokemonInfoContainer } from "./pokemon-info-container";
import { pokemonSummary } from "./pokemon-summary";
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
import { moveTriggers } from "./move-trigger";

export const itConfig = {
  ability: ability,
  abilityTriggers: abilityTriggers,
  arenaFlyout: arenaFlyout,
  arenaTag: arenaTag,
  battle: battle,
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
  modifierType: modifierType,
  move: move,
  nature: nature,
  pokeball: pokeball,
  pokemon: pokemon,
  pokemonForm: pokemonForm,
  pokemonInfo: pokemonInfo,
  pokemonInfoContainer: pokemonInfoContainer,
  pokemonSummary: pokemonSummary,
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
  modifierSelectUiHandler: modifierSelectUiHandler,
  moveTriggers: moveTriggers
};
