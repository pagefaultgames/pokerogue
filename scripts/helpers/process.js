import { spawnSync } from "node:child_process";

/**
 * Check if a given command exists in the system's `PATH`.
 * Equivalent to the `which`/`where` commands on Unix/Windows.
 * @param {string} command - The command to check
 * @returns {boolean} Whether the command exists.
 */
export function commandExists(command) {
  const cmd = process.platform === "win32" ? "where" : "which";
  return spawnSync(cmd, [command], { stdio: "ignore" }).status === 0;
}
