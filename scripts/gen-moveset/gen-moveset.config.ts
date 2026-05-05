/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CustomDefaultReporter } from "#test/reporters/custom-default-reporter";
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
      reporters: [new CustomDefaultReporter()],
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
