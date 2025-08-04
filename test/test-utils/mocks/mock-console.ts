import { stderr, stdout } from "node:process";
import util from "node:util";
import chalk, { type ChalkInstance } from "chalk";

// TODO: Review this
const blacklist = [
  "variant icon does not exist", // Repetitive warnings about icons not found
  'Texture "%s" not found', // Repetitive warnings about textures not found
  "type: 'Pokemon',", // Large Pokemon objects
  "gameVersion: ", // Large session-data and system-data objects
];
const whitelist = ["Start Phase"];

/**
 * The {@linkcode MockConsole} is a wrapper around the global {@linkcode console} object.
 * It automatically colors text and such.
 */
export class MockConsole extends console.Console {
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
   * Check whether a given ste of data is in the blacklist to be barred from logging.
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
    super.trace(this.addColor(chalk.hex("#b700ff"), ...data));
  }

  public debug(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    super.debug(this.addColor(chalk.hex("#874600ff"), ...data));
  }

  public log(...data: unknown[]): void {
    if (this.checkBlacklist(data)) {
      return;
    }

    if (typeof data[0] === "string" && data[0].includes("%c")) {
      // Strip all CSS from console logs in place of green format
      // (such as for "Start Phase" messages)
      data[0] = data[0].replace("%c", "");
      super.log(this.addColor(chalk.green, data[0]));
    } else if (data[0] === "[UI]") {
      // Orange for UI debug messages
      super.log(this.addColor(chalk.hex("#ffa500"), ...data));
    } else {
      super.log(...data);
    }
  }

  public warn(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    super.warn(this.addColor(chalk.yellow, ...data));
  }

  public error(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    super.error(this.addColor(chalk.redBright, ...data));
  }

  /**
   * Returns a human-readable string representation of `data`.
   */
  private getStr(data: unknown) {
    return util.inspect(data, { sorted: true, breakLength: 120 });
  }

  /**
   * Prepends the given color to every argument in the given data.
   * Also appends the white ANSI code as an extra argument, so that the added color does not leak to future messages.
   * @param color - A Chalk instance used to color the output.
   * @param data - The data that the color should be applied to.
   * @returns A stringified copy of `data` with the color prepended to every argument.
   * @todo Do we need to prepend it?
   */
  private addColor(color: ChalkInstance, ...data: unknown[]): string[] {
    return data.map(a => `${color(typeof a === "string" ? a : this.getStr(a))}`);
  }
}
