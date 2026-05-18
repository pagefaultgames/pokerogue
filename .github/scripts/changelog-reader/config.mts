/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const LABELS = [
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
] as const;
export type Label = (typeof LABELS)[number];

export type CategoryName = "Bug Fixes" | "Balance" | "Translation" | "Art" | "Miscellaneous" | "Unknown" | "Beta";

export type Category = {
  name: CategoryName;
  labels: Label[];
};

export const CONFIG = {
  REPO_OWNER: "pagefaultgames",
  REPO_NAME: "pokerogue",
  REPO_BRANCH: "",
  CUTOFF_BRANCH: "main",
  CHANGELOG_SECTION: "## What are the changes the user will see?",
  OUTPUT_FILE: "changelog.md",
  FILTERS: ["n/a"],
  CATEGORIES: [
    { name: "Bug Fixes", labels: ["P0 Bug", "P1 Bug", "P2 Bug", "P3 Bug"] },
    { name: "Balance", labels: ["Game Balance", "Balance Team"] },
    { name: "Translation", labels: ["Localization"] },
    { name: "Art", labels: ["Sprite/Animation"] },
    // Used for PRs that don't fit any other category
    { name: "Miscellaneous", labels: ["Miscellaneous"] },
    // Used for PRs that don't have a changelog section
    { name: "Unknown", labels: [] },
    { name: "Beta", labels: ["Beta"] },
  ] satisfies Category[] as Category[],
};
