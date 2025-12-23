import "dotenv/config";
import { writeFileSync } from "node:fs";
import { Octokit } from "octokit";

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

async function getPrDescription() {
  try {
    console.log(
      `Fetching PRs to ${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/${
        CONFIG.REPO_BRANCH
      } since ${dateFormatter.format(new Date(CONFIG.SINCE))}...`,
    );

    const pullRequests = await octokit.rest.pulls.list({
      owner: CONFIG.REPO_OWNER,
      repo: CONFIG.REPO_NAME,
      base: CONFIG.REPO_BRANCH,
      state: "closed",
      sort: "updated",
      direction: "desc",
    });

    console.log(`Found ${pullRequests.data.length} PRs`);

    const filteredPullRequests = pullRequests.data.filter(pr => {
      return pr.updated_at > CONFIG.SINCE;
    });

    let output = "";

    for (const pr of filteredPullRequests) {
      if (!pr.body) {
        console.log(`\x1b[31mDescription missing for PR: ${pr.title} (${pr.number})\x1b[0m\n`);
        return;
      }
      const section = getSection(pr.body);
      if (section) {
        output += `PR: ${pr.title} (${pr.number})\n${getSection(pr.body)}\n\n`;
      } else {
        console.log(`\x1b[31mChangelog missing for PR: ${pr.title} (${pr.number})\x1b[0m\n`);
        output += `PR: ${pr.title} (${pr.number})\nChangelog missing\n\n`;
      }
    }

    writeFileSync(CONFIG.OUTPUT_FILE, output, "utf8");
    console.log(`Results written to ${CONFIG.OUTPUT_FILE}`);
  } catch (error) {
    console.error(error);
  }
}

/**
 * @param {string} description - The description to get the section from
 */
function getSection(description) {
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
  const login = await octokit.rest.users.getAuthenticated();
  console.log(`Hello, ${login.data.login}!`);
  await getPrDescription();
}

await main();
