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
  CUTOFF_BRANCH: "main",
  SINCE: "2025-12-10T00:00:00+00:00",
  OUTPUT_FILE: "pr_descriptions.txt",
  CHANGELOG_SECTION: "## What are the changes the user will see?",
  FILTER: ["n/a"],
  PER_PAGE: 50,
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  timeZoneName: "short",
});

async function main() {
  try {
    // TODO: Remove. Just for testing
    const login = await octokit.rest.users.getAuthenticated();
    console.log(`Hello, ${login.data.login}!`);
    const cutoffDate = await getCutoffDate();
    if (!cutoffDate) {
      process.exitCode = 1;
      console.error("\x1b[31mFailed to get cutoff date)\x1b[0m");
      return;
    }
    console.log(`Cutoff date: ${cutoffDate}`);
    CONFIG.SINCE = cutoffDate;

    await getChangelogs();
  } catch (error) {
    console.error(error);
  }
}

async function getPullRequests() {
  console.log(
    `Fetching PRs to ${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/${
      CONFIG.REPO_BRANCH
    } since ${dateFormatter.format(new Date(CONFIG.SINCE))}...`,
  );

  return await getPullRequestPage();
}

/**
 * Fetch a page of PRs
 * @param {number} page
 * @returns {Promise<import("@octokit/types").Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"] | undefined>}
 */
async function getPullRequestPage(page = 1) {
  /**
   * @type {import("@octokit/types").Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"]}
   */
  const allPRs = [];
  console.log(`Fetching page ${page}...`);
  const pagePRs = await octokit.rest.pulls
    .list({
      owner: CONFIG.REPO_OWNER,
      repo: CONFIG.REPO_NAME,
      base: CONFIG.REPO_BRANCH,
      state: "closed",
      sort: "updated",
      direction: "desc",
      per_page: CONFIG.PER_PAGE,
      page,
    })
    .then(res => res.data);

  // filter old and closed PRs that were not merged
  const filteredPullRequests = pagePRs.filter(pr => {
    if (!pr.merged_at) {
      return false;
    }
    return pr.merged_at > CONFIG.SINCE;
  });

  if (filteredPullRequests.length === 0) {
    return allPRs;
  }
  allPRs.push(...filteredPullRequests);

  // fetch next page if we have reached the page limit
  if (pagePRs.length === CONFIG.PER_PAGE) {
    const nextPage = await getPullRequestPage(page + 1);
    if (!nextPage) {
      return allPRs;
    }
    allPRs.push(...nextPage);
  }
  return allPRs;
}

async function getChangelogs() {
  const pullRequests = await getPullRequests();
  if (!pullRequests) {
    console.log("No PRs found");
    process.exitCode = 1;
    return;
  }
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
  await updateDescription(output);
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

/**
 * Write the generated changelog to the update PR description
 * @param {string} changelog
 */
async function updateDescription(changelog) {
  changelog += `\n---------------------------\n**This changelog was auto generated at ${dateFormatter.format(new Date())}.**`;
  await octokit.rest.pulls.update({
    // todo: Update owner and PR number
    owner: "fabske0",
    repo: CONFIG.REPO_NAME,
    pull_number: 2,
    body: changelog,
  });
}

/**
 * Get the date of the last commit to the main branch.
 * @returns {Promise<string | undefined>} ISO 8601 date string
 */
async function getCutoffDate() {
  const commits = await octokit.rest.repos.listCommits({
    owner: CONFIG.REPO_OWNER,
    repo: CONFIG.REPO_NAME,
    sha: CONFIG.CUTOFF_BRANCH,
    per_page: 1,
  });

  const date = commits.data[0].commit.committer?.date;
  return date;
}

await main();
