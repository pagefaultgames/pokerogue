/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineConfig } from "vitest/config";
import { BaseSequencer, type TestSpecification } from "vitest/node";
import { defaultConfig } from "./vite.config";

// biome-ignore lint/style/noDefaultExport: required for vitest
export default defineConfig(async config => ({
  ...(await defaultConfig(config)),
  test: {
    passWithNoTests: false,
    reporters: process.env.GITHUB_ACTIONS
      ? ["github-actions", "./test/test-utils/reporters/custom-default-reporter.ts"]
      : ["./test/test-utils/reporters/custom-default-reporter.ts"],
    env: {
      TZ: "UTC",
    },
    testTimeout: 20_000,
    slowTestThreshold: 10_000,
    expect: {
      requireAssertions: true,
    },
    setupFiles: ["./test/setup/font-face.setup.ts", "./test/setup/vitest.setup.ts", "./test/setup/matchers.setup.ts"],
    sequence: {
      sequencer: MySequencer,
    },
    hideSkippedTests: true,
    includeTaskLocation: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        resources: "usable",
      },
    },
    typecheck: {
      tsconfig: "tsconfig.json",
      include: ["./test/types/**/*.{test,spec}{-|.}d.ts"],
    },
    threads: false,
    trace: true,
    restoreMocks: true,
    watch: false,
    coverage: {
      provider: "istanbul",
      reportsDirectory: "coverage",
      reporters: ["text-summary", "html"],
    },
    name: "PokéRogue",
    include: ["./test/**/*.{test,spec}.ts"],
  } satisfies UserConfig,
}));

//#region Helpers

/**
 * Class for sorting test files in the desired order.
 */
class MySequencer extends BaseSequencer {
  public override async sort(files: TestSpecification[]) {
    files = await super.sort(files);

    return files.sort((a, b) => {
      const aTestOrder = getTestOrder(a.moduleId);
      const bTestOrder = getTestOrder(b.moduleId);
      return aTestOrder - bTestOrder;
    });
  }
}

/**
 * A helper function for sorting test files in a desired order.
 *
 * A lower number means that a test file must be run earlier,
 * or else it breaks due to running tests with `--no-isolate.`
 */
function getTestOrder(testName: string): number {
  if (testName.includes("battle-scene.test.ts")) {
    return 1;
  }
  if (testName.includes("inputs.test.ts")) {
    return 2;
  }
  return 3;
}

//#endregion
