/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineConfig, loadEnv, type Rollup, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export const defaultConfig: UserConfig = {
  plugins: process.env.MERGE_REPORTS
    ? []
    : [
        tsconfigPaths(),
        require("./src/plugins/vite/vite-minify-json-plugin").minifyJsonPlugin(["images", "battle-anims"], true),
        require("./src/plugins/vite/namespaces-i18n-plugin").LocaleNamespace(),
      ],
  clearScreen: false,
  appType: "mpa",
  build: {
    chunkSizeWarningLimit: 10000,
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      onwarn(warning: Rollup.RollupLog, defaultHandler: (warning: string | Rollup.RollupLog) => void) {
        // Suppress "Module level directives cause errors when bundled" warnings
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
};

export default defineConfig(({ mode, command }) => {
  const envPort = Number(loadEnv(mode, process.cwd()).VITE_PORT);

  return {
    ...defaultConfig,
    base: "",
    publicDir: command === "serve" ? "assets" : false,
    esbuild: {
      pure: mode === "production" ? ["console.log"] : [],
      keepNames: true,
    },
    server: {
      port: Number.isNaN(envPort) ? 8000 : envPort,
    },
  };
});
