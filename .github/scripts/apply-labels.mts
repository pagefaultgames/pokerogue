/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: NightKev <https://github.com/DayKev>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getInput, info, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

const PREFIX_LABEL_MAP = {
  balance: "Game Balance",
  dev: "Development",
  docs: "Documentation",
  feat: "Enhancement",
  github: "GitHub",
  i18n: "Localization",
  misc: "Miscellaneous",
  perf: "Performance",
  refactor: "Refactor",
  test: "Tests",
} as const;

const SCOPE_LABEL_MAP = {
  ability: "Ability",
  ai: "AI",
  audio: "Audio",
  battle: "Battle",
  beta: "Beta",
  biomes: "Biomes",
  challenge: "Challenges",
  encounter: "Mystery Encounter",
  event: "Event",
  graphics: "Sprite/Animation",
  item: "Item",
  move: "Move",
  ui: "UI/UX",
} as const;

async function run(): Promise<void> {
  try {
    const authToken = getInput("github_token", { required: true });

    const { eventName } = context;
    if (eventName !== "pull_request") {
      setFailed(`Invalid event: ${eventName}`);
      return;
    }
    if (!context.payload.pull_request) {
      setFailed("Error parsing pull request data!");
      return;
    }

    const client = getOctokit(authToken);
    const owner = context.payload.pull_request.base.user.login;
    const repo = context.payload.pull_request.base.repo.name;
    const pull_number = context.payload.pull_request.number;
    const { data: pullRequest } = await client.rest.pulls.get({ owner, repo, pull_number });

    const { title } = pullRequest;
    info(`Pull Request title: "${title}"`);

    const regex = /^([a-z0-9]+)(\([a-z]+\))?!?: .+/;
    const regexResult = regex.exec(title);
    if (!regexResult) {
      setFailed(`Pull Request title "${title}" failed to match "Prefix(Scope): Subject" - unable to apply labels`);
      return;
    }

    const prefix = regexResult[1];
    const scope = regexResult[2]?.replace(/[()]/g, "") ?? "";

    info(`Prefix: "${prefix}"`);
    info(`Scope: "${scope}"`);

    const labels: string[] = [];

    if (prefix === "fix") {
      let applyLabel = true;
      for (const label of pullRequest.labels) {
        if (["P0 Bug", "P1 Bug", "P2 Bug", "P3 Bug"].includes(label.name)) {
          applyLabel = false;
          info(`PR already has a bug label, skipping addition of "Triage" label`);
          break;
        }
      }
      if (applyLabel) {
        labels.push("Triage");
      }
    } else if (prefix in PREFIX_LABEL_MAP) {
      labels.push(PREFIX_LABEL_MAP[prefix as keyof typeof PREFIX_LABEL_MAP]);
    }
    if (scope in SCOPE_LABEL_MAP) {
      labels.push(SCOPE_LABEL_MAP[scope as keyof typeof SCOPE_LABEL_MAP]);
    }

    if (labels.length === 0) {
      info("No valid labels could be applied.");
      return;
    }

    info(`Labels to be added: "${labels}"`);

    await client.rest.issues.addLabels({ owner, repo, issue_number: pull_number, labels });
  } catch (error) {
    setFailed((error as Error).message);
  }
}

await run();
