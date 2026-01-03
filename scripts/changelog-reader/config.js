/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @typedef {LABELS[number]} Label
 */

/**
 * @typedef {"Bug Fixes" | "Balance" | "Translation" | "Art" | "Miscellaneous" | "Missing" } CategoryName
 */

/** @typedef {{
 *  name: CategoryName
 *  labels: Label[]
 * }} Category
 */

export const CONFIG = {
  REPO_OWNER: "pagefaultgames",
  REPO_NAME: "pokerogue",
  REPO_BRANCH: "",
  CUTOFF_BRANCH: "main",
  CHANGELOG_SECTION: "## What are the changes the user will see?",
  OUTPUT_FILE: "changelog.md",
  /** @type {string[]} */
  FILTER: ["n/a"],
  /** @type {Category[]} */
  CATEGORIES: [
    {
      name: "Bug Fixes",
      labels: ["P0 Bug", "P1 Bug", "P2 Bug", "P3 Bug"],
    },
    { name: "Balance", labels: ["Game Balance", "Balance Team"] },
    {
      name: "Translation",
      labels: ["Localization"],
    },
    { name: "Art", labels: ["Sprite/Animation"] },
    // Used for PRs that don't fit any other category
    { name: "Miscellaneous", labels: ["Miscellaneous"] },
    // Used for PRs that don't have a changelog section
    { name: "Missing", labels: [] },
  ],
};

export const LABELS = /** @type {const} */ ([
  "Documentation",
  "Enhancement",
  "Move",
  "Ability",
  "Localization",
  "Item",
  "Game Balance",
  "Balance Team",
  "Miscellaneous",
  "UI/UX",
  "Sprite/Animation",
  "Refactor",
  "Challenges",
  "Game Design",
  "Mystery Encounter",
  "P0 Bug",
  "P1 Bug",
  "P2 Bug",
  "P3 Bug",
  "Beta",
]);

export const COLORS = {
  red: "\x1b[31m",
  reset: "\x1b[0m",
};
