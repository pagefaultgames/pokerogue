import { USE_SEASONAL_SPLASH_MESSAGES } from "#app/constants";

//#region Interfaces/Types

type Month = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12";
type Day =
  | Month
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "31";

/**
 * Represents a season with its {@linkcode name},
 * {@linkcode start} day+month, {@linkcode end} day+month
 * and {@linkcode messages}.
 */
interface Season {
  /** The name of the season (internal use only) */
  name: string;
  /** The start day and month of the season. Format `MM-DD` */
  start: `${Month}-${Day}`;
  /** The end day and month of the season. Format `MM-DD` */
  end: `${Month}-${Day}`;
  /** Collection of the messages to display (without the `i18next.t()` call!) */
  messages: string[];
}

//#region Constants

/** The weight multiplier for the battles-won splash message */
const BATTLES_WON_WEIGHT_MULTIPLIER = 10;
/** The weight multiplier for the Pokémon names splash message */
const POKEMON_NAMES_WEIGHT_MULTIPLIER = 5;
/** The weight multiplier for the seasonal splash messages */
const SEASONAL_WEIGHT_MULTIPLIER = 10;

//#region Common Messages

const commonSplashMessages = [
  ...Array(BATTLES_WON_WEIGHT_MULTIPLIER).fill("battlesWon"),
  ...Array(POKEMON_NAMES_WEIGHT_MULTIPLIER).fill("pokemon"),
  "joinTheDiscord",
  "infiniteLevels",
  "everythingIsStackable",
  "optionalSaveScumming",
  "biomes",
  "openSource",
  "playWithSpeed",
  "liveBugTesting",
  "heavyInfluence",
  "pokemonRiskAndPokemonRain",
  "nowWithMoreSalt",
  "infiniteFusionAtHome",
  "brokenEggMoves",
  "magnificent",
  "doPeopleReadThis",
  "thatsCrazy",
  "gottaCatchEmAll",
  "questionableBalancing",
  "coolShaders",
  "aiFree",
  "suddenDifficultySpikes",
  "basedOnAnUnfinishedFlashGame",
  "moreAddictiveThanIntended",
  "mostlyConsistentSeeds",
  "achievementPointsDontDoAnything",
  "nothingBeatsAJellyFilledDonut",
  "dontTalkAboutTheTinkatonIncident",
  "alsoTryPokengine",
  "alsoTryEmeraldRogue",
  "alsoTryRadicalRed",
  "eeveeExpo",
  "checkOutYnoproject",
  "breedersInSpace",
  "alsoTryPokemonUnbound",
  "tryTheJohtoDragonChallenge",
  "basicReadingAbilityRecommended",
  "shoutoutsToTheArtists",
  "gamblingNotEncouraged",
  "dontForgetToTakeABreak",
  "wEvent",
  "ifItsNotAccurateItsAccurate",
  "everyLossIsProgressMade",
  "liveWoChienReaction",
  "itsAFeatureNotABug",
  "theEggsAreNotForEating",
  "7.8outOf10TooManyWaterBiomes",
  "butNothingHappened",
  "thePowerOfScienceIsAmazing",
  "freeToPlay",
  "theresATimeAndPlaceForEverything",
  "nowWithShinierShinies",
  "smilesGoForMiles",
  "certainlyNotDragonFree",
  "haveANiceDay",
  "redacted",
  "hi",
  "transRights",
  "shinyOddsHigherThanYouThink",
  "noFalseTrades",
  "notForProfit",
  "timeForYourDailyRun",
  "moreEggsThanADaycare",
  "disclaimerHarshSunDoesNotGiveVitaminD",
  "whoNeedsAMap",
  "luxrayIsNotADarkType",
  "selfDestructiveEncounters",
  "mostOptionsAreViable",
  "pokerogueMorse",
  "smiley",
  "beAwareOfPassives",
  "asSeenOnTheWorldWideWeb",
  "vaultinVeluzas",
  "tooManyStarters",
  "checkTheWiki",
  "winWithYourFavorites",
  "alsoTryPokerogueWait",
  "theWayISeeItKyogreIsSurrounded",
  "tryOutHoneyGather",
  "notForTheFaintOfHeart",
  "p",
  "flipYourDeviceToEvolveInkay",
  "inArceusWeTrust",
  "whyDidTheTorchicCrossTheRoad",
  "goodLuck",
  "fuseWisely",
  "compensation",
  "prepareForTroubleAndMakeItDouble",
  "anEggForYourTroubles",
  "regirock",
  "hereForAGoodTime",
  "getGoodOrDont",
  "checkTheSubreddit",
  "betterNerfGreninja",
  "inCaseOfUpdateClearYourCache",
  "insertTextHere",
  "endingEndlessNotFound",
  "iLikeMyEggsVouchered",
  "YOU",
  "noAddedSugar",
  "notSponsored",
  "notRated",
  "justOneMoreWaveMom",
  "saltCured",
  "onlyOnPokerogueNet",
  "pixelPerfection",
  "openSource",
  "probablyGood",
  "itsAMonsterHouse",
  "dontForgetYourPassword",
  "tripleTripleTripleAxel",
  "questionExclamation",
  "clownEncounters",
  "fullOfBerries",
  "limitsAreMeantToBeBrokenSometimes",
  "keepItCasual",
  "serversProbablyWorking",
  "mew",
  "makeItRainAndYourProblemsGoAway",
  "customMusicTracks",
  "youAreValid",
  "number591IsLookingOff",
  "timeForYourDeliDelivery",
  "goodFirstImpression",
  "iPreferRarerCandies",
  "pocketRoguelite",
  "porygonDidNothingWrong",
  "critMattered",
  "pickupNotRequired",
];

//#region Seasonal Messages

const seasonalSplashMessages: Season[] = [
  {
    name: "Halloween",
    start: "10-15",
    end: "10-31",
    messages: [
      "halloween.pumpkabooAbout",
      "halloween.mayContainSpiders", 
      "halloween.spookyScarySkeledirge", 
      "halloween.gourgeistUsedTrickOrTreat",
      "halloween.letsSnuggleForever",
      "halloween.boo"
    ],
  },
  {
    name: "Winter Holiday",
    start: "12-01",
    end: "12-31",
    messages: [
      "winterHoliday.happyHolidays",
      "winterHoliday.unaffilicatedWithDelibirdServices",
      "winterHoliday.delibirdSeason",
      "winterHoliday.diamondsFromTheSky",
      "winterHoliday.holidayStylePikachuNotIncluded",
      "winterHoliday.haveAnIceDay",
      "winterHoliday.spinTheClaydol",
      "winterHoliday.beGoodForGoodnessSake",
      "winterHoliday.moomooMilkAndLavaCookies",
      "winterHoliday.iNeedAYacheBerry",
      "winterHoliday.getJolly",
      "winterHoliday.deckTheHalls",
      "winterHoliday.saveScummingGetsYouOnTheNaughtyList",
      "winterHoliday.stockingsFullOfRolycoly"
    ],
  },
  {
    name: "New Year's",
    start: "01-01",
    end: "01-15",
    messages: [
      "newYears.happyNewYear",
      "newYears.andAHappyNewYear"
    ],
  },
];

//#endregion

export function getSplashMessages(): string[] {
  const splashMessages: string[] = [ ...commonSplashMessages ];
  console.log("use seasonal splash messages", USE_SEASONAL_SPLASH_MESSAGES);
  if (USE_SEASONAL_SPLASH_MESSAGES) {
    // add seasonal splash messages if the season is active
    for (const { name, start, end, messages } of seasonalSplashMessages) {
      const now = new Date();
      const startDate = new Date(`${start}-${now.getFullYear()}`);
      const endDate = new Date(`${end}-${now.getFullYear()}`);

      if (now >= startDate && now <= endDate) {
        console.log(`Adding ${messages.length} ${name} splash messages (weight: x${SEASONAL_WEIGHT_MULTIPLIER})`);
        messages.forEach((message) => {
          const weightedMessage = Array(SEASONAL_WEIGHT_MULTIPLIER).fill(message);
          splashMessages.push(...weightedMessage);
        });
      }
    }
  }

  return splashMessages.map((message) => `splashMessages:${message}`);
}
