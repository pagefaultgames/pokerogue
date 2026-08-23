/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getInput, setFailed, setOutput } from "@actions/core";

function run(): void {
  const temp = `${getInput("runner_temp", { required: true })}/artifacts`;

  const prNumber = Number(readFileSync(join(temp, "NR")));
  const label = readFileSync(join(temp, "LABEL")).toString().trim();
  const ref = readFileSync(join(temp, "REF")).toString().trim();
  const repo = readFileSync(join(temp, "REPO")).toString().trim();

  setOutput("label", label);
  setOutput("prNumber", prNumber);
  setOutput("ref", ref);
  setOutput("repo", repo);
}

try {
  run();
} catch (error) {
  setFailed((error as Error).message);
}
