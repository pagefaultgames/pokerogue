import lostAtSea from "./mystery-encounters/lost-at-sea-dialogue.json";
import mysteriousChest from "#app/locales/en/mystery-encounters/mysterious-chest-dialogue.json";
import mysteriousChallengers from "#app/locales/en/mystery-encounters/mysterious-challengers-dialogue.json";
import darkDeal from "#app/locales/en/mystery-encounters/dark-deal-dialogue.json";
import departmentStoreSale from "#app/locales/en/mystery-encounters/department-store-sale-dialogue.json";
import fieldTrip from "#app/locales/en/mystery-encounters/field-trip-dialogue.json";
import fieryFallout from "#app/locales/en/mystery-encounters/fiery-fallout-dialogue.json";
import fightOrFlight from "#app/locales/en/mystery-encounters/fight-or-flight-dialogue.json";
import safariZone from "#app/locales/en/mystery-encounters/safari-zone-dialogue.json";
import shadyVitaminDealer from "#app/locales/en/mystery-encounters/shady-vitamin-dealer-dialogue.json";
import slumberingSnorlax from "#app/locales/en/mystery-encounters/slumbering-snorlax-dialogue.json";
import trainingSession from "#app/locales/en/mystery-encounters/training-session-dialogue.json";
import theStrongStuff from "#app/locales/en/mystery-encounters/the-strong-stuff-dialogue.json";
import pokemonSalesman from "#app/locales/en/mystery-encounters/the-pokemon-salesman-dialogue.json";
import offerYouCantRefuse from "#app/locales/en/mystery-encounters/an-offer-you-cant-refuse-dialogue.json";
import delibirdy from "#app/locales/en/mystery-encounters/delibirdy-dialogue.json";
import absoluteAvarice from "#app/locales/en/mystery-encounters/absolute-avarice-dialogue.json";
import aTrainersTest from "#app/locales/en/mystery-encounters/a-trainers-test-dialogue.json";
import trashToTreasure from "#app/locales/en/mystery-encounters/trash-to-treasure-dialogue.json";
import berriesAbound from "#app/locales/en/mystery-encounters/berries-abound-dialogue.json";
import clowningAround from "#app/locales/en/mystery-encounters/clowning-around-dialogue.json";
import partTimer from "#app/locales/en/mystery-encounters/part-timer-dialogue.json";
import dancingLessons from "#app/locales/en/mystery-encounters/dancing-lessons-dialogue.json";
import weirdDream from "#app/locales/en/mystery-encounters/weird-dream-dialogue.json";
import theWinstrateChallenge from "#app/locales/en/mystery-encounters/the-winstrate-challenge-dialogue.json";
import teleportingHijinks from "#app/locales/en/mystery-encounters/teleporting-hijinks-dialogue.json";
import bugTypeSuperfan from "#app/locales/en/mystery-encounters/bug-type-superfan-dialogue.json";
import funAndGames from "#app/locales/en/mystery-encounters/fun-and-games-dialogue.json";
import uncommonBreed from "#app/locales/en/mystery-encounters/uncommon-breed-dialogue.json";
import globalTradeSystem from "#app/locales/en/mystery-encounters/global-trade-system-dialogue.json";

/**
 * Injection patterns that can be used:
 * - `$` will be treated as a new line for Message and Dialogue strings.
 * - `@d{<number>}` will add a time delay to text animation for Message and Dialogue strings.
 * - `@s{<sound_effect_key>}` will play a specified sound effect for Message and Dialogue strings.
 * - `@f{<number>}` will fade the screen to black for the given duration, then fade back in for Message and Dialogue strings.
 * - `{{<token>}}` will auto-inject the matching dialogue token value that is stored in {@link IMysteryEncounter.dialogueTokens}.
 *   - (see [i18next interpolations](https://www.i18next.com/translation-function/interpolation)) for more details.
 * - `@[<TextStyle>]{<text>}` will auto-color the given text to a specified {@link TextStyle} (e.g. `TextStyle.SUMMARY_GREEN`).
 *
 * For Option tooltips ({@link OptionTextDisplay.buttonTooltip}):
 * - Any tooltip that starts with `(+)` or `(-)` at the beginning of a newline will auto-color to green/blue respectively.
 * - Note, this only occurs for option tooltips, nowhere else.
 * - Other types of `(...)` tooltips will have to specify the text color manually by using the `@[SUMMARY_GREEN]{<text>}` pattern.
 */
export const mysteryEncounter = {
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
  globalTradeSystem
} as const;
