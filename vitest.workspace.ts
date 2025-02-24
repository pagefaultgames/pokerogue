import { defineWorkspace } from "vitest/config";
import { defaultConfig } from "./vite.config";

export default defineWorkspace([
  {
    ...defaultConfig,
    test: {
      name: "pre",
      include: ["./test/pre.test.ts"],
      environment: "jsdom",
    },
  },
  "./vitest.config.ts",
]);
