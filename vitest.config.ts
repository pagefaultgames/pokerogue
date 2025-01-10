import { defineProject } from "vitest/config";
import { defaultConfig } from "./vite.config";
import { BaseSequencer } from "vitest/node";

/**
 * A helper function for sorting test files in a desired order.
 *
 * A lower number means that a test file must be run earlier,
 * or else it breaks due to running tests with `--no-isolate.`
 */
function getTestOrder(testName: string): number {
  if (testName.includes("battle_scene.test.ts")) {
    return 1;
  } else if (testName.includes("inputs.test.ts")) {
    return 2;
  } else {
    return 3;
  }
}

export default defineProject(({ mode }) => ({
  ...defaultConfig,
  test: {
    testTimeout: 20000,
    setupFiles: ["./test/fontFace.setup.ts", "./test/vitest.setup.ts"],
    server: {
      deps: {
        inline: ["vitest-canvas-mock"],
        optimizer: {
          web: {
            include: ["vitest-canvas-mock"],
          },
        },
      },
    },
    sequence: {
      sequencer: class Seqencer extends BaseSequencer {
        async sort(files: [any, string][]) {
          files = await super.sort(files);

          // Sort files so that `inputs.test.ts` gets run first; otherwise, `inputs.test.ts` randomly breaks
          return files.sort((a, b) => {
            return getTestOrder(a[1]) - getTestOrder(b[1]);
            b;
          });
        }
      },
    },
    environment: "jsdom" as const,
    environmentOptions: {
      jsdom: {
        resources: "usable",
      },
    },
    threads: false,
    trace: true,
    restoreMocks: true,
    watch: false,
    coverage: {
      provider: "istanbul" as const,
      reportsDirectory: "coverage" as const,
      reporters: ["text-summary", "html"],
    },
    name: "main",
    include: ["./test/**/*.{test,spec}.ts"],
    exclude: ["./test/pre.test.ts"],
  },
  esbuild: {
    pure: mode === "production" ? ["console.log"] : [],
    keepNames: true,
  },
}));
