import lostAtSeaDialogue from "./mystery-encounters/lost-at-sea-dialogue.json";
import mysteriousChestDialogue from "#app/locales/en/mystery-encounters/mysterious-chest-dialogue.json";
import mysteriousChallengersDialogue from "#app/locales/en/mystery-encounters/mysterious-challengers-dialogue.json";
import darkDealDialogue from "#app/locales/en/mystery-encounters/dark-deal-dialogue.json";
import departmentStoreSaleDialogue from "#app/locales/en/mystery-encounters/department-store-sale-dialogue.json";
import fieldTripDialogue from "#app/locales/en/mystery-encounters/field-trip-dialogue.json";
import fieryFalloutDialogue from "#app/locales/en/mystery-encounters/fiery-fallout-dialogue.json";
import fightOrFlightDialogue from "#app/locales/en/mystery-encounters/fight-or-flight-dialogue.json";
import safariZoneDialogue from "#app/locales/en/mystery-encounters/safari-zone-dialogue.json";
import shadyVitaminDealerDialogue from "#app/locales/en/mystery-encounters/shady-vitamin-dealer-dialogue.json";
import slumberingSnorlaxDialogue from "#app/locales/en/mystery-encounters/slumbering-snorlax-dialogue.json";
import trainingSessionDialogue from "#app/locales/en/mystery-encounters/training-session-dialogue.json";
import theStrongStuffDialogue from "#app/locales/en/mystery-encounters/the-strong-stuff-dialogue.json";
import thePokemonSalesmanDialogue from "#app/locales/en/mystery-encounters/the-pokemon-salesman-dialogue.json";
import anOfferYouCantRefuseDialogue from "#app/locales/en/mystery-encounters/an-offer-you-cant-refuse-dialogue.json";
import delibirdyDialogue from "#app/locales/en/mystery-encounters/delibirdy-dialogue.json";
import absoluteAvariceDialogue from "#app/locales/en/mystery-encounters/absolute-avarice-dialogue.json";
import aTrainersTestDialogue from "#app/locales/en/mystery-encounters/a-trainers-test-dialogue.json";
import trashToTreasureDialogue from "#app/locales/en/mystery-encounters/trash-to-treasure-dialogue.json";
import berriesAboundDialogue from "#app/locales/en/mystery-encounters/berries-abound-dialogue.json";
import clowningAroundDialogue from "#app/locales/en/mystery-encounters/clowning-around-dialogue.json";
import partTimerDialogue from "#app/locales/en/mystery-encounters/part-timer-dialogue.json";
import dancingLessonsDialogue from "#app/locales/en/mystery-encounters/dancing-lessons-dialogue.json";
import weirdDreamDialogue from "#app/locales/en/mystery-encounters/weird-dream-dialogue.json";
import theWinstrateChallengeDialogue from "#app/locales/en/mystery-encounters/the-winstrate-challenge-dialogue.json";
import teleportingHijinksDialogue from "#app/locales/en/mystery-encounters/teleporting-hijinks-dialogue.json";
import bugTypeSuperfanDialogue from "#app/locales/en/mystery-encounters/bug-type-superfan-dialogue.json";

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

  mysteriousChallengers: mysteriousChallengersDialogue,
  mysteriousChest: mysteriousChestDialogue,
  darkDeal: darkDealDialogue,
  fightOrFlight: fightOrFlightDialogue,
  slumberingSnorlax: slumberingSnorlaxDialogue,
  trainingSession: trainingSessionDialogue,
  departmentStoreSale: departmentStoreSaleDialogue,
  shadyVitaminDealer: shadyVitaminDealerDialogue,
  fieldTrip: fieldTripDialogue,
  safariZone: safariZoneDialogue,
  lostAtSea: lostAtSeaDialogue,
  fieryFallout: fieryFalloutDialogue,
  theStrongStuff: theStrongStuffDialogue,
  pokemonSalesman: thePokemonSalesmanDialogue,
  offerYouCantRefuse: anOfferYouCantRefuseDialogue,
  delibirdy: delibirdyDialogue,
  absoluteAvarice: absoluteAvariceDialogue,
  aTrainersTest: aTrainersTestDialogue,
  trashToTreasure: trashToTreasureDialogue,
  berriesAbound: berriesAboundDialogue,
  clowningAround: clowningAroundDialogue,
  partTimer: partTimerDialogue,
  dancingLessons: dancingLessonsDialogue,
  weirdDream: weirdDreamDialogue,
  theWinstrateChallenge: theWinstrateChallengeDialogue,
  teleportingHijinks: teleportingHijinksDialogue,
  bugTypeSuperfan: bugTypeSuperfanDialogue
} as const;
