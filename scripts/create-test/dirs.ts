/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type TestType, testTypesToDirs } from "#create-test/constants";
import { join } from "node:path";

const projectRoot = join(import.meta.dirname, "..", "..");

/**
 * Const object matching all {@linkcode TestType}s to any custom boilerplate files they may be associated with.
 */
const customBoilerplates: Readonly<Partial<Record<TestType, string>>> = {
  // Reward: "boilerplates/reward.boilerplate.ts", // Todo: Boilerplate is added in the modifier rework
};

const DEFAULT_BOILERPLATE_PATH = "boilerplates/default.boilerplate.ts";

/**
 * Retrieve the path to the boilerplate file used for the given test type.
 * @param testType - The type of test file to create
 * @returns The path to the boilerplate file.
 */
export function getBoilerplatePath(testType: TestType): string {
  return join(import.meta.dirname, customBoilerplates[testType] ?? DEFAULT_BOILERPLATE_PATH);
}

/**
 * Get the path to a given folder in the test directory.
 * @param folders - The subfolders to append to the base path
 * @returns The path to the requested folder
 */
function getTestFolderPath(...folders: string[]): string {
  return join(projectRoot, "test/tests", ...folders);
}

/**
 * Helper function to convert the test file name into an absolute path.
 * @param testType - The type of test being created (used to look up folder)
 * @param fileName - The name of the test file (without suffix)
 */
export function getTestFileFullPath(testType: TestType, fileName: string): string {
  const absoluteDir = getTestFolderPath(testTypesToDirs[testType]);
  return join(absoluteDir, `${fileName}.test.ts`);
}
