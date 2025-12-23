/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import "dotenv/config";
import { Octokit } from "octokit";
import { writeFileSafe } from "../helpers/file.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const CONFIG = {
  REPO_OWNER: "pagefaultgames",
  REPO_NAME: "pokerogue",
  REPO_BRANCH: "beta",
  SINCE: "2025-12-10T00:00:00+00:00",
  OUTPUT_FILE: "pr_descriptions.txt",
  CHANGELOG_SECTION: "## What are the changes the user will see?",
  FILTER: ["n/a"],
};
const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  timeZoneName: "short",
});

async function getPullRequests() {
  console.log(
    `Fetching PRs to ${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/${
      CONFIG.REPO_BRANCH
    } since ${dateFormatter.format(new Date(CONFIG.SINCE))}...`,
  );

  const allPRs = await octokit.rest.pulls.list({
    owner: CONFIG.REPO_OWNER,
    repo: CONFIG.REPO_NAME,
    base: CONFIG.REPO_BRANCH,
    state: "closed",
    sort: "updated",
    direction: "desc",
  });

  // filter old and closed PRs that were not merged
  const filteredPullRequests = allPRs.data.filter(async pr => {
    return pr.updated_at > CONFIG.SINCE && (await isPullRequestMerged(pr.number));
  });

  return filteredPullRequests;
}

/**
 * Check if the pull request got succesfully merged
 * @param {number} pullNumber
 */
async function isPullRequestMerged(pullNumber) {
  return await octokit.rest.pulls
    .checkIfMerged({
      owner: CONFIG.REPO_OWNER,
      repo: CONFIG.REPO_NAME,
      pull_number: pullNumber,
    })
    .then(_ => {
      return true;
    })
    .catch(_ => {
      return false;
    });
}

async function getChangelogs() {
  const pullRequests = await getPullRequests();
  console.log(`Found ${pullRequests.length} PRs`);

  let output = "";

  for (const pr of pullRequests) {
    if (!pr.body) {
      console.log(`\x1b[31mDescription missing for PR: ${pr.title} (${pr.number})\x1b[0m\n`);
      return;
    }
    const section = getChangelogSection(pr.body);
    if (section) {
      output += `PR: ${pr.title} (${pr.number})\n${getChangelogSection(pr.body)}\n\n`;
    } else {
      console.log(`\x1b[31mChangelog missing for PR: ${pr.title} (${pr.number})\x1b[0m\n`);
      output += `PR: ${pr.title} (${pr.number})\nChangelog missing\n\n`;
    }
  }

  writeFileSafe(CONFIG.OUTPUT_FILE, output, "utf8");
  console.log(`Results written to ${CONFIG.OUTPUT_FILE}`);
}

/**
 * @param {string} description - The description to get the section from
 */
function getChangelogSection(description) {
  const regex = new RegExp(`${CONFIG.CHANGELOG_SECTION}([\\s\\S]*?)(?=##)`, "i");
  const match = description.match(regex);

  if (!match) {
    return null;
  }

  let result;
  // remove any comments (<!-- -->)
  result = match[0].replace(/<!--[\s\S]*?-->/g, "");

  // remove section header
  result = result.replace(CONFIG.CHANGELOG_SECTION, "");

  // remove filter words
  for (const filter of CONFIG.FILTER) {
    result = result.replace(new RegExp(filter, "i"), "");
  }

  return result.trim() !== "" ? result : null;
}

async function main() {
  try {
    const login = await octokit.rest.users.getAuthenticated();
    console.log(`Hello, ${login.data.login}!`);
    await getChangelogs();
  } catch (error) {
    console.error(error);
  }
}

await main();
