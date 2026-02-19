/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This script wraps Vitest's test runner with node's built-in V8 profiler and a flamegraph visualizer powered by `speedscope.app`.
 * Any extra CLI arguments are passed directly to `vitest run`.
 */

import { spawnSync } from "node:child_process";
import { closeSync, globSync, openSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { defaultCommanderHelpArgs } from "../helpers/arguments.js";

const version = "1.0.0";

const testProfile = new Command("pnpm test:profile")
  .description("Run Vitest with Node's V8 profiler and generate processed profiling output.")
  .helpOption("-h, --help", "Show this help message.")
  .version(version, "-v, --version", "Show the version number.")
  .option(
    "-o, --output <path>",
    "Directory to which V8 profiler output will be written.",
    "./temp/vitest-profile",
    // join(tmpdir(), "vitest-profile"),
  )
  .option("--cleanup", "Whether to automatically delete generated files after processing.", false)
  .argument("<vitest-args...>", "Arguments to pass directly to Vitest.")
  .configureHelp(defaultCommanderHelpArgs)
  .parse();

const opts = testProfile.opts();

/**
 * @returns {Promise<void>}
 */
async function main() {
  console.log(chalk.hex("#ffa500")(`📈 Test Profiler - v${version}\n`));

  const { output, cleanup } = opts;
  const logFile = join(output, "v8.log");

  try {
    await rm(output, { recursive: true, force: true });
    await mkdir(output, { recursive: true });

    console.log(chalk.grey("Running Vitest with V8 profiler..."));

    const vitestProcess = spawnSync(
      "node",
      [
        "--prof",
        `--logfile=${logFile}`,
        "node_modules/vitest/vitest.mjs",
        "run",
        "--silent='passed-only'",
        ...testProfile.args,
      ],
      { stdio: "inherit", encoding: "utf-8" },
    );
    if (vitestProcess.status) {
      process.exitCode = vitestProcess.status;
      return;
    }

    const logFiles = globSync(join(output, "*.log"));
    if (logFiles.length === 0) {
      throw new Error("No V8 profiler log files were generated!");
    }

    const processedOutFile = join(output, "processed.json");

    const fd = openSync(processedOutFile, "w");
    const postProcess = spawnSync("node", ["--prof-process", "--preprocess", ...logFiles], {
      stdio: ["pipe", fd, "pipe"],
    });
    closeSync(fd);
    if (postProcess.status) {
      process.exitCode = postProcess.status;
      return;
    }
    console.log("Wrote processed output to: ", chalk.bold.blue(processedOutFile));

    console.log(chalk.grey("Opening Speedscope..."));
    // NOTE: This will not work on WSL.
    // This is speedscope's fault.
    const speedscopeProcess = spawnSync("pnpm", ["exec", "speedscope", processedOutFile], {
      stdio: "inherit",
    });
    process.exitCode = speedscopeProcess.status;
  } finally {
    if (cleanup) {
      console.log(chalk.grey("Removing generated files..."));
      await rm(output, { recursive: true, force: true });
    }
  }
}

await main();
