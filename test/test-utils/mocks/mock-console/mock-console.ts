import { DEBUG_COLOR, NEW_TURN_COLOR, TRACE_COLOR, UI_MSG_COLOR } from "#app/constants/colors";
import { inferColorFormat } from "#test/test-utils/mocks/mock-console/infer-color";
import { coerceArray } from "#utils/common";
import { Console } from "node:console";
import { stderr, stdout } from "node:process";
import util from "node:util";
import chalk, { type ChalkInstance } from "chalk";

// Tell chalk we support truecolor
chalk.level = 3;

// TODO: Review this
const blacklist = [
  "variant icon does not exist", // Repetitive warnings about icons not found
  'Texture "%s" not found', // Repetitive warnings about textures not found
  "type: 'Pokemon',", // Large Pokemon objects
  "gameVersion: ", // Large session-data and system-data objects
  "Phaser v", // Phaser version text
  "Seed:", // Stuff about wave seed (we should really stop logging this shit)
  "Wave Seed:", // Stuff about wave seed (we should really stop logging this shit)
];
const whitelist = ["Start Phase"];

/**
 * The {@linkcode MockConsole} is a wrapper around the global {@linkcode console} object.
 * It automatically colors text and such.
 */
export class MockConsole extends Console {
  /**
   * A list of warnings that are queued to be displayed after all tests in the same file are finished.
   */
  private static queuedWarnings: unknown[][] = [];

  /**
   * Queue a warning to be printed after all tests in the same file are finished.
   */
  // TODO: Add some warnings
  public static queuePostTestWarning(...data: unknown[]): void {
    MockConsole.queuedWarnings.push(data);
  }

  constructor() {
    super(stdout, stderr, false);
  }

  /**
   * Print all post-test warnings that have been queued, and then clears the queue.
   */
  public static printPostTestWarnings() {
    for (const data of MockConsole.queuedWarnings) {
      console.warn(...data);
    }
    MockConsole.queuedWarnings = [];
  }

  /**
   * Check whether a given set of data is in the blacklist to be barred from logging.
   * @param data - The data being logged
   * @returns Whether `data` is blacklisted from console logging
   */
  private checkBlacklist(data: unknown[]): boolean {
    const dataStr = this.getStr(data);
    return !whitelist.some(b => dataStr.includes(b)) && blacklist.some(b => dataStr.includes(b));
  }

  public trace(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    // TODO: Figure out how to add color to the full trace text
    super.trace(...this.format(chalk.hex(TRACE_COLOR), data));
  }

  public debug(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    super.debug(...this.format(chalk.hex(DEBUG_COLOR), data));
  }

  public log(...data: unknown[]): void {
    if (this.checkBlacklist(data)) {
      return;
    }

    let formatter: ChalkInstance | undefined;

    if (data.some(d => typeof d === "string" && d.includes("color:"))) {
      // Infer the color format from the arguments, then remove everything but the message.
      formatter = inferColorFormat(data as [string, ...unknown[]]);
      data.splice(1);
    } else if (data[0] === "[UI]") {
      // Cyan for UI debug messages
      formatter = chalk.hex(UI_MSG_COLOR);
    } else if (typeof data[0] === "string" && data[0].startsWith("=====")) {
      // Orange logging for "New Turn"/etc messages
      formatter = chalk.hex(NEW_TURN_COLOR);
    }

    super.log(...this.format(formatter, data));
  }

  public warn(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    super.warn(...this.format(chalk.yellow, data));
  }

  public error(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    super.error(...this.format(chalk.redBright, data));
  }

  /**
   * Returns a human-readable string representation of `data`.
   */
  private getStr(data: unknown) {
    return util.inspect(data, { sorted: true, breakLength: 120 });
  }

  /**
   * Stringify the given data in a manner fit for logging.
   * @param color - A Chalk instance or other transformation function used to transform the output,
   * or `undefined` to not transform it at all.
   * @param data - The data that the format should be applied to.
   * @returns A stringified copy of `data` with {@linkcode color} applied to each individual argument.
   * @todo Do we need to apply color to each entry or just run it through `util.format`?
   */
  private format(color: ((s: unknown) => unknown) | undefined, data: unknown | unknown[]): unknown[] {
    data = coerceArray(data);
    color ??= a => a;
    return (data as unknown[]).map(a => color(typeof a === "function" || typeof a === "object" ? this.getStr(a) : a));
  }
}
