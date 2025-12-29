/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const CONFIG = {
  REPO_OWNER: "",
  REPO_NAME: "pokerogue",
  REPO_BRANCH: "",
  CUTOFF_BRANCH: "main",
  CUTOFF_DATE: "",
  OUTPUT_FILE: "pr_descriptions.txt",
  CHANGELOG_SECTION: "## What are the changes the user will see?",
  FILTER: ["n/a"],
  PER_PAGE: 50,
};

export const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  timeZoneName: "short",
});
