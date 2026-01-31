/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * This script copies files from the `assets` directory into the `dist` directory
 * and places them into the `dist` directory, while allowing for certain files
 * and directories to be excluded from the copy process.
 *
 * It uses `rsync` on Unix-like systems and `robocopy` on Windows to perform the
 * copy operation with exclusions.
 *
 * This ensures that only the necessary files are included in the final build,
 * while unwanted files (like `.git` directories, license files, etc.) are omitted.
 *
 * Otherwise, these files can be inadvertently included in the build output,
 * allowing them to be distributed.
 * @module
 */

import { execSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** The path to the root directory */
const rootDir = join(__dirname, "..");
const relativeRoot = relative(process.cwd(), rootDir);

const assetsSrc = join(relativeRoot, "assets");
/** The build directory */
const outDir = join(relativeRoot, "dist");
const localesSrc = join(relativeRoot, "locales");
const localesDest = join(outDir, "locales");

// Exclude patterns.
// These always match all files in each directory.
// e.g. all `REUSE.toml` files in any subdirectory will be excluded.

/** Directories that should be excluded, meant to be excluded at any level */
const excludeDirs = [".git", "LICENSES", ".github"];
/** Files that should be excluded, meant to be excluded at any level */
const excludeFiles = ["REUSE.toml", ".git*", "LICENSE", "README.md", "package.json", "pnpm-lock.yaml"];

/**
 * Copy the files from `src` to `dest` using
 * {@link https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy | robocopy},
 * respecting the exclude patterns.
 *
 * @param {string} src - The source repository
 * @param {string} dest - The destination
 */
function robocopy(src, dest) {
  // Build robocopy command
  const xd = excludeDirs.length > 0 ? `/XD ${excludeDirs.join(" ")}` : "";
  const xf = excludeFiles.length > 0 ? `/XF ${excludeFiles.join(" ")}` : "";
  const cmd = `robocopy ${src} ${dest} /NFL /NDL /E ${xd} ${xf}`;
  console.info(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (/** @type any */ err) {
    /** @type {Error & import('child_process').SpawnSyncReturns<string> } */
    const error = err;
    // For robocopy, only 8 or higher is an actual error
    if ((error.status ?? 0) >= 8) {
      console.error(error.message ?? err);
      process.exit(error.status);
    }
  }
}

/**
 * Copy the files from `src` to `dest` using
 * {@link https://manpage.me/?rsync | rsync}, respecting the exclude patterns.
 *
 * @param {string} src - The source repository
 * @param {string} dest - The destination
 */
function rsync(src, dest) {
  // check if the rsync command is available
  try {
    execSync("rsync --version", { stdio: "ignore" });
  } catch {
    console.error("rsync command not found. Please install rsync and try again.");
    process.exit(1);
  }
  // Build rsync command
  const excludes = [
    ...excludeDirs.map(d => `--exclude='**/${d}/'`),
    ...excludeFiles.map(f => `--exclude='**/${f}'`),
  ].join(" ");
  const cmd = `rsync -a ${excludes} ${src}/ ${dest}`;
  console.info(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (/** @type any */ err) {
    /** @type {Error & import('child_process').SpawnSyncReturns<string> } */
    const error = err;
    console.error(error.message ?? err);
    process.exit(error.status ?? 1);
  }
}

if (process.platform === "win32") {
  robocopy(assetsSrc, outDir);
  robocopy(localesSrc, localesDest);
} else {
  rsync(assetsSrc, outDir);
  rsync(localesSrc, localesDest);
}
