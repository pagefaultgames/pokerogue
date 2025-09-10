/**
 * @import { parsedNames } from "./types.js";
 */

/**
 * An error code for a bad URL.
 */
export const INVALID_URL = /** @type {const} */ ("bad_url_code");

/**
 * Fetch a given trainer's names from the given HTML document.
 * @param {HTMLElement | null | undefined} trainerListHeader - The header containing the trainer lists
 * @param {boolean} [knownFemale=false] - Whether the class is known to be female; default `false`
 * @returns {parsedNames | INVALID_URL}
 * An object containing the parsed names. \
 * Will instead return with {@linkcode INVALID_URL} if the data is invalid.
 */
export function fetchNames(trainerListHeader, knownFemale = false) {
  const trainerNames = /** @type {Set<string>} */ (new Set());
  const femaleTrainerNames = /** @type {Set<string>} */ (new Set());
  if (!trainerListHeader?.parentElement?.childNodes) {
    // Return early if no child nodes (ie tables) can be found
    return INVALID_URL;
  }

  const elements = [...trainerListHeader.parentElement.childNodes];

  // Find all elements within the "Trainer Names" header and selectively filter to find the name tables.
  const startChildIndex = elements.indexOf(trainerListHeader);
  const endChildIndex = elements.findIndex(h => h.nodeName === "H2" && elements.indexOf(h) > startChildIndex);

  // Grab all the trainer name tables sorted by generation
  const tables = elements.slice(startChildIndex, endChildIndex).filter(
    /** @type {(t: ChildNode) => t is HTMLTableElement} */
    (
      t =>
        // Only grab expandable tables within the header block
        t.nodeName === "TABLE" && /** @type {HTMLTableElement} */ (t)["className"] === "expandable"
    ),
  );

  parseTable(tables, knownFemale, trainerNames, femaleTrainerNames);
  return {
    male: Array.from(trainerNames),
    female: Array.from(femaleTrainerNames),
  };
}

/**
 * Parse the table in question.
 * @param {HTMLTableElement[]} tables - The array of Elements forming the current table
 * @param {boolean} isFemale - Whether the trainer is known to be female or not
 * @param {Set<string>} trainerNames A Set containing the male trainer names
 * @param {Set<string>} femaleTrainerNames - A Set containing the female trainer names
 */
function parseTable(tables, isFemale, trainerNames, femaleTrainerNames) {
  for (const table of tables) {
    // Grab all rows past the first header with exactly 9 children in them (Name, Battle, Winnings, 6 party slots)
    const trainerRows = [...table.rows].slice(1).filter(r => r.children.length === 9);
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
