/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import chalk from "chalk";
import { Octokit } from "octokit";
import { CONFIG } from "./config.mjs";
import { formatChangelog } from "./format.mjs";

chalk.level = 2;

/**
 * @import {Label} from "./config.mjs"
 * @import {PullRequest} from "./format.mjs"
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

    await getChangelog();
  } catch (error) {
    process.exitCode = 1;
    console.error(error);
  }
}

async function getChangelog() {
  const prs = await getDiff();
  if (prs.size === 0) {
    console.log("No commits found between branches");
    return;
  }

  const pullRequests = await getPullRequests(prs);
  if (pullRequests.length === 0) {
    console.log("No PRs found");
    return;
  }
  console.log(`Found ${pullRequests.length} PRs`);

  const output = formatChangelog(pullRequests);
  if (process.env.GITHUB_ACTIONS) {
    await updateDescription(output);
  } else {
    // dynamically imported to not need `@inquirer/prompts` during the workflow
    const { writeFileSafe } = await import("../helpers/file.js");
    writeFileSafe(CONFIG.OUTPUT_FILE, output, "utf8");
    console.log(`✔ Output written to ${CONFIG.OUTPUT_FILE} successfully!`);
  }
}

/**
 * Get a set of commit SHAs from the branch diff.
 * @returns {Promise<Set<string>>} Set of commit SHAs
 */
async function getDiff() {
  console.log(`Comparing ${CONFIG.CUTOFF_BRANCH}...${CONFIG.REPO_BRANCH}`);

  const commits = await octokit.paginate(
    octokit.rest.repos.compareCommitsWithBasehead,
    {
      owner: CONFIG.REPO_OWNER,
      repo: CONFIG.REPO_NAME,
      basehead: `${CONFIG.CUTOFF_BRANCH}...${CONFIG.REPO_BRANCH}`,
    },
    response =>
      // @ts-expect-error: `.paginate` doesn't give the right types
      response.data.commits.map(c => c.sha),
  );
  return new Set(commits);
}

/**
 * Get the pull requests for the given commits.
 * @param {Set<string>} commits - The commit SHAs
 * @returns {Promise<PullRequest[]>} List of pull requests.
 */
async function getPullRequests(commits) {
  /** @type {PullRequest[]} */
  const pullRequests = [];
  for (const sha of commits) {
    try {
      const prs = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
        owner: CONFIG.REPO_OWNER,
        repo: CONFIG.REPO_NAME,
        commit_sha: sha,
      });
      const pr = prs.data[0];
      if (!pr) {
        continue;
      }
      const section = getChangelogSection(pr.body || "");
      /** @type {PullRequest} */
      const pullRequest = {
        number: pr.number,
        title: pr.title,
        body: section,
        labels: pr.labels.map(l => /** @type {Label} */ (l.name)),
      };
      pullRequests.push(pullRequest);
    } catch (error) {
      console.error(`Failed to get PR ${sha}: ${error}`);
    }
  }
  return pullRequests;
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
  if (!process.env.PR_NUMBER) {
    console.error(chalk.red("PR_NUMBER not set. Could not update PR description."));
    process.exitCode = 1;
    return;
  }

  const description =
    `**Changelog:** ${CONFIG.REPO_BRANCH} ---> ${CONFIG.CUTOFF_BRANCH}\n---------------------------\n`
    + changelog
    + `\n---------------------------\n**This changelog was auto generated at ${dateFormatter.format(new Date())}.**`;

  await octokit.rest.pulls
    .update({
      owner: CONFIG.REPO_OWNER,
      repo: CONFIG.REPO_NAME,
      pull_number: Number(process.env.PR_NUMBER),
      body: description,
    })
    .catch(err => {
      process.exitCode = 1;
      console.error(chalk.red(`Failed to update PR description: ${err}`));
    });
}

/**
 * Load the configuration from the environment.
 * @returns {Promise<boolean>} Whether the config was loaded successfully.
 */
async function loadConfig() {
  if (!process.env.GITHUB_ACTIONS) {
    CONFIG.REPO_BRANCH = "beta";
    return true;
  }
  if (!process.env.PR_BRANCH) {
    console.error("PR branch env is undefined");
    process.exitCode = 1;
    return false;
  }
  // Extract the "branch" part of "remote:branch"
  const branch = process.env.PR_BRANCH.split(":")[1];
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
  if (branch !== "beta" && branch !== "release" && !branch.startsWith("hotfix-")) {
    console.error("PR branch must be 'beta', 'release', or start with 'hotfix-'.");
    process.exitCode = 1;
    return false;
  }

  CONFIG.REPO_BRANCH = branch;
  return true;
}

await main();
