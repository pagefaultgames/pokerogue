import { defineProject } from "vitest/config";
import { defaultConfig } from "./vite.config";

export default defineProject(({ mode }) => ({
  ...defaultConfig,
  test: {
    testTimeout: 20000,
    setupFiles: ["./test/fontFace.setup.ts", "./test/vitest.setup.ts"],
    server: {
      deps: {
        inline: ["vitest-canvas-mock"],
        //@ts-ignore
        optimizer: {
          web: {
            include: ["vitest-canvas-mock"],
          },
        },
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
