/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * @import {PathOrFileDescriptor, WriteFileOptions} from "node:fs"
 */

/**
 * "Safely" write to a file, creating any parent directories as required.
 * @param {PathOrFileDescriptor} file - The filename or file descriptor to open
 * @param {string | NodeJS.ArrayBufferView<ArrayBufferLike>} content - The content which will be written
 * @param {WriteFileOptions} [options]
 * @returns {void}
 * @remarks
 * If `file` is a file descriptor, this method will simply return the result of
 * {@linkcode writeFileSync} verbatim.
 */
export function writeFileSafe(file, content, options) {
  if (typeof file === "number") {
    return writeFileSync(file, content, options);
  }

  const parentDir = dirname(file.toString("utf-8"));
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  writeFileSync(file, content, options);
}
