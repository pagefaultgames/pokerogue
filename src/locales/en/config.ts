import { common } from "./common.js";
import { settings } from "./settings.js";
import ability from "./ability.json";
import abilityTriggers from "./ability-trigger.json";
import arenaFlyout from "./arena-flyout.json";
import arenaTag from "./arena-tag.json";
import achv from "./achv.json";
import { battle } from "./battle";
import { battleScene } from "./battle-scene";
import battleInfo from "./battle-info.json";
import battleMessageUiHandler from "./battle-message-ui-handler.json";
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
  PGMmiscDialogue,
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
import { partyUiHandler } from "./party-ui-handler";
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
import { modifierSelectUiHandler } from "./modifier-select-ui-handler";
import { moveTriggers } from "./move-trigger";

export const enConfig = {
  ability,
  abilityTriggers,
  arenaFlyout,
  arenaTag,
  battle,
  battleScene,
  battleInfo,
  battleMessageUiHandler,
  battlePokemonForm,
  battlerTags,
  berry,
  bgmName,
  biome,
  challenges,
  commandUiHandler,
  common,
  PGMachv: achv,
  PGFachv: achv,
  PGMdialogue,
  PGFdialogue,
  PGMbattleSpecDialogue,
  PGFbattleSpecDialogue,
  PGMmiscDialogue,
  PGFmiscDialogue,
  PGMdoubleBattleDialogue,
  PGFdoubleBattleDialogue,
  egg,
  fightUiHandler,
  filterBar,
  gameMode,
  gameStatsUiHandler,
  growth,
  menu,
  menuUiHandler,
  modifier,
  modifierType,
  move,
  nature,
  pokeball,
  pokemon,
  pokemonForm,
  pokemonInfo,
  pokemonInfoContainer,
  pokemonSummary,
  saveSlotSelectUiHandler,
  settings,
  splashMessages,
  starterSelectUiHandler,
  statusEffect,
  terrain,
  titles,
  trainerClasses,
  trainerNames,
  tutorial,
  voucher,
  weather,
  partyUiHandler,
  modifierSelectUiHandler,
  moveTriggers,
};
