/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PathOrFileDescriptor, WriteFileOptions } from "node:fs";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";

/**
 * "Safely" write to a file, creating any parent directories as required.
 * @param file - The filename or file descriptor to open
 * @param content - The content that will be written
 * @param options - Extra options to pass to `writeFileSync` (e.g. encoding)
 * @remarks
 * If `file` is a file descriptor, this method will simply return the result of
 * {@linkcode writeFileSync} verbatim.
 */
export function writeFileSafe(
  file: PathOrFileDescriptor,
  content: string | NodeJS.ArrayBufferView<ArrayBufferLike>,
  options: WriteFileOptions = {},
): void {
  if (typeof file === "number") {
    writeFileSync(file, content, options);
    return;
  }

  const parentDir = dirname(file.toString("utf-8"));
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  writeFileSync(file, content, options);
}

/**
 * Confirm overwriting an already-existing file.
 * @param outFile - The file name to override
 * @returns A Promise that resolves with whether to overwrite the file.
 */
export async function promptOverwrite(outFile: string): Promise<boolean> {
  return await confirm({
    message: chalk.hex("#ffa500")(`File ${chalk.blue(outFile)} already exists!\nDo you want to replace it?`),
    default: false,
  });
}
