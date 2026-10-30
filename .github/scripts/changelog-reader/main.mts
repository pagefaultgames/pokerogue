/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import chalk from "chalk";
import { Octokit } from "octokit";
import { CONFIG, type Label, SCRIPT_VERSION } from "./config.mts";
import { formatChangelog, getFinalChangelog, type PullRequest } from "./format.mts";

chalk.level = 2;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Start the `changelog-reader` script.
 * @returns A Promise that resolves when the script is finished executing.
 */
async function main(): Promise<void> {
  console.group(`📝 Changelog Reader v${SCRIPT_VERSION}`);
  try {
    const success = await loadConfig();
    if (!success) {
      return;
    }

    await getAndProcessChangelog();
  } catch (error) {
    process.exitCode = 1;
    console.error(error);
  }
}

/** Retrieve and process the changelog */
async function getAndProcessChangelog(): Promise<void> {
  const prs = await getDiff();
  if (prs.size === 0) {
    console.log("No commits found between branches");
    return;
  }

  const pullRequests = await getPullRequests(prs);
  const openPrs = await getOpenPrs();
  if (pullRequests.length === 0 && openPrs.length === 0) {
    console.log("No PRs found");
    return;
  }
  console.log(`Found ${pullRequests.length} merged PRs and ${openPrs.length} open PRs`);

  const output = formatChangelog(pullRequests, openPrs);
  if (process.env.GITHUB_ACTIONS) {
    await updateDescription(output);
  } else {
    //! Note: to run locally, a separate GitHub API token needs to be generated
    const description = await getFinalChangelog(output);

    // dynamically imported to not need the checkout of the helper file during the workflow
    const { writeFileSafe } = await import("../../../scripts/utils/file.ts");
    writeFileSafe(CONFIG.OUTPUT_FILE, description, "utf8");
    console.log(`✔ Output written to ${CONFIG.OUTPUT_FILE} successfully!`);
  }
}

/**
 * Get a set of commit SHAs from the branch diff.
 * @returns A Promise that resolves with all commit SHAs from the branch diff.
 */
async function getDiff(): Promise<Set<string>> {
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
 * @param commits - The commit SHAs
 * @returns A Promise that resolves with the list of pull requests.
 */
async function getPullRequests(commits: Set<string>): Promise<PullRequest[]> {
  const pullRequests: PullRequest[] = [];
  const seenPrs = new Set<number>();
  for (const sha of commits) {
    try {
      const prs = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
        owner: CONFIG.REPO_OWNER,
        repo: CONFIG.REPO_NAME,
        commit_sha: sha,
      });
      const pr = prs.data.find(p => p.merged_at != null);
      if (!pr || seenPrs.has(pr.number)) {
        continue;
      }
      seenPrs.add(pr.number);
      const section = getChangelogSection(pr.body || "");
      pullRequests.push({
        number: pr.number,
        title: pr.title,
        body: section,
        labels: pr.labels.map(l => l.name as Label),
      });
    } catch (error) {
      console.error(`Failed to get PR ${sha}: ${error}`);
    }
  }
  return pullRequests;
}

const sectionRegex = new RegExp(`${CONFIG.CHANGELOG_SECTION}([\\s\\S]*?)(?=##)`, "i");

/**
 * @param description - The description to get the section from
 */
function getChangelogSection(description: string): string | undefined {
  const match = description.match(sectionRegex);
  return match?.[0];
}

/**
 * Get all open PRs targeting the base branch
 * @returns A Promise resolving to an Array of {@linkcode PullRequest}s
 */
async function getOpenPrs(): Promise<PullRequest[]> {
  const openPrs = await octokit.rest.pulls.list({
    owner: CONFIG.REPO_OWNER,
    repo: CONFIG.REPO_NAME,
    base: CONFIG.REPO_BRANCH,
    per_page: 100,
    state: "open",
  });
  return openPrs.data.map(pr => ({
    number: pr.number,
    title: pr.title,
    body: pr.body ?? undefined,
    labels: [],
  }));
}

/**
 * Write the generated changelog to the PR description.
 * @param changelog - The changelog to update
 * @returns A Promise that resolves when the description has been updated.
 */
async function updateDescription(changelog: string): Promise<void> {
  if (!process.env.PR_NUMBER) {
    console.error(chalk.red("PR_NUMBER not set. Could not update PR description."));
    process.exitCode = 1;
    return;
  }

  const description = await getFinalChangelog(changelog);

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
 * @returns A Promise that resolves with whether the config was loaded successfully.
 */
async function loadConfig(): Promise<boolean> {
  if (!process.env.GITHUB_ACTIONS) {
    const branch = process.argv[2] || "beta";
    CONFIG.REPO_BRANCH = branch;
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
