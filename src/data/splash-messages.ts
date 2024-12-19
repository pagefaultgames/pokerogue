import { USE_SEASONAL_SPLASH_MESSAGES } from "#app/constants";
import i18next from "i18next";

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
}

//#region Constants

/** The weight multiplier for the battles-won splash message */
const BATTLES_WON_WEIGHT_MULTIPLIER = 10;
/** The weight multiplier for the seasonal splash messages */
const SEASONAL_WEIGHT_MULTIPLIER = 20;

//#region Seasonal Messages

const seasonalSplashMessages: Season[] = [
  {
    name: "halloween",
    start: "10-15",
    end: "10-31"
  },
  {
    name: "xmas",
    start: "12-16",
    end: "12-31"
  },
  {
    name: "newYears",
    start: "12-31",
    end: "01-14"
  },
];

//#endregion

export function getSplashMessages(): string[] {
  const existingKeys = i18next.getResourceBundle(i18next.language, "splashMessages");
  const splashMessages: string[] = [ ...Object.keys(existingKeys["common"]) ].map((message) => `common.${message}`);
  if (splashMessages.includes("common.battlesWon")) {
    splashMessages.push(...Array(Math.max(BATTLES_WON_WEIGHT_MULTIPLIER - 1, 1)).fill("common.battlesWon"));
  }

  console.log("use seasonal splash messages", USE_SEASONAL_SPLASH_MESSAGES);
  if (USE_SEASONAL_SPLASH_MESSAGES) {
    // add seasonal splash messages if the season is active
    for (const { name, start, end } of seasonalSplashMessages) {
      const now = new Date();
      const startDate = new Date(`${start}-${now.getFullYear()}`);
      const endDate = new Date(`${end}-${now.getFullYear()}`);
      if (endDate < startDate) { // If the end date is earlier in the year, that means it's next year
        if (now >= startDate) {
          endDate.setFullYear(endDate.getFullYear() + 1); //Ends next year
        } else if (now <= endDate) {
          startDate.setFullYear(startDate.getFullYear() - 1); //Started last year
        }
      }
      console.log(`${name} event starts ${startDate} and ends ${endDate}`);

      if (existingKeys.hasOwnProperty(name) && now >= startDate && now <= endDate) {
        const existingMessages: string[] = [ ...Object.keys(existingKeys[name]) ].map(m=>`${name}.${m}`);
        console.log(`Adding ${existingMessages.length} ${name} splash messages from ${i18next.language} (weight: x${SEASONAL_WEIGHT_MULTIPLIER})`);
        existingMessages.forEach((message) => {
          const weightedMessage = Array(SEASONAL_WEIGHT_MULTIPLIER).fill(message);
          splashMessages.push(...weightedMessage);
        });
      }
    }
  }

  return splashMessages.map((message) => `splashMessages:${message}`);
}
