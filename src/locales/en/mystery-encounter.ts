import { lostAtSeaDialogue } from "./mystery-encounters/lost-at-sea-dialogue";
import { mysteriousChestDialogue } from "#app/locales/en/mystery-encounters/mysterious-chest-dialogue";
import { mysteriousChallengersDialogue } from "#app/locales/en/mystery-encounters/mysterious-challengers-dialogue";
import { darkDealDialogue } from "#app/locales/en/mystery-encounters/dark-deal-dialogue";
import { departmentStoreSaleDialogue } from "#app/locales/en/mystery-encounters/department-store-sale-dialogue";
import { fieldTripDialogue } from "#app/locales/en/mystery-encounters/field-trip-dialogue";
import { fieryFalloutDialogue } from "#app/locales/en/mystery-encounters/fiery-fallout-dialogue";
import { fightOrFlightDialogue } from "#app/locales/en/mystery-encounters/fight-or-flight-dialogue";
import { safariZoneDialogue } from "#app/locales/en/mystery-encounters/safari-zone-dialogue";
import { shadyVitaminDealerDialogue } from "#app/locales/en/mystery-encounters/shady-vitamin-dealer-dialogue";
import { slumberingSnorlaxDialogue } from "#app/locales/en/mystery-encounters/slumbering-snorlax-dialogue";
import { trainingSessionDialogue } from "#app/locales/en/mystery-encounters/training-session-dialogue";
import { theStrongStuffDialogue } from "#app/locales/en/mystery-encounters/the-strong-stuff-dialogue";
import { thePokemonSalesmanDialogue } from "#app/locales/en/mystery-encounters/the-pokemon-salesman-dialogue";
import { anOfferYouCantRefuseDialogue } from "#app/locales/en/mystery-encounters/an-offer-you-cant-refuse-dialogue";
import { delibirdyDialogue } from "#app/locales/en/mystery-encounters/delibirdy-dialogue";
import { absoluteAvariceDialogue } from "#app/locales/en/mystery-encounters/absolute-avarice-dialogue";
import { aTrainersTestDialogue } from "#app/locales/en/mystery-encounters/a-trainers-test-dialogue";
import { trashToTreasureDialogue } from "#app/locales/en/mystery-encounters/trash-to-treasure-dialogue";
import { berriesAboundDialogue } from "#app/locales/en/mystery-encounters/berries-abound-dialogue";
import { clowningAroundDialogue } from "#app/locales/en/mystery-encounters/clowning-around-dialogue";
import { partTimerDialogue } from "#app/locales/en/mystery-encounters/part-timer-dialogue";
import { dancingLessonsDialogue } from "#app/locales/en/mystery-encounters/dancing-lessons-dialogue";
import { weirdDreamDialogue } from "#app/locales/en/mystery-encounters/weird-dream-dialogue";
import { theWinstrateChallengeDialogue } from "#app/locales/en/mystery-encounters/the-winstrate-challenge-dialogue";

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

  // General use content
  "paid_money": "You paid ₽{{amount, number}}.",
  "receive_money": "You received ₽{{amount, number}}!",
  "affects_pokedex": "Affects Pokédex Data",
  "cancel_option": "Return to encounter option select.",

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
  theWinstrateChallenge: theWinstrateChallengeDialogue
} as const;
