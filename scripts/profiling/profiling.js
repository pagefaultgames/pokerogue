/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This script wraps Vitest's test runner with node's built-in V8 profiler.
 * Any extra CLI arguments are passed directly to `vitest run`.
 */

import { copyFile, glob, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { startVitest } from "vitest/node";
import { defaultCommanderHelpArgs } from "../helpers/arguments.js";

const version = "1.0.0";

console.log(chalk.hex("#ffa500")(`📈 Test Profiler - v${version}\n`));

const testProfile = new Command("pnpm test:profile")
  .description("Run Vitest with Node's V8 profiler and generate processed profiling output.")
  .helpOption("-h, --help", "Show this help message.")
  .version(version, "-v, --version", "Show the version number.")
  .option("-o, --output <path>", "Directory to which V8 profiler output will be written.", "./temp/vitest-profile")
  .option("-c, --cpu", "Enable CPU profiling.", true)
  .option("--no-cpu", "Disable CPU profiling.")
  .option("-m, --memory", "Enable memory profiling.", true)
  .option("--no-memory", "Disable memory profiling.")
  .option("--clean", "Whether to clean the output directory before writing new profiles.")
  .argument("<vitest-args...>", "Arguments to pass directly to Vitest.")
  .configureHelp(defaultCommanderHelpArgs)
  // only show help on argument parsing errors, not on test failures
  .showHelpAfterError(true)
  .parse();

const { output, cpu, memory, clean } = testProfile.opts();
/** The directory to write profiling outputs to. (May or may not be the final destination.) */
let outputDir = output;

if (!cpu && !memory) {
  testProfile.error("Cannot disable both CPU and memory profiling!");
}

testProfile.showHelpAfterError(false);

/**
 * @returns {Promise<void>}
 */
async function main() {
  if (clean) {
    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });
  } else {
    // output profile files to a temp directory before moving them to the desired location, ensuring both exist
    outputDir = await mkdtemp(join(tmpdir(), "vitest-profile-"), { encoding: "utf-8" });
  }

  console.log(chalk.grey("Running Vitest with V8 profiler..."));

  /** @type {string[]} */
  const execArgv = [];
  if (cpu) {
    execArgv.push("--cpu-prof", `--cpu-prof-dir=${outputDir}`);
  }
  if (memory) {
    execArgv.push("--heap-prof", `--heap-prof-dir=${outputDir}`);
  }

  const vitest = await startVitest("test", [...testProfile.args, "no-file-parallelism"], {
    execArgv,
  });
  // NB: This sets `process.exitCode` to a non-zero value if it fails
  await vitest.close();
  if (process.exitCode) {
    return;
  }

  const [cpuProfile, memoryProfile] = await Promise.all([
    (await glob(join(outputDir, "*.cpuprofile")).next()).value,
    (await glob(join(outputDir, "*.heapprofile")).next()).value,
  ]);
  if (!cpuProfile && !memoryProfile) {
    console.error(chalk.red.bold("No CPU or memory profile found!"));
    process.exitCode = 1;
    return;
  }

  if (!clean) {
    await Promise.all([
      copyFile(cpuProfile, join(output, basename(cpuProfile))),
      copyFile(memoryProfile, join(output, basename(cpuProfile))),
    ]);
  }

  if (cpuProfile) {
    console.log("Wrote processed CPU profile to:", chalk.bold.blue(cpuProfile));
  }
  if (memoryProfile) {
    console.log("Wrote processed memory profile to:", chalk.bold.blue(memoryProfile));
  }

  console.log(chalk.green.bold("Profiling complete!"));
}

await main();
