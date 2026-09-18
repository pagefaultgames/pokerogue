/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defaultCommanderHelpArgs } from "#script-utils/arguments";
import { join } from "path";
import { Command } from "@commander-js/extra-typings";

export const SCRIPT_VERSION = "1.0.0";

const programm = new Command("pnpm species-data:export")
  .description("Exports species related data from the src so it can be used for other purposes, such as the wiki.")
  .helpOption("-h, --help", "Show this help message.")
  .version(SCRIPT_VERSION, "-v, --version", "Show the version number.")
  .option("--no-clean", "Disable cleaning the output directory before writing new data")
  .option("--json", "Whether to output the data as JSON instead of CSV", false)
  .option("--debug", "Whether to log additional debug information during scraping", false)
  .configureHelp(defaultCommanderHelpArgs)
  .showHelpAfterError(true)
  .parse();

export const cliArgs = programm.opts();

export const PROJECT_ROOT = join(import.meta.dirname, "..", "..");
export const OUTPUT_DIR = join(PROJECT_ROOT, "species-output");
