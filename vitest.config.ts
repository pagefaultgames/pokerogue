import { defineProject } from "vitest/config";
import { defaultConfig } from "./vite.config";
import { BaseSequencer, type TestSpecification } from "vitest/node";

function getTestOrder(testName: string): number {
  if (testName.includes("battle-scene.test.ts")) {
    return 1;
  }
  if (testName.includes("inputs.test.ts")) {
    return 2;
  }
  return 3;
}

export default defineProject(({ mode }) => ({
  ...defaultConfig,
  test: {
    testTimeout: 20000,
    setupFiles: ["./test/fontFace.setup.ts", "./test/vitest.setup.ts"],
    sequence: {
      sequencer: class CustomSequencer extends BaseSequencer {
        async sort(files: TestSpecification[]) {
          // use default sorting at first.
          files = await super.sort(files);
          // Except, forcibly reorder

          return files.sort((a, b) => getTestOrder(a.moduleId) - getTestOrder(b.moduleId));
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
  },
  esbuild: {
    pure: mode === "production" ? ["console.log"] : [],
    keepNames: true,
  },
}));
