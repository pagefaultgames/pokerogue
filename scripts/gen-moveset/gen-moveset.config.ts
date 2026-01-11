/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UserConfig } from "vite";
import { defineConfig } from "vitest/config";
import { sharedConfig } from "../../vite.config";

// biome-ignore lint/style/noDefaultExport: required for vitest
export default defineConfig(async config => {
  const viteConfig = await sharedConfig(config);
  const opts: UserConfig = {
    ...viteConfig,
    test: {
      passWithNoTests: false,
      env: {
        TZ: "UTC",
      },
      reporters: ["./test/test-utils/reporters/custom-default-reporter.ts"],
      setupFiles: ["./test/setup/font-face.setup.ts", "./test/setup/vitest.setup.ts"],
      includeTaskLocation: true,
      environment: "jsdom",
      environmentOptions: {
        jsdom: {
          resources: "usable",
        },
      },
      restoreMocks: true,
      watch: false,
      name: "gen-moveset",
      include: ["./scripts/gen-moveset/gen-moveset.ts"],
    },
  };
  return opts;
});

//#region Helpers
