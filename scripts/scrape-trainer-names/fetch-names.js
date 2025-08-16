import chalk from "chalk";
import { JSDOM } from "jsdom";
import { checkGenderAndType } from "./check-gender.js";

/**
 * @import { nameRecord, parsedNames } from "./types.js";
 */

/**
 * Fetch a given trainer's names from the given URL.
 * @param {string} url - The URL to parse
 * @param {boolean} [currGender] - The current class' known gender.
 * If provided, will override the natural gender detection with the given gender and avoid
 * checking any gender counterparts.
 * @returns {Promise<parsedNames>} A Promise that resolves with the parsed names once the parsing concludes.
 * Will resolve with an empty array if the name could not be parsed.
 */
export async function fetchNames(url, currGender) {
  const { document } = (await JSDOM.fromURL(`https://bulbapedia.bulbagarden.net/wiki/${url}_(Trainer_class)`)).window;
  const trainerListHeader = document.querySelector("#Trainer_list")?.parentElement;
  if (!trainerListHeader?.parentElement?.childNodes) {
    console.warn(chalk.hex("#ffa500")(`URL ${url} did not correspond to a valid trainer class!`));
    return { male: [], female: [] };
  }

  let trainerNames = /** @type {Set<string>} */ (new Set());
  let femaleTrainerNames = /** @type {Set<string>} */ (new Set());

  // If we don't know whether this class is female, check, optionally recursing into the counterpart's webpage as well.
  if (currGender === undefined) {
    /** @type {string | undefined} */
    let counterpartURL;
    [currGender, counterpartURL] = checkGenderAndType(document);
    if (counterpartURL) {
      console.log(chalk.green(`Accessing gender counterpart URL: ${counterpartURL}`));
      const names = await fetchNames(counterpartURL, !currGender);
      trainerNames = new Set(names.male);
      femaleTrainerNames = new Set(names.female);
    }
  }

  const elements = [...trainerListHeader.parentElement.childNodes];

  // Find all elements within the "Trainer Names" header and selectively filter to find the name tables.
  const startChildIndex = elements.indexOf(trainerListHeader);
  const endChildIndex = elements.findIndex(h => h.nodeName === "H2" && elements.indexOf(h) > startChildIndex);

  // Grab all the trainer name tables sorted by generation
  const tables = elements.slice(startChildIndex, endChildIndex).filter(
    /** @type {(t: ChildNode) => t is Element} */
    (
      t =>
        // Only grab expandable tables within the header block
        t.nodeName === "TABLE" && t["className"] === "expandable"
    ),
  );

  parseTable(tables, currGender, trainerNames, femaleTrainerNames);
  return {
    male: Array.from(trainerNames),
    female: Array.from(femaleTrainerNames),
  };
}

/**
 * Parse the table in question.
 * @param {Element[]} tables - The array of Elements forming the current table
 * @param {boolean} isFemale - Whether the trainer is known to be female or not
 * @param {Set<string>} trainerNames A Set containing the male trainer names
 * @param {Set<string>} femaleTrainerNames - A Set containing the female trainer names
 */
function parseTable(tables, isFemale, trainerNames, femaleTrainerNames) {
  for (const table of tables) {
    // Grab all rows past the first header with exactly 9 children in them (Name, Battle, Winnings, 6 party slots)
    const trainerRows = [...table.querySelectorAll("tr:not(:first-child)")].filter(r => r.children.length === 9);
    for (const row of trainerRows) {
      const content = row.firstElementChild?.innerHTML;
      // Skip empty elements & ones without anchors
      if (!content || content?.indexOf(" <a ") === -1) {
        continue;
      }
      /** Whether the name is female */
      const female = isFemale || content.includes("♀");
      // Grab the plaintext name part with an optional ampersand
      const nameMatch = />([a-z]+(?: &amp; [a-z]+)?)<\/a>/i.exec(content);
      if (!nameMatch) {
        continue;
      }
      (female ? femaleTrainerNames : trainerNames).add(nameMatch[1].replace("&amp;", "&"));
    }
  }
}
