import { defineWorkspace } from "vitest/config";
import { defaultConfig } from "./vite.config";
import { defaultProjectTestConfig } from "./vitest.config";

export default defineWorkspace([
  {
    ...defaultConfig,
    test: {
      name: "pre",
      include: ["src/test/pre.test.ts"],
      environment: "jsdom",
    },
  },
  {
    ...defaultConfig,
    test: {
      ...defaultProjectTestConfig,
      name: "misc",
      include: [
        "src/test/achievements/**/*.{test,spec}.ts",
        "src/test/arena/**/*.{test,spec}.ts",
        "src/test/battlerTags/**/*.{test,spec}.ts",
        "src/test/eggs/**/*.{test,spec}.ts",
        "src/test/field/**/*.{test,spec}.ts",
        "src/test/inputs/**/*.{test,spec}.ts",
        "src/test/localization/**/*.{test,spec}.ts",
        "src/test/phases/**/*.{test,spec}.ts",
        "src/test/settingMenu/**/*.{test,spec}.ts",
        "src/test/sprites/**/*.{test,spec}.ts",
        "src/test/ui/**/*.{test,spec}.ts",
        "src/test/*.{test,spec}.ts",
      ],
    },
  },
  {
    ...defaultConfig,
    test: {
      ...defaultProjectTestConfig,
      name: "abilities",
      include: ["src/test/abilities/**/*.{test,spec}.ts"],
    },
  },
  {
    ...defaultConfig,
    test: {
      ...defaultProjectTestConfig,
      name: "battle",
      include: ["src/test/battle/**/*.{test,spec}.ts"],
    },
  },
  {
    ...defaultConfig,
    test: {
      ...defaultProjectTestConfig,
      name: "items",
      include: ["src/test/items/**/*.{test,spec}.ts"],
    },
  },
  {
    ...defaultConfig,
    test: {
      ...defaultProjectTestConfig,
      name: "moves",
      include: ["src/test/moves/**/*.{test,spec}.ts"],
    },
  },
  "./vitest.config.ts",
]);
