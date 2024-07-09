type LogType = "ERROR" | "WARN" | "INFO" | "LOG" | "DEBUG" | "TRACE";

interface LogEntry {
  date: Date;
  type: LogType;
  context: string;
  optionalParams?: any[];
}

/**
 * Logger for the application.
 * Similar to the standard console but with a buffer that can be downloaded as a log file.
 */
export class Logger {
  /**
   * The log level to use. Defaults to 1 ("DEBUG").
   * Distinguishes which levels will be printed to the console. They will always be saved to {@linkcode entries}.
   * 0 = TRACE |
   * 1 = DEBUG |
   * 2 = LOG |
   * 3 = INFO |
   * 4 = WARN |
   * 5 = ERROR |
   * 6++ = NONE
   */
  private readonly logLevel: number;
  /**
   * The maximum number of {@linkcode entries} to keep. Defaults to 500.
   */
  private readonly entriesLimit: number;
  /**
   * The log entries. Max size is defined by {@linkcode entriesLimit}
   */
  private entries: LogEntry[] = [];

  constructor(bufferLimit: number = 500) {
    this.entriesLimit = bufferLimit;
    const viteLogLevel: number = Number(import.meta.env.VITE_LOG_LEVEL);
    this.logLevel = !isNaN(viteLogLevel) ? viteLogLevel : 1;
    console.debug("Log Level: ", this.logLevel);
  }

  /**
   * Logs an error to the console and saves a copy in the buffer
   *
   * @param context - some context of what is logged
   * @param optionalParams - optional additional parameters to be logged
   */
  public error(context: string, ...optionalParams: any[]): void {
    this.addEntry("ERROR", context, ...optionalParams);
    if (this.logLevel <= 5) {
      console.error(context, ...optionalParams);
    }
  }

  /**
   *  Logs a warning to the console and saves a copy in the buffer
   *
   * @param context - some context of what is logged
   * @param optionalParams - optional additional parameters to be logged
   */
  public warn(context: string, ...optionalParams: any[]): void {
    this.addEntry("WARN", context, ...optionalParams);
    if (this.logLevel <= 4) {
      console.warn(context, ...optionalParams);
    }
  }

  /**
   * Logs an info to the console and saves a copy in the buffer
   *
   * @param context - some context of what is logged
   * @param optionalParams - optional additional parameters to be logged
   */
  public info(context: string, ...optionalParams: any[]): void {
    this.addEntry("INFO", context, ...optionalParams);
    if (this.logLevel <= 3) {
      console.info(context, ...optionalParams);
    }
  }

  /**
   * Logs a log to the console and saves a copy in the buffer
   *
   * @param context - some context of what is logged
   * @param optionalParams - optional additional parameters to be logged
   */
  public log(context: string, ...optionalParams: any[]): void {
    this.addEntry("LOG", context, ...optionalParams);
    if (this.logLevel <= 2) {
      console.log(context, ...optionalParams);
    }
  }

  /**
   * Logs a debug to the console and saves a copy in the buffer
   *
   * @param context - some context of what is logged
   * @param optionalParams - optional additional parameters to be logged
   */
  public debug(context: string, ...optionalParams: any[]): void {
    this.addEntry("DEBUG", context, ...optionalParams);
    if (this.logLevel <= 1) {
      console.debug(context, ...optionalParams);
    }
  }

  /**
   * Logs a trace to the console and saves a copy in the buffer
   *
   * @param context - some context of what is logged
   * @param optionalParams - optional additional parameters to be logged
   */
  public trace(context: string, ...optionalParams: any[]): void {
    this.addEntry("TRACE", context, ...optionalParams);
    if (this.logLevel <= 0) {
      console.trace(context, ...optionalParams);
    }
  }

  /**
   * Downloads the buffered log entries as a log file
   */
  public downloadLogFile() {
    const blob = new Blob([this.entriesAsStringArray().join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "pokerogue.log";
    link.click();
    link.remove();
  }

  private addEntry(
    type: LogType,
    context: string,
    ...optionalParams: any[]
  ): void {
    this.entries.push({
      date: new Date(),
      type: type,
      context: context,
      optionalParams,
    });

    if (this.entries.length > this.entriesLimit) {
      this.entries.shift();
    }
  }

  private entriesAsStringArray(): string[] {
    return this.entries.map(({ context, type: type, optionalParams, date }) => {
      const optionalParamsStr = optionalParams
        .map((param) => this.stringify(param))
        .join(", ");
      return `${date.toUTCString()} *${type}* ${context} ${optionalParamsStr}`;
    });
  }

  private stringify(obj: any): string {
    try {
      return JSON.stringify(obj, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      );
    } catch (e) {
      console.warn("failed to stringify object", obj, e);
      return "[FAILED TO STRINGIFY OBJECT]";
    }
  }
}

export const logger = new Logger();
