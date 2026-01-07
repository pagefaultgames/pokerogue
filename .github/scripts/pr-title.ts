/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 * SPDX-FileContributor: NightKev <https://github.com/DayKev>
 * SPDX-FileContributor: OrangeRed <https://github.com/OrangeRed>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// biome-ignore-all lint/performance/noNamespaceImport: This is the intended import method for these modules
import * as core from "@actions/core";
import * as github from "@actions/github";

const PREFIXES = [
  "balance", // Primarily a balance change
  "chore", // Misc project upkeep (e.g. updating submodules, updating dependencies, reverting a bad commit) not covered by other prefixes
  "dev", // Improving the developer experience (such as by modifying lint rules or creating cli scripts)
  "docs", // Primarily adding/updating documentation
  "feat", // Adding a new feature (e.g. adding a new implementation of a move) or redesigning an existing feature
  "fix", // Fixing a bug
  "github", // Updating the CI pipeline or otherwise modifying something in the `./github/**` directory
  "i18n", // Adding/modifying translation keys, etc
  "misc", // A change that doesn't fit any other prefix
  "refactor", // A change that doesn't impact functionality or fix any bugs (except incidentally)
  "test", // Primarily adding/updating tests or modifying the test framework
] as const;

type Prefixes = (typeof PREFIXES)[number];

const ALL_SCOPES = [
  "ability",
  "ai",
  "audio",
  "battle", // Relating to the general battle engine
  "biomes",
  "challenge",
  "encounter", // Mystery Encounters
  "event", // e.g. adding a Christmas event to the game
  "graphics", // Anything related to art/graphics (adding new sprites, fixing a sprite that isn't displaying properly, etc)
  "item",
  "move",
  "ui", // UI/UX
] as const;

type AllScopes = (typeof ALL_SCOPES)[number];

const PREFIX_SCOPE_MAP = {
  balance: ["ability", "ai", "biomes", "challenge", "encounter", "event", "item", "move"],
  chore: [],
  dev: [],
  docs: ALL_SCOPES,
  feat: ALL_SCOPES,
  fix: ALL_SCOPES,
  github: [],
  i18n: [],
  misc: [],
  refactor: ALL_SCOPES,
  test: ALL_SCOPES,
} as const satisfies Record<Prefixes, readonly AllScopes[]>;

async function run(): Promise<void> {
  try {
    const authToken = core.getInput("github_token", { required: true });

    const { eventName } = github.context;
    if (eventName !== "pull_request") {
      core.setFailed(`Invalid event: ${eventName}`);
      return;
    }

    const client = github.getOctokit(authToken);
    // The pull request info on the context isn't up to date.
    // When the user updates the title and re-runs the workflow, it would be outdated.
    // Therefore fetch the pull request via the REST API to ensure we use the current title.
    const { data: pullRequest } = await client.rest.pulls.get({
      owner: github.context.payload.pull_request!.base.user.login,
      repo: github.context.payload.pull_request!.base.repo.name,
      pull_number: github.context.payload.pull_request!.number,
    });

    const { title } = pullRequest;
    core.info(`Pull Request title: "${title}"`);

    // if (title.length > 72) {
    //   core.setFailed(`Max title length of 72 exceeded! Current length: ${title.length}`);
    //   return;
    // }

    // Note: `!` allowed before `:` for changes including a save migrator and/or version increase
    const info = `
Terminology: fix(move): Future Sight no longer crashes
             ^   ^      ^
             |   |      |__ Subject
             |   |_________ Scope (optional)
             |_____________ Prefix
`;

    core.info(info.trim());

    // Example usage of regex: https://regex101.com/r/FeN8jG/7
    const regex = /^([a-z]+)!?(\([a-z]+\))?: .+/;
    if (!regex.test(title)) {
      core.setFailed(`Pull Request title "${title}" failed to match - "Prefix(Scope): Subject"`);
      return;
    }

    const regexResult = regex.exec(title);
    const prefix = regexResult[1];
    const scope = regexResult[2]?.replace(/[()]/g, "");

    if (!PREFIXES.some(p => p === prefix)) {
      core.setFailed(`Pull Request title "${title}" did not match any of the prefixes: [${PREFIXES}]`);
      return;
    }

    // biome-ignore lint/style/useExplicitLengthCheck: doubles as a nullish check for `scope`
    if (scope?.length && !PREFIX_SCOPE_MAP[prefix].includes(scope)) {
      core.setFailed(`Pull Request title "${title}" has an invalid prefix (${prefix}) + scope (${scope}) combination!`);
      return;
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
