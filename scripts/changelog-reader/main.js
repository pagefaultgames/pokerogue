/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Octokit } from "octokit";
import { writeFileSafe } from "../helpers/file.js";
import { COLORS, CONFIG, LOCAL_CONFIG } from "./config.js";
import { formatChangelog } from "./format.js";

/**
 * @import {Label} from "./config.js"
 * @import {PullRequest} from "./format.js"
 */

/**
 * @typedef {import("@octokit/types").Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"]} PullRequestResponse
 */

/**
 * The version of this script
 * @type {string}
 */
const SCRIPT_VERSION = "1.0.0";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * @example
 * December 20, 2025 at 10:10 AM UTC
 */
const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  timeZoneName: "short",
  timeZone: "UTC",
});

async function main() {
  console.group(`📝 Changelog Reader v${SCRIPT_VERSION}`);
  try {
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
 * @returns {Promise<PullRequestResponse | undefined>}
 */
async function getPullRequestPage(page = 1) {
  /**
   * @type {PullRequestResponse}
   */
  const allPRs = [];
  console.log(`Fetching page ${page}...`);
  const pagePRs = await octokit.rest.pulls.list({
    owner: CONFIG.REPO_OWNER,
    repo: CONFIG.REPO_NAME,
    base: CONFIG.REPO_BRANCH,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: CONFIG.PER_PAGE,
    page,
  });

  // filter old and closed PRs that were not merged
  const filteredPullRequests = pagePRs.data.filter(pr => {
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
  if (pagePRs.data.length === CONFIG.PER_PAGE) {
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

  /** @type {PullRequest[]} */
  const changelog = [];

  for (const pr of pullRequests) {
    if (!pr.body) {
      console.log(`${COLORS.red}Description missing for PR: ${pr.title} (${pr.number})${COLORS.reset}\n`);
      changelog.push({
        number: pr.number,
        title: pr.title,
        labels: [],
      });
      continue;
    }
    const section = getChangelogSection(pr.body);
    changelog.push({
      number: pr.number,
      title: pr.title,
      body: section,
      labels: pr.labels.map(l => /** @type {Label} */ (l.name)),
    });
  }

  const output = formatChangelog(changelog);
  if (process.env.GITHUB_ACTIONS) {
    await updateDescription(output);
  } else {
    writeFileSafe(CONFIG.OUTPUT_FILE, output, "utf8");
    console.log(`✔ Output written to ${CONFIG.OUTPUT_FILE} successfully!`);
  }
}

const sectionRegex = new RegExp(`${CONFIG.CHANGELOG_SECTION}([\\s\\S]*?)(?=##)`, "i");
/**
 * @param {string} description - The description to get the section from
 */
function getChangelogSection(description) {
  const match = description.match(sectionRegex);

  return match?.[0];
}

/**
 * Write the generated changelog to the PR description.
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
    console.error("${COLORS.red}PR_NUMBER not set. Could not update PR description.${COLORS.reset}");
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
      console.error(`${COLORS.red}Failed to update PR description: ${err}${COLORS.reset}`);
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
  return date ?? "";
}

/**
 * Load the configuration from the environment.
 * @returns {Promise<boolean>} Whether the config was loaded successfully.
 */
async function loadConfig() {
  if (!process.env.GITHUB_ACTIONS) {
    Object.assign(CONFIG, LOCAL_CONFIG);
    return true;
  }
  if (!process.env.PR_BRANCH) {
    console.error("PR branch env is undefined");
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
