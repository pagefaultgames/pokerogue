/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Array containing all valid options for the type of test file to create.
 * @package
 */
export const validTestTypes = /** @type {const} */ ([
  "Move",
  "Ability",
  "Item",
  "Reward",
  "Mystery Encounter",
  "Utils",
  "UI",
]);

/**
 * @typedef {typeof validTestTypes[number]}
 * testType
 * Union type representing a single valid choice of test type.
 */

/**
 * Const object mapping each test type to any additional names they can be used with from CLI.
 * @satisfies {Partial<Record<testType, readonly string[]>>}
 */
export const cliAliases = /** @type {const} */ ({
  "Mystery Encounter": ["ME"],
});

/**
 * Const object matching all test types to the directories in which their tests reside.
 * @satisfies {Record<testType, string>}
 */
export const testTypesToDirs = /** @type {const} */ ({
  Move: "moves",
  Ability: "abilities",
  Item: "items",
  Reward: "rewards",
  "Mystery Encounter": "mystery-encounter/encounters",
  Utils: "utils",
  UI: "ui",
});
