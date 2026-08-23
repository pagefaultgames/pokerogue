/*
 * SPDX-FileCopyrightText: 2025 Despair Games
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: flx-sta <https://github.com/flx-sta>
 * SPDX-FileContributor: NightKev <https://github.com/DayKev>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { clearLine, moveCursor } from "node:readline";
import chalk from "chalk";
import type { Logger, Plugin as VitePlugin } from "vite";

const NAME = "minify-public-json-files";
const VERSION = "3.1.0";

/** Patterns that should be excluded, meant to be excluded at any level */
const EXCLUDE_PATTERNS = ["REUSE.toml", ".git", "LICENSE", "README.md", "package.json", "pnpm-lock.yaml"];

function skipExcludes(file: string): boolean {
  for (const exclude of EXCLUDE_PATTERNS) {
    if (file.includes(exclude)) {
      return true;
    }
  }
  return false;
}

/** Vite plugin to minify JSON files. Non-JSON files are copied as-is. */
export function minifyPublicJsonFiles(): VitePlugin {
  let logger: Logger;
  let count = 0;
  const errors: Error[] = [];
  const { cyan, gray, red, yellow, green } = chalk;

  return {
    name: NAME,
    version: VERSION,
    apply: "build",
    enforce: "post", // run after other plugins/stuff
    configResolved(resolvedConfig): void {
      logger = resolvedConfig.logger;
    },
    buildStart(): void {
      logger.info(cyan(`\t→ Plugin: ${NAME} v${VERSION}`));
    },
    async generateBundle(options): Promise<void> {
      const clearTerminalLine = (): void => {
        if (!process.env.CI) {
          moveCursor(process.stdout, 0, -1);
          clearLine(process.stdout, 0);
        }
      };

      const minifyFile = (fullPath: string, outputFilePath: string): void => {
        try {
          const content = readFileSync(fullPath, "utf-8");
          const minifiedContent = JSON.stringify(JSON.parse(content));
          writeFileSync(outputFilePath, minifiedContent, "utf-8");
          count++;
        } catch (err) {
          copyFileSync(fullPath, outputFilePath);
          const error = new Error(`Failed to minify JSON file: ${fullPath}\n\t→ ${err.message}`);
          error.stack = err.stack;
          errors.push(error);
        }
      };

      const minifyJsonFiles = (dir: string, outDir: string): void => {
        const files = readdirSync(dir);

        for (const file of files) {
          const fullPath = join(dir, file);
          const outputFilePath = join(outDir, file);
          const stat = statSync(fullPath);

          if (skipExcludes(file)) {
            clearTerminalLine();
            logger.info(yellow(`Skipping "${fullPath}".`));
            continue;
          }

          if (stat.isDirectory()) {
            clearTerminalLine();
            logger.info(green(`Processing directory "${fullPath}".`));

            // Recurse into subdirectories
            const nestedOutputDir = join(outDir, file);
            mkdirSync(nestedOutputDir, { recursive: true });
            minifyJsonFiles(fullPath, nestedOutputDir);
            continue;
          }

          if (file.endsWith(".json")) {
            minifyFile(fullPath, outputFilePath);
            continue;
          }

          // Copy other files as-is
          copyFileSync(fullPath, outputFilePath);
        }
      };

      logger.info(cyan("\nBeginning JSON minification."));
      if (!process.env.CI) {
        logger.info("");
      }

      const assetsDir = resolve("./assets");
      const localesDir = resolve("./locales");
      const outputDir = resolve(options.dir || "dist");

      minifyJsonFiles(assetsDir, outputDir);
      minifyJsonFiles(localesDir, join(outputDir, "locales"));

      logger.info(cyan("JSON minification complete."));
    },
    closeBundle(): void {
      const logSuffix = gray(` [${NAME}]`);

      if (count > 0) {
        const failedMsg = errors.length > 0 ? yellow(` (${errors.length} failed)`) : "";

        logger.info(`${green(`✓ Minified ${count} JSON files successfully`)}${failedMsg}${logSuffix}`);
      }

      if (errors.length > 0) {
        errors.map(error => logger.error(`${red(error.message)}${logSuffix}`, { error }));
      }
    },
  };
}
