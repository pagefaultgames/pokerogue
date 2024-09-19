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

/** Whether to use seasonal splash messages in general */
const USE_SEASONAL_SPLASH_MESSAGES = false;
/** The weight multiplier for the battles-won splash message */
const BATTLES_WON_WEIGHT_MULTIPLIER = 10;
/** The weight multiplier for the seasonal splash messages */
const SEASONAL_WEIGHT_MULTIPLIER = 10;

//#region Common Messages

const commonSplashMessages = [
  ...Array(BATTLES_WON_WEIGHT_MULTIPLIER).fill("battlesWon"),
  "joinTheDiscord",
  "infiniteLevels",
  "everythingStacks",
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
  "mubstitute",
  "thatsCrazy",
  "oranceJuice",
  "questionableBalancing",
  "coolShaders",
  "aiFree",
  "suddenDifficultySpikes",
  "basedOnAnUnfinishedFlashGame",
  "moreAddictiveThanIntended",
  "mostlyConsistentSeeds",
  "achievementPointsDontDoAnything",
  "youDoNotStartAtLevel",
  "dontTalkAboutTheManaphyEggIncident",
  "alsoTryPokengine",
  "alsoTryEmeraldRogue",
  "alsoTryRadicalRed",
  "eeveeExpo",
  "ynoproject",
  "breedersInSpace",
];

//#region Seasonal Messages

const seasonalSplashMessages: Season[] = [
  {
    name: "Halloween",
    start: "09-15",
    end: "10-31",
    messages: ["halloween.pumpkaboosAbout", "halloween.mayContainSpiders", "halloween.spookyScaryDuskulls"],
  },
  {
    name: "XMAS",
    start: "12-01",
    end: "12-26",
    messages: ["xmas.happyHolidays", "xmas.delibirdSeason"],
  },
  {
    name: "New Year's",
    start: "01-01",
    end: "01-31",
    messages: ["newYears.happyNewYear"],
  },
];

//#endregion

export function getSplashMessages(): string[] {
  const splashMessages: string[] = [...commonSplashMessages];

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
