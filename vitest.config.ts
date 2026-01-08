/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UserConfig } from "vite";
import { defineConfig } from "vitest/config";
import { BaseSequencer, type TestSpecification } from "vitest/node";
import { sharedConfig } from "./vite.config";

// biome-ignore lint/style/noDefaultExport: required for vitest
export default defineConfig(async config => {
  const viteConfig = await sharedConfig(config);
  const opts: UserConfig = {
    ...viteConfig,
    test: {
      passWithNoTests: false,
      reporters: process.env.MERGE_REPORTS
        ? ["github-actions", "./test/test-utils/reporters/custom-default-reporter.ts"]
        : process.env.GITHUB_ACTIONS
          ? ["blob", "./test/test-utils/reporters/custom-default-reporter.ts"]
          : ["./test/test-utils/reporters/custom-default-reporter.ts"],
      env: {
        TZ: "UTC",
      },
      isolate: false,
      testTimeout: 20_000,
      slowTestThreshold: 10_000,
      // TODO: Vitest's current framework produces spurious errors for type tests with this option enabled.
      // We should move our type tests to a separate folder not covered by normal tests, and then enable the option.
      // expect: {
      //   requireAssertions: true,
      // },
      setupFiles: ["./test/setup/font-face.setup.ts", "./test/setup/vitest.setup.ts", "./test/setup/matchers.setup.ts"],
      sequence: {
        sequencer: MySequencer,
      },
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
      restoreMocks: true,
      watch: false,
      coverage: {
        provider: "v8",
        reportsDirectory: "coverage",
        reporter: process.env.MERGE_REPORTS ? ["text-summary", "json-summary"] : [],
        exclude: ["public", "assets", "locales"],
      },
      name: "main",
      include: ["./test/**/*.{test,spec}.ts"],
    },
  };
  return opts;
});

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
