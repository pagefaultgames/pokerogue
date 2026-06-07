/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ParsedNames } from "./types";

/**
 * An error code for a bad URL.
 */
export const INVALID_URL = "bad_url_code";

/**
 * Fetch a given trainer's names from the given HTML document.
 * @param trainerListHeader - The header containing the trainer lists
 * @param knownFemale - Whether the class is known to be female; default `false`
 * @returns An object containing the parsed names.
 * Will instead return with {@linkcode INVALID_URL} if the data is invalid.
 */
export function fetchNames(
  trainerListHeader: HTMLElement | null | undefined,
  knownFemale = false,
): ParsedNames | typeof INVALID_URL {
  const trainerNames = new Set<string>();
  const femaleTrainerNames = new Set<string>();
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
    (t): t is HTMLTableElement =>
      // Only grab expandable tables within the header block
      t.nodeName === "TABLE" && (t as HTMLTableElement).className === "expandable",
  );

  parseTable(tables, knownFemale, trainerNames, femaleTrainerNames);
  return {
    male: Array.from(trainerNames),
    female: Array.from(femaleTrainerNames),
  };
}

/**
 * Parse the table in question.
 * @param tables - The array of Elements forming the current table
 * @param isFemale - Whether the trainer is known to be female or not
 * @param trainerNames - A Set containing the male trainer names
 * @param femaleTrainerNames - A Set containing the female trainer names
 */
function parseTable(
  tables: HTMLTableElement[],
  isFemale: boolean,
  trainerNames: Set<string>,
  femaleTrainerNames: Set<string>,
) {
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
