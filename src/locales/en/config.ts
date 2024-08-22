import common from "./common.json";
import { settings } from "./settings.js";
import ability from "./ability.json";
import abilityTriggers from "./ability-trigger.json";
import arenaFlyout from "./arena-flyout.json";
import arenaTag from "./arena-tag.json";
import achv from "./achv.json";
import battle from "./battle.json";
import battleScene from "./battle-scene.json";
import battleInfo from "./battle-info.json";
import battleMessageUiHandler from "./battle-message-ui-handler.json";
import battlerTags from "./battler-tags.json";
import berry from "./berry.json";
import bgmName from "./bgm-name.json";
import biome from "./biome.json";
import challenges from "./challenges.json";
import commandUiHandler from "./command-ui-handler.json";
import dialogue from "./dialogue.json";
import dialogueEndboss from "./dialogue-endboss.json";
import dialogueMisc from "./dialogue-misc.json";
import dialogueDoubleBattle from "./dialogues-double-battle.json";
import egg from "./egg.json";
import fightUiHandler from "./fight-ui-handler.json";
import filterBar from "./filter-bar.json";
import gameMode from "./game-mode.json";
import gameStatsUiHandler from "./game-stats-ui-handler.json";
import growth from "./growth.json";
import menu from "./menu.json";
import menuUiHandler from "./menu-ui-handler.json";
import modifier from "./modifier.json";
import modifierType from "./modifier-type.json";
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
import modifierSelectUiHandler from "./modifier-select-ui-handler.json";
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
  PGMdialogue: dialogue,
  PGFdialogue: dialogue,
  PGMbattleSpecDialogue: dialogueEndboss,
  PGFbattleSpecDialogue: dialogueEndboss,
  PGMmiscDialogue: dialogueMisc,
  PGFmiscDialogue: dialogueMisc,
  PGMdoubleBattleDialogue: dialogueDoubleBattle,
  PGFdoubleBattleDialogue: dialogueDoubleBattle,
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
