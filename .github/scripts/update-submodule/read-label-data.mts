/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import fs from "node:fs";
import path from "node:path";
import { getInput, setFailed, setOutput } from "@actions/core";

function run(): void {
  const temp = `${getInput("runner_temp", { required: true })}/artifacts`;

  const prNumber = Number(fs.readFileSync(path.join(temp, "NR")));
  const label = fs.readFileSync(path.join(temp, "LABEL")).toString().trim();
  const ref = fs.readFileSync(path.join(temp, "REF")).toString().trim();
  const repo = fs.readFileSync(path.join(temp, "REPO")).toString().trim();

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
