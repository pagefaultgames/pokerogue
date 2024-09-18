import i18next from "i18next";

//#region Interfaces/Types

type Day = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30" | "31";
type Month = "Jan" | "Feb" | "Mar" | "Apr" | "May" | "Jun" | "Jul" | "Aug" | "Sep" | "Oct" | "Nov" | "Dec";

/**
 * Represents a season with its {@linkcode name},
 * {@linkcode start} day+month, {@linkcode end} day+month
 * and {@linkcode messages}.
 */
interface Season {
  /** The name of the season (internal use only) */
  name: string;
  /** The start day and month of the season. Format `DD-MMM` */
  start: `${Day}-${Month}`;
  /** The end day and month of the season. Format `DD-MMM` */
  end: `${Day}-${Month}`;
  /** Collection of the messages to display (without the `i18next.t()` call!) */
  messages: string[];
}

//#region Constants

/** The weight multiplier for the battles-won splash message */
const BATTLES_WON_WEIGHT_MULTIPLIER = 10;
/** The weight multiplier for the seasonal splash messages */
const SEASONAL_WEIGHT_MULTIPLIER = 10;

//#endregion

const seasonalSplashMessages: Season[] = [
  {
    name: "Halloween",
    start: "15-Sep",
    end: "31-Oct",
    messages: [
      // add messages here. E.g. "splashMessages:happyHalloween"
    ],
  },
  {
    name: "XMAS",
    start: "01-Dec",
    end: "26-Dec",
    messages: [
      // add messages here. E.g. "splashMessages:happyHolidays"
    ],
  },
  {
    name: "New Year's",
    start: "01-Jan",
    end: "31-Jan",
    messages: [
      // add messages here. E.g. "splashMessages:happyNewYear"
    ],
  },
];

export function getBattleCountSplashMessage(): string {
  return `{COUNT} ${i18next.t("splashMessages:battlesWon")}`;
}

export function getSplashMessages(): string[] {
  const splashMessages = Array(BATTLES_WON_WEIGHT_MULTIPLIER).fill(getBattleCountSplashMessage());
  splashMessages.push(
    i18next.t("splashMessages:joinTheDiscord"),
    i18next.t("splashMessages:infiniteLevels"),
    i18next.t("splashMessages:everythingStacks"),
    i18next.t("splashMessages:optionalSaveScumming"),
    i18next.t("splashMessages:biomes"),
    i18next.t("splashMessages:openSource"),
    i18next.t("splashMessages:playWithSpeed"),
    i18next.t("splashMessages:liveBugTesting"),
    i18next.t("splashMessages:heavyInfluence"),
    i18next.t("splashMessages:pokemonRiskAndPokemonRain"),
    i18next.t("splashMessages:nowWithMoreSalt"),
    i18next.t("splashMessages:infiniteFusionAtHome"),
    i18next.t("splashMessages:brokenEggMoves"),
    i18next.t("splashMessages:magnificent"),
    i18next.t("splashMessages:mubstitute"),
    i18next.t("splashMessages:thatsCrazy"),
    i18next.t("splashMessages:oranceJuice"),
    i18next.t("splashMessages:questionableBalancing"),
    i18next.t("splashMessages:coolShaders"),
    i18next.t("splashMessages:aiFree"),
    i18next.t("splashMessages:suddenDifficultySpikes"),
    i18next.t("splashMessages:basedOnAnUnfinishedFlashGame"),
    i18next.t("splashMessages:moreAddictiveThanIntended"),
    i18next.t("splashMessages:mostlyConsistentSeeds"),
    i18next.t("splashMessages:achievementPointsDontDoAnything"),
    i18next.t("splashMessages:youDoNotStartAtLevel"),
    i18next.t("splashMessages:dontTalkAboutTheManaphyEggIncident"),
    i18next.t("splashMessages:alsoTryPokengine"),
    i18next.t("splashMessages:alsoTryEmeraldRogue"),
    i18next.t("splashMessages:alsoTryRadicalRed"),
    i18next.t("splashMessages:eeveeExpo"),
    i18next.t("splashMessages:ynoproject"),
    i18next.t("splashMessages:breedersInSpace")
  );

  // add seasonal splash messages if the season is active
  for (const { name, start, end, messages } of seasonalSplashMessages) {
    const now = new Date();
    const startDate = new Date(`${start}-${now.getFullYear()}`);
    const endDate = new Date(`${end}-${now.getFullYear()}`);

    if (now >= startDate && now <= endDate) {
      console.log( `Adding ${messages.length} seasonal splash messages for`, name, `(weight: x${SEASONAL_WEIGHT_MULTIPLIER})` );
      messages.forEach((message) => {
        const weightedMessage = Array(SEASONAL_WEIGHT_MULTIPLIER).fill(i18next.t(message));
        splashMessages.push(...weightedMessage);
      });
    }
  }

  return splashMessages;
}
