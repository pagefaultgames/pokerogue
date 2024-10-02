import common from "./common.json";
import settings from "./settings.json";
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
import battleSpecDialogue from "./dialogue-final-boss.json";
import miscDialogue from "./dialogue-misc.json";
import doubleBattleDialogue from "./dialogue-double-battle.json";
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
import move from "./move.json";
import nature from "./nature.json";
import partyUiHandler from "./party-ui-handler.json";
import pokeball from "./pokeball.json";
import pokemon from "./pokemon.json";
import pokemonForm from "./pokemon-form.json";
import battlePokemonForm from "./pokemon-form-battle.json";
import pokemonInfo from "./pokemon-info.json";
import pokemonInfoContainer from "./pokemon-info-container.json";
import pokemonSummary from "./pokemon-summary.json";
import saveSlotSelectUiHandler from "./save-slot-select-ui-handler.json";
import splashMessages from "./splash-messages.json";
import starterSelectUiHandler from "./starter-select-ui-handler.json";
import statusEffect from "./status-effect.json";
import trainerTitles from "./trainer-titles.json";
import trainerClasses from "./trainer-classes.json";
import trainerNames from "./trainer-names.json";
import tutorial from "./tutorial.json";
import voucher from "./voucher.json";
import weather from "./weather.json";
import terrain from "./terrain.json";
import modifierSelectUiHandler from "./modifier-select-ui-handler.json";
import moveTriggers from "./move-trigger.json";
import runHistory from "./run-history.json";
import mysteryEncounterMessages from "./mystery-encounter-messages.json";
import lostAtSea from "./mystery-encounters/lost-at-sea-dialogue.json";
import mysteriousChest from "./mystery-encounters/mysterious-chest-dialogue.json";
import mysteriousChallengers from "./mystery-encounters/mysterious-challengers-dialogue.json";
import darkDeal from "./mystery-encounters/dark-deal-dialogue.json";
import departmentStoreSale from "./mystery-encounters/department-store-sale-dialogue.json";
import fieldTrip from "./mystery-encounters/field-trip-dialogue.json";
import fieryFallout from "./mystery-encounters/fiery-fallout-dialogue.json";
import fightOrFlight from "./mystery-encounters/fight-or-flight-dialogue.json";
import safariZone from "./mystery-encounters/safari-zone-dialogue.json";
import shadyVitaminDealer from "./mystery-encounters/shady-vitamin-dealer-dialogue.json";
import slumberingSnorlax from "./mystery-encounters/slumbering-snorlax-dialogue.json";
import trainingSession from "./mystery-encounters/training-session-dialogue.json";
import theStrongStuff from "./mystery-encounters/the-strong-stuff-dialogue.json";
import pokemonSalesman from "./mystery-encounters/the-pokemon-salesman-dialogue.json";
import offerYouCantRefuse from "./mystery-encounters/an-offer-you-cant-refuse-dialogue.json";
import delibirdy from "./mystery-encounters/delibirdy-dialogue.json";
import absoluteAvarice from "./mystery-encounters/absolute-avarice-dialogue.json";
import aTrainersTest from "./mystery-encounters/a-trainers-test-dialogue.json";
import trashToTreasure from "./mystery-encounters/trash-to-treasure-dialogue.json";
import berriesAbound from "./mystery-encounters/berries-abound-dialogue.json";
import clowningAround from "./mystery-encounters/clowning-around-dialogue.json";
import partTimer from "./mystery-encounters/part-timer-dialogue.json";
import dancingLessons from "./mystery-encounters/dancing-lessons-dialogue.json";
import weirdDream from "./mystery-encounters/weird-dream-dialogue.json";
import theWinstrateChallenge from "./mystery-encounters/the-winstrate-challenge-dialogue.json";
import teleportingHijinks from "./mystery-encounters/teleporting-hijinks-dialogue.json";
import bugTypeSuperfan from "./mystery-encounters/bug-type-superfan-dialogue.json";
import funAndGames from "./mystery-encounters/fun-and-games-dialogue.json";
import uncommonBreed from "./mystery-encounters/uncommon-breed-dialogue.json";
import globalTradeSystem from "./mystery-encounters/global-trade-system-dialogue.json";
import expertPokemonBreeder from "./mystery-encounters/the-expert-pokemon-breeder-dialogue.json";

/**
 * Dialogue/Text token injection patterns that can be used:
 * - `$` will be treated as a new line for Message and Dialogue strings.
 * - `@d{<number>}` will add a time delay to text animation for Message and Dialogue strings.
 * - `@s{<sound_effect_key>}` will play a specified sound effect for Message and Dialogue strings.
 * - `@f{<number>}` will fade the screen to black for the given duration, then fade back in for Message and Dialogue strings.
 * - `{{<token>}}` (MYSTERY ENCOUNTERS ONLY) will auto-inject the matching dialogue token value that is stored in {@link IMysteryEncounter.dialogueTokens}.
 *   - (see [i18next interpolations](https://www.i18next.com/translation-function/interpolation)) for more details.
 * - `@[<TextStyle>]{<text>}` (STATIC TEXT ONLY, NOT USEABLE WITH {@link UI.showText()} OR {@link UI.showDialogue()}) will auto-color the given text to a specified {@link TextStyle} (e.g. `TextStyle.SUMMARY_GREEN`).
 */
export const daConfig = {
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
  achv,
  dialogue,
  battleSpecDialogue,
  miscDialogue,
  doubleBattleDialogue,
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
  titles: trainerTitles,
  trainerClasses,
  trainerNames,
  tutorial,
  voucher,
  weather,
  partyUiHandler,
  modifierSelectUiHandler,
  moveTriggers,
  runHistory,
  mysteryEncounter: {
    // DO NOT REMOVE
    "unit_test_dialogue": "{{test}}{{test}} {{test{{test}}}} {{test1}} {{test\}} {{test\\}} {{test\\\}} {test}}",
    mysteriousChallengers,
    mysteriousChest,
    darkDeal,
    fightOrFlight,
    slumberingSnorlax,
    trainingSession,
    departmentStoreSale,
    shadyVitaminDealer,
    fieldTrip,
    safariZone,
    lostAtSea,
    fieryFallout,
    theStrongStuff,
    pokemonSalesman,
    offerYouCantRefuse,
    delibirdy,
    absoluteAvarice,
    aTrainersTest,
    trashToTreasure,
    berriesAbound,
    clowningAround,
    partTimer,
    dancingLessons,
    weirdDream,
    theWinstrateChallenge,
    teleportingHijinks,
    bugTypeSuperfan,
    funAndGames,
    uncommonBreed,
    globalTradeSystem,
    expertPokemonBreeder
  },
  mysteryEncounterMessages
};
