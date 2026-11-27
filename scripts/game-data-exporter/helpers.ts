/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { writeFileSafe } from "#script-utils/file";
import { join } from "path";
import { cliArgs, OUTPUT_DIR } from "./constants";

export function normalizeSpriteKey(spriteKey: string): string {
  return spriteKey.replace(/^pkmn__/, "");
}

export function writeData<T extends object>(fileName: string, data: T[]): void {
  const fileExtension = cliArgs.json ? "json" : "csv";
  const path = join(OUTPUT_DIR, `${fileName}.${fileExtension}`);

  if (cliArgs.json) {
    writeFileSafe(path, JSON.stringify(data, null, 2));
    return;
  }

  const csvLines = [Object.keys(data[0]).join(",")]; // header line
  for (const entry of data) {
    csvLines.push(
      Object.values(entry)
        .map(value => (value === null ? "" : value))
        .join(","),
    );
  }
  writeFileSafe(path, csvLines.join("\n"));
}
