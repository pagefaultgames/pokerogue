/*
 * SPDX-FileCopyrightText: 2025 Despair Games
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: flx-sta <https://github.com/flx-sta>
 * SPDX-FileContributor: NightKev <https://github.com/DayKev>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { Logger, Plugin as VitePlugin } from "vite";

const NAME = "minify-public-json-files";
const VERSION = "3.0.0";

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
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: good enough
      const minifyJsonFiles = (dir: string, outDir: string): void => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const outputFilePath = path.join(outDir, file);
          const stat = fs.statSync(fullPath);

          if (skipExcludes(file)) {
            logger.info(yellow(`Skipping "${fullPath}".`));
            continue;
          }

          if (stat.isDirectory()) {
            logger.info(green(`Processing directory "${fullPath}".`));
            // Recurse into subdirectories
            const nestedOutputDir = path.join(outDir, file);
            fs.mkdirSync(nestedOutputDir, { recursive: true });
            minifyJsonFiles(fullPath, nestedOutputDir);
            continue;
          }
          if (file.endsWith(".json")) {
            try {
              // Minify JSON file
              const content = fs.readFileSync(fullPath, "utf-8");
              const minifiedContent = JSON.stringify(JSON.parse(content));
              fs.writeFileSync(outputFilePath, minifiedContent, "utf-8");
              count++;
            } catch (err) {
              fs.copyFileSync(fullPath, outputFilePath);
              const error = new Error(`Failed to minify JSON file: ${fullPath}\n\t→ ${err.message}`);
              error.stack = err.stack;
              errors.push(error);
            }
            continue;
          }
          // Copy other files as-is
          fs.copyFileSync(fullPath, outputFilePath);
        }
      };

      logger.info(cyan("\nBeginning JSON minification."));

      const assetsDir = path.resolve("./assets");
      const localesDir = path.resolve("./locales");
      const outputDir = path.resolve(options.dir || "dist");

      minifyJsonFiles(assetsDir, outputDir);
      minifyJsonFiles(localesDir, path.join(outputDir, "locales"));

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
