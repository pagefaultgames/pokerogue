/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Octokit } from "octokit";
import { formatChangelog } from "./format.js";
import { CONFIG, dateFormatter } from "./utils.js";

/**
 * The version of this script
 * @type {string}
 */
const SCRIPT_VERSION = "1.0.0";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function main() {
  try {
    console.group(`📝 Changelog Reader v${SCRIPT_VERSION}`);

    const success = await loadConfig();
    if (!success) {
      return;
    }

    await getChangelogs();
  } catch (error) {
    process.exitCode = 1;
    console.error(error);
  }
}

async function getPullRequests() {
  console.log(
    `Fetching PRs to ${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/${
      CONFIG.REPO_BRANCH
    } since ${dateFormatter.format(new Date(CONFIG.CUTOFF_DATE))}...`,
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
    return pr.merged_at > CONFIG.CUTOFF_DATE;
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

  /** @type {import("./format.js").PullRequest[]} */
  const changelog = [];

  for (const pr of pullRequests) {
    if (!pr.body) {
      console.log(`\x1b[31mDescription missing for PR: ${pr.title} (${pr.number})\x1b[0m\n`);
      changelog.push({
        number: pr.number,
        title: pr.title,
        body: null,
      });
      continue;
    }
    const section = getChangelogSection(pr.body);
    if (section) {
      changelog.push({
        number: pr.number,
        title: pr.title,
        body: section,
      });
    } else {
      console.log(`\x1b[31mChangelog missing for PR: ${pr.title} (${pr.number})\x1b[0m\n`);
      changelog.push({
        number: pr.number,
        title: pr.title,
        body: null,
      });
    }
  }

  const output = formatChangelog(changelog);
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

  return match[0];
}

/**
 * Write the generated changelog to the update PR description
 * @param {string} changelog
 */
async function updateDescription(changelog) {
  const description =
    `**Changelog:** ${CONFIG.REPO_BRANCH} ---> ${CONFIG.CUTOFF_BRANCH}\n---------------------------\n`
    + changelog
    + `\n---------------------------\n**This changelog was auto generated at ${dateFormatter.format(new Date())}.**`;

  if (!process.env.GITHUB_ACTIONS) {
    console.log("Skipping PR description update.");
    return;
  }
  if (!process.env.PR_NUMBER) {
    console.error("\x1b[31mPR_NUMBER not set. Could not update PR description.\x1b[0m");
    process.exitCode = 1;
    return;
  }
  await octokit.rest.pulls
    .update({
      owner: CONFIG.REPO_OWNER,
      repo: CONFIG.REPO_NAME,
      pull_number: Number(process.env.PR_NUMBER),
      body: description,
    })
    .catch(err => {
      process.exitCode = 1;
      console.error(`\x1b[31mFailed to update PR description: ${err}\x1b[0m`);
    });
}

/**
 * Get the date of the last commit to the main branch.
 * @returns {Promise<string>} The ISO 8601 date string of the last commit.
 */
async function getCutoffDate() {
  const commits = await octokit.rest.repos.listCommits({
    owner: CONFIG.REPO_OWNER,
    repo: CONFIG.REPO_NAME,
    sha: CONFIG.CUTOFF_BRANCH,
    per_page: 1,
  });

  const date = commits.data[0].commit.committer?.date;
  return date || "";
}

/**
 * Load the configuration from the environment.
 * @returns {Promise<boolean>} Whether the config was loaded successfully.
 */
async function loadConfig() {
  if (!process.env.GITHUB_ACTIONS || !process.env.PR_BRANCH) {
    console.error("Not running in GitHub Actions.");
    process.exitCode = 1;
    return false;
  }

  const [_, branch] = process.env.PR_BRANCH.split(":");
  if (!branch) {
    console.error("Failed to parse PR branch.");
    process.exitCode = 1;
    return false;
  }
  if (branch === CONFIG.CUTOFF_BRANCH) {
    console.error("PR branch is the same as the cutoff branch.");
    process.exitCode = 1;
    return false;
  }
  if (branch !== "beta" && !branch.startsWith("hotfix-")) {
    console.error("PR branch must be 'beta' or start with 'hotfix-'.");
    process.exitCode = 1;
    return false;
  }

  CONFIG.REPO_BRANCH = branch;
  CONFIG.CUTOFF_DATE = await getCutoffDate();

  if (!CONFIG.CUTOFF_DATE || !CONFIG.REPO_BRANCH) {
    console.error("Failed to load config.");
    process.exitCode = 1;
    return false;
  }
  return true;
}

await main();
