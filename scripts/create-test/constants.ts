/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Array containing all valid options for the type of test file to create.
 * @package
 */
export const validTestTypes = ["Move", "Ability", "Item", "Reward", "Mystery Encounter", "Utils", "UI"] as const;

/** Union type representing a single valid choice of test type. */
export type TestType = (typeof validTestTypes)[number];

/** Const object mapping each test type to any additional names they can be used with from CLI. */
export const cliAliases = {
  "Mystery Encounter": ["ME"],
} as const satisfies Partial<Record<TestType, readonly string[]>>;

/** Const object matching all test types to the directories in which their tests reside. */
export const testTypesToDirs = {
  Move: "moves",
  Ability: "abilities",
  Item: "items",
  Reward: "rewards",
  "Mystery Encounter": "mystery-encounter/encounters",
  Utils: "utils",
  UI: "ui",
} as const satisfies Record<TestType, string>;
