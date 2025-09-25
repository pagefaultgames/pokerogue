import { DEBUG_COLOR, NEW_TURN_COLOR, TRACE_COLOR, UI_MSG_COLOR } from "#app/constants/colors";
import { inferColorFormat } from "#test/test-utils/mocks/mock-console/infer-color";
import { coerceArray } from "#utils/common";
import { type InspectOptions, inspect } from "node:util";
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
] as const;
const whitelist = ["Start Phase"] as const;

const inspectOptions: InspectOptions = { sorted: true, breakLength: 120, numericSeparator: true };

/**
 * The {@linkcode MockConsole} is a wrapper around the global {@linkcode console} object.
 * It automatically colors text and such.
 */
export class MockConsole implements Omit<Console, "Console"> {
  /**
   * A list of warnings that are queued to be displayed after all tests in the same file are finished.
   */
  private static readonly queuedWarnings: unknown[][] = [];
  /**
   * The original `Console` object, preserved to avoid overwriting
   * Vitest's native `console.log` wrapping.
   */
  private console = console;

  //#region Static Properties

  /**
   * Queue a warning to be printed after all tests in the same file are finished.
   */
  // TODO: Add some warnings
  public static queuePostTestWarning(...data: unknown[]): void {
    MockConsole.queuedWarnings.push(data);
  }

  /**
   * Print and reset all post-test warnings.
   */
  public static printPostTestWarnings(): void {
    for (const data of MockConsole.queuedWarnings) {
      console.warn(...data);
    }
    MockConsole.queuedWarnings.splice(0);
  }

  //#endregion Private Properties

  //#region Utilities

  /**
   * Check whether a given set of data is in the blacklist to be barred from logging.
   * @param data - The data being logged
   * @returns Whether `data` is blacklisted from console logging
   */
  private checkBlacklist(data: unknown[]): boolean {
    const dataStr = this.getStr(data);
    return !whitelist.some(b => dataStr.includes(b)) && blacklist.some(b => dataStr.includes(b));
  }

  /**
   * Returns a human-readable string representation of `data`.
   */
  private getStr(data: unknown): string {
    return inspect(data, inspectOptions);
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

  //#endregion Utilities

  //#region Custom wrappers
  public info(...data: unknown[]) {
    return this.log(...data);
  }

  public trace(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    // TODO: Figure out how to add color to the full trace text
    this.console.trace(...this.format(chalk.hex(TRACE_COLOR), data));
  }

  public debug(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    this.console.debug(...this.format(chalk.hex(DEBUG_COLOR), data));
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

    this.console.log(...this.format(formatter, data));
  }

  public warn(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    this.console.warn(...this.format(chalk.yellow, data));
  }

  public error(...data: unknown[]) {
    if (this.checkBlacklist(data)) {
      return;
    }

    this.console.error(...this.format(chalk.redBright, data));
  }

  //#endregion Custom Wrappers

  //#region Copy-pasted Console code
  // TODO: Progressively add proper coloration and support for all these methods
  public dir(...args: Parameters<(typeof console)["dir"]>): ReturnType<(typeof console)["dir"]> {
    return this.console.dir(...args);
  }
  public dirxml(...args: Parameters<(typeof console)["dirxml"]>): ReturnType<(typeof console)["dirxml"]> {
    return this.console.dirxml(...args);
  }
  public table(...args: Parameters<(typeof console)["table"]>): ReturnType<(typeof console)["table"]> {
    return this.console.table(...args);
  }
  public group(...args: Parameters<(typeof console)["group"]>): ReturnType<(typeof console)["group"]> {
    return this.console.group(...args);
  }
  public groupCollapsed(
    ...args: Parameters<(typeof console)["groupCollapsed"]>
  ): ReturnType<(typeof console)["groupCollapsed"]> {
    return this.console.groupCollapsed(...args);
  }
  public groupEnd(...args: Parameters<(typeof console)["groupEnd"]>): ReturnType<(typeof console)["groupEnd"]> {
    return this.console.groupEnd(...args);
  }
  public clear(...args: Parameters<(typeof console)["clear"]>): ReturnType<(typeof console)["clear"]> {
    return this.console.clear(...args);
  }
  public count(...args: Parameters<(typeof console)["count"]>): ReturnType<(typeof console)["count"]> {
    return this.console.count(...args);
  }
  public countReset(...args: Parameters<(typeof console)["countReset"]>): ReturnType<(typeof console)["countReset"]> {
    return this.console.countReset(...args);
  }
  public assert(...args: Parameters<(typeof console)["assert"]>): ReturnType<(typeof console)["assert"]> {
    return this.console.assert(...args);
  }
  public profile(...args: Parameters<(typeof console)["profile"]>): ReturnType<(typeof console)["profile"]> {
    return this.console.profile(...args);
  }
  public profileEnd(...args: Parameters<(typeof console)["profileEnd"]>): ReturnType<(typeof console)["profileEnd"]> {
    return this.console.profileEnd(...args);
  }
  public time(...args: Parameters<(typeof console)["time"]>): ReturnType<(typeof console)["time"]> {
    return this.console.time(...args);
  }
  public timeLog(...args: Parameters<(typeof console)["timeLog"]>): ReturnType<(typeof console)["timeLog"]> {
    return this.console.timeLog(...args);
  }
  public timeEnd(...args: Parameters<(typeof console)["timeEnd"]>): ReturnType<(typeof console)["timeEnd"]> {
    return this.console.timeEnd(...args);
  }
  public timeStamp(...args: Parameters<(typeof console)["timeStamp"]>): ReturnType<(typeof console)["timeStamp"]> {
    return this.console.timeStamp(...args);
  }
  //#endregion Copy-pasted Console code
}
