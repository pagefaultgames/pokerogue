/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @import {Label, CategoryName} from "./config.mjs"
 */

import { CONFIG } from "./config.mjs";

/**
 * @typedef {{
 *  number: number
 *  title: string
 *  body?: string
 *  labels: Label[]
 * }} PullRequest
 */

/**
 * Format the changelog.
 * @param {PullRequest[]} changelog - The changelog to format
 * @returns {string} The formatted changelog.
 */
export function formatChangelog(changelog) {
  let output = "";
  /** @type {Map<CategoryName, string[]>} */
  const categories = new Map();
  for (const category of CONFIG.CATEGORIES) {
    categories.set(category.name, []);
  }

  for (const pr of changelog) {
    const formattedBody = formatPullRequest(pr);
    if (!formattedBody) {
      categories.set("Unknown", [...(categories.get("Unknown") || []), `- #${pr.number}\n`]);
      continue;
    }

    // Group PRs by category based on labels
    const category = getCategoryFromLabels(pr.labels);
    categories.set(category, [...(categories.get(category) || []), formattedBody]);
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
 * @param {PullRequest} pr - The PR to format
 * @returns {string | null} The formatted PR or `null` if the PR is missing a changelog.
 */
function formatPullRequest(pr) {
  if (!pr.body) {
    return null;
  }

  const sanitizedBody = sanitizeBody(pr.body);
  if (!sanitizedBody) {
    return null;
  }

  return `- #${pr.number}\n  - ${sanitizedBody}\n`;
}

/**
 * sanitize the body of a PR.
 * @param {string} body - The body to sanitize
 * @returns {string} The sanitized body.
 */
function sanitizeBody(body) {
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
 * @param {Label[]} labels
 * @returns {CategoryName} The category for the PR.
 * @remarks
 * If a PR has labels that apply to different categories, the one that was defined first in {@linkcode CONFIG} takes precedence.
 */
function getCategoryFromLabels(labels) {
  for (const category of CONFIG.CATEGORIES) {
    if (labels.some(label => category.labels.includes(label))) {
      return category.name;
    }
  }
  return "Miscellaneous";
}
