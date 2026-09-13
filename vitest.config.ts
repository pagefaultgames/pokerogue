/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// NB: We cannot use `#XYZ` imports in this file since `vite-tsconfig-paths` has not been initialized yet.

import type { UserConfig } from "vite";
import { defineConfig } from "vitest/config";
import { BaseSequencer, type TestSpecification } from "vitest/node";
import { TEST_TIMEOUT } from "./test/constants.ts";
import { CustomDefaultReporter } from "./test/reporters/custom-default-reporter.ts";
import { sharedConfig } from "./vite.config.ts";

// biome-ignore lint/style/noDefaultExport: required for vitest
export default defineConfig(async config => {
  const viteConfig = await sharedConfig(config);
  const opts = {
    ...viteConfig,
    test: {
      passWithNoTests: false,
      reporters: [] as (string | CustomDefaultReporter)[],
      env: { TZ: "UTC" },
      isolate: false,
      testTimeout: TEST_TIMEOUT,
      slowTestThreshold: TEST_TIMEOUT / 2,
      // TODO: Vitest's current framework produces spurious errors for type tests with this option enabled.
      // We should move our type tests to a separate folder not covered by normal tests, and then enable the option.
      // expect: {
      //   requireAssertions: true,
      // },
      setupFiles: ["./test/setup/font-face.setup.ts", "./test/setup/vitest.setup.ts", "./test/setup/matchers.setup.ts"],
      sequence: { sequencer: MySequencer },
      includeTaskLocation: true,
      environment: "jsdom",
      environmentOptions: { jsdom: { resources: "usable" } },
      typecheck: {
        tsconfig: "tsconfig.json",
        include: ["./test/tests/types/**/*.{test,spec}-d.ts"],
      },
      restoreMocks: true,
      watch: false,
      coverage: {
        provider: "v8",
        reportsDirectory: "coverage",
        reporter: [] as string[],
        exclude: ["{src,test}/**/*.d.ts"],
        include: ["src/**/*.ts", "test/utils/**/*.ts"],
      },
      name: "main",
      include: ["./test/**/*.{test,spec}.ts"],
    },
  } satisfies UserConfig;

  if (process.env.MERGE_REPORTS) {
    opts.test.reporters.push("github-actions");
    opts.test.coverage.reporter = ["text-summary", "json-summary"];
  } else if (process.env.GITHUB_ACTIONS) {
    opts.test.reporters.push("blob");
  } else {
    opts.test.coverage.reporter = ["text-summary", "html"];
  }
  opts.test.reporters.push(new CustomDefaultReporter());

  return opts;
});

// #region Helpers

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

// #endregion Helpers
