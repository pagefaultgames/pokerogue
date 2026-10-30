/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type CategoryName, CONFIG, type Label, SCRIPT_VERSION } from "./config.mts";
export type PullRequest = {
  number: number;
  title: string;
  body?: string | undefined;
  labels: Label[];
};

/**
 * @example
 * December 20, 2025 at 10:10 AM UTC
 */
export const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  timeZoneName: "short",
  timeZone: "UTC",
});

/**
 * Format the changelog.
 * @param changelog - The changelog to format
 * @returns The formatted changelog.
 */
export function formatChangelog(changelog: PullRequest[], openPrs: PullRequest[]): string {
  let output = "";
  const categories = new Map<CategoryName, string[]>();
  for (const category of CONFIG.CATEGORIES) {
    categories.set(category.name, []);
  }

  for (const pr of changelog) {
    const formattedBody = formatPullRequest(pr);
    if (!formattedBody) {
      categories.set("Unknown", [...(categories.get("Unknown") || []), `- #${pr.number}\n`]);
      continue;
    }

    // have to filter here so the beta label has priority
    if (pr.labels.includes("Beta")) {
      categories.set("Beta", [...(categories.get("Beta") || []), `- #${pr.number}\n`]);
      continue;
    }

    // Group PRs by category based on labels
    const category = getCategoryFromLabels(pr.labels);
    categories.set(category, [...(categories.get(category) || []), formattedBody]);
  }

  if (CONFIG.REPO_BRANCH !== "beta" && openPrs.length > 0) {
    const info = openPrs.length === 1 ? "is 1 open PR" : `are ${openPrs.length} open PRs`;
    output += `> [!NOTE]\n> There ${info} targeting ${CONFIG.REPO_BRANCH}:\n`;
    for (const openPr of openPrs) {
      output += `> - #${openPr.number}\n`;
    }
    output += "\n";
  }

  for (const [category, prs] of categories) {
    if (prs.length === 0) {
      continue;
    }
    output += `## ${category}\n\n${prs.join("")}`;
  }

  return output;
}

/**
 * Format a single PR.
 * @param pr - The PR to format
 * @returns The formatted PR or `null` if the PR is missing a changelog.
 */
function formatPullRequest(pr: PullRequest): string | null {
  if (!pr.body) {
    return null;
  }

  const sanitizedBody = sanitizeBody(pr.body);
  if (!sanitizedBody) {
    return null;
  }

  const lines = sanitizedBody.split("\n");
  const indentedBody = lines
    .map((line, index) => {
      const prefix = index === 0 && !line.trimStart().startsWith("- ") ? "  - " : "\t";
      return line.trim() === "" ? "" : prefix + line;
    })
    .join("\n");

  return `- #${pr.number}\n${indentedBody}\n`;
}

/**
 * Sanitize the body of a PR.
 * @param body - The body to sanitize
 * @returns The sanitized body.
 */
function sanitizeBody(body: string): string {
  if (!body) {
    return "";
  }

  // remove any comments (<!-- -->)
  let result = body.replace(/<!--[\s\S]*?-->/g, "");

  // remove `<!--` of the changelog cutoff (if present)
  result = result.replace(/<!--\s*$/, "");

  // remove section header
  result = result.replace(CONFIG.CHANGELOG_SECTION, "");

  for (const filter of CONFIG.FILTERS) {
    if (result.toLowerCase().includes(filter.toLowerCase())) {
      return "";
    }
  }

  return result.trim();
}

/**
 * Get the category based on the PRs labels.
 * @param labels - The labels of the PR
 * @returns The category for the PR.
 * @remarks
 * If a PR has labels that apply to different categories, the one that was defined first in {@linkcode CONFIG} takes precedence.
 */
function getCategoryFromLabels(labels: Label[]): CategoryName {
  for (const category of CONFIG.CATEGORIES) {
    if (labels.some(label => category.labels.includes(label))) {
      return category.name;
    }
  }
  return "Miscellaneous";
}

export async function getFinalChangelog(changelogText: string) {
  const versions = await getVersions();
  let header = `**Changelog:** ${CONFIG.REPO_BRANCH} ---> ${CONFIG.CUTOFF_BRANCH}\n`;
  if (versions.changed) {
    header += `#### Version: ${versions.currentVersion} ---> ${versions.newVersion}`;
  } else {
    header += "> [!WARNING]\nNo version change detected.";
  }

  const description =
    header
    + "\n---------------------------\n"
    + changelogText
    + `\n---------------------------\n**This changelog was auto generated at ${dateFormatter.format(new Date())} by Changelog Reader v${SCRIPT_VERSION}.**`;
  return description;
}

async function getVersions(): Promise<{ changed: boolean; currentVersion: string; newVersion: string }> {
  const baseUrl = "https://raw.githubusercontent.com/pagefaultgames/pokerogue/{BRANCH_NAME}/package.json";

  const curentPackage = await (await fetch(baseUrl.replace("{BRANCH_NAME}", CONFIG.CUTOFF_BRANCH))).json();
  const prPackage = await (await fetch(baseUrl.replace("{BRANCH_NAME}", CONFIG.REPO_BRANCH))).json();

  const currentVersion = curentPackage.version;
  const newVersion = prPackage.version;

  return {
    changed: currentVersion !== newVersion,
    currentVersion,
    newVersion,
  };
}
