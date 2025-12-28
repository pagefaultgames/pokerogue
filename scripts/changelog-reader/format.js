/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CONFIG } from "./utils.js";

/**
 * @typedef {{
 *  number: number
 *  title: string
 *  body: string | null
 * }} PullRequest
 */

/**
 * Format the changelog.
 * @param {PullRequest[]} changelog - The changelog to format
 * @returns {string} The formatted changelog.
 */
export function formatChangelog(changelog) {
  let output = "";
  for (const pr of changelog) {
    output += formatPullRequest(pr);
  }
  return output;
}

/**
 * Format a single PR.
 * @param {PullRequest} pr - The PR to format
 * @returns {string} The formatted PR.
 */
function formatPullRequest(pr) {
  let output = `- ${pr.title} (#${pr.number})\n`;
  const sanatizedBody = sanatizeBody(pr.body);
  if (sanatizedBody) {
    output += `  - ${sanatizedBody}\n`;
  } else {
    output += "  - No changelog provided\n";
  }
  output += "\n";
  return output;
}

/**
 * Sanatize the body of a PR.
 * @param {string | null} body - The body to sanatize
 * @returns {string} The sanatized body.
 */
function sanatizeBody(body) {
  if (!body) {
    return "";
  }

  let result;
  // remove any comments (<!-- -->)
  result = body.replace(/<!--[\s\S]*?-->/g, "");

  // remove section header
  result = result.replace(CONFIG.CHANGELOG_SECTION, "");

  // remove filter words
  for (const filter of CONFIG.FILTER) {
    result = result.replace(new RegExp(filter, "i"), "");
  }
  return result.trim() || "";
}
