/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

async function run(): Promise<void> {
  try {
    const authToken = getInput("github_token", { required: true });

    const octokit = getOctokit(authToken);
    const owner = context.repo.owner;
    const repo = context.repo.repo;
    const run_id = context.payload.workflow_run.id;

    const allArtifacts = await octokit.rest.actions.listWorkflowRunArtifacts({ owner, repo, run_id });
    const artifact = allArtifacts.data.artifacts.find(art => art.name === "pr-data");
    if (!artifact) {
      setFailed("Label data missing!");
      return;
    }
    const download = await octokit.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: artifact.id,
      archive_format: "zip",
    });

    const temp = `${getInput("runner_temp", { required: true })}/artifacts`;

    if (!existsSync(temp)) {
      mkdirSync(temp);
    }
    writeFileSync(join(temp, "pr-data.zip"), Buffer.from(download.data as string));
  } catch (error) {
    setFailed((error as Error).message);
  }
}

await run();
