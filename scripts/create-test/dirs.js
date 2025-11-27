/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { join } from "path";
import { testTypesToDirs } from "./constants.js";

/**
 * @import { testType } from "./constants.js";
 */

// Get the directory name of the current module file
const __dirname = import.meta.dirname;
const projectRoot = join(__dirname, "..", "..");

/**
 * Const object matching all {@linkcode testType}s to any custom boilerplate files
 * they may be associated with.
 * @type {Readonly<Partial<Record<testType, string>>>}
 */
const customBoilerplates = {
  // Reward: "boilerplates/reward.boilerplate.ts", // Todo: Boilerplate is added in the modifier rework
};

const DEFAULT_BOILERPLATE_PATH = "boilerplates/default.boilerplate.ts";

/**
 * Retrieve the path to the boilerplate file used for the given test type.
 * @param {testType} testType - The type of test file to create
 * @returns {string} The path to the boilerplate file.
 */
export function getBoilerplatePath(testType) {
  return join(import.meta.dirname, customBoilerplates[testType] ?? DEFAULT_BOILERPLATE_PATH);
}

/**
 * Get the path to a given folder in the test directory
 * @param {...string} folders the subfolders to append to the base path
 * @returns {string} the path to the requested folder
 */
function getTestFolderPath(...folders) {
  return join(projectRoot, "test", ...folders);
}

/**
 * Helper function to convert the test file name into an absolute path.
 * @param {testType} testType - The type of test being created (used to look up folder)
 * @param {string} fileName - The name of the test file (without suffix)
 * @returns {string}
 */
export function getTestFileFullPath(testType, fileName) {
  const absoluteDir = getTestFolderPath(testTypesToDirs[testType]);
  return join(absoluteDir, `${fileName}.test.ts`);
}
