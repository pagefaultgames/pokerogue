/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Convert all diacritical marks within a string into their normalized variants.
 * @param {string} str - The string to parse
 * @returns {string} The string with all diacritics having been removed.
 * @example
 * ```js
 * const str = "Pokémon";
 * console.log(normalizeDiacritics(str));
 * // Output: "Pokemon"
 */
export function normalizeDiacritics(str) {
  // Normalizing to NFKD splits all diacritics into the base letter + grapheme (à -> a + `),
  // which are conveniently all in their own little Unicode block for easy removal
  return str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}
