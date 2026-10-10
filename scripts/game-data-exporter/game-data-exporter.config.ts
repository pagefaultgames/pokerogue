/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineConfig } from "vitest/config";
import { sharedConfig } from "../../vite.config.ts";

const separatorIndex = process.argv.indexOf("--");
if (separatorIndex >= 0) {
  process.env.GAME_DATA_EXPORT_ARGS = JSON.stringify(process.argv.slice(separatorIndex + 1));
}

// biome-ignore lint/style/noDefaultExport: required for vitest
export default defineConfig(async config => ({
  ...(await sharedConfig(config)),
  test: {
    environment: "jsdom",
    setupFiles: ["./scripts/game-data-exporter/game-data-exporter.setup.ts"],
    include: ["./scripts/game-data-exporter/run.test.ts"],
    disableConsoleIntercept: true,
  },
}));
