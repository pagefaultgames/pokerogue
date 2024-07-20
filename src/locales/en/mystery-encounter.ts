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
import { pokemonSalesmanDialogue } from "#app/locales/en/mystery-encounters/pokemon-salesman-dialogue";

/**
 * Patterns that can be used:
 * '$' will be treated as a new line for Message and Dialogue strings
 * '@d{<number>}' will add a time delay to text animation for Message and Dialogue strings
 *
 * '{{<token>}}' will auto-inject the matching token value for the specified Encounter that is stored in dialogueTokens
 * (see [i18next interpolations](https://www.i18next.com/translation-function/interpolation))
 *
 * '@[<TextStyle>]{<text>}' will auto-color the given text to a specified TextStyle (e.g. TextStyle.SUMMARY_GREEN)
 *
 * Any '(+)' or '(-)' type of tooltip will auto-color to green/blue respectively. THIS ONLY OCCURS FOR OPTION TOOLTIPS, NOWHERE ELSE
 * Other types of '(...)' tooltips will have to specify the text color manually by using '@[SUMMARY_GREEN]{<text>}' pattern
 */
export const mysteryEncounter = {
  // DO NOT REMOVE
  "unit_test_dialogue": "{{test}}{{test}} {{test{{test}}}} {{test1}} {{test\}} {{test\\}} {{test\\\}} {test}}",

  // General use content
  "paid_money": "You paid ₽{{amount, number}}.",
  "receive_money": "You received ₽{{amount, number}}!",

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
  pokemonSalesman: pokemonSalesmanDialogue
} as const;
