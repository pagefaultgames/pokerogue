/*
 * SPDX-FileCopyrightText: 2025-2026 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawnSync } from "node:child_process";

/**
 * Check if a given command exists in the system's `PATH`.
 * Equivalent to the `which`/`where` commands on Unix/Windows.
 * @param command - The command to check
 * @returns Whether the command exists.
 */
export function commandExists(command: string): boolean {
  const cmd = process.platform === "win32" ? "where" : "which";
  return spawnSync(cmd, [command], { stdio: "ignore" }).status === 0;
}
