const originalLog = console.log;
const originalError = console.error;
const originalDebug = console.debug;
const originalWarn = console.warn;

const blacklist = ["Phaser", "variant icon does not exist", 'Texture "%s" not found'];
const whitelist = ["Phase"];

export class MockConsoleLog {
  constructor(
    private logDisabled = false,
    private phaseText = false,
  ) {}
  private logs: any[] = [];
  private notified: any[] = [];

  public log(...args) {
    const argsStr = this.getStr(args);
    this.logs.push(argsStr);
    if (this.logDisabled && !this.phaseText) {
      return;
    }
    if ((this.phaseText && !whitelist.some(b => argsStr.includes(b))) || blacklist.some(b => argsStr.includes(b))) {
      return;
    }
    originalLog(args);
  }
  public error(...args) {
    const argsStr = this.getStr(args);
    this.logs.push(argsStr);
    originalError(args); // Appelle le console.error originel
  }
  public debug(...args) {
    const argsStr = this.getStr(args);
    this.logs.push(argsStr);
    if (this.logDisabled && !this.phaseText) {
      return;
    }
    if (!whitelist.some(b => argsStr.includes(b)) || blacklist.some(b => argsStr.includes(b))) {
      return;
    }
    originalDebug(args);
  }
  warn(...args) {
    const argsStr = this.getStr(args);
    this.logs.push(args);
    if (this.logDisabled && !this.phaseText) {
      return;
    }
    if (!whitelist.some(b => argsStr.includes(b)) || blacklist.some(b => argsStr.includes(b))) {
      return;
    }
    originalWarn(args);
  }
  notify(msg) {
    originalLog(msg);
    this.notified.push(msg);
  }
  getLogs() {
    return this.logs;
  }
  clearLogs() {
    this.logs = [];
  }
  getStr(...args) {
    return args
      .map(arg => {
        if (typeof arg === "object" && arg !== null) {
          // Handle objects including arrays
          return JSON.stringify(arg, (_key, value) => (typeof value === "bigint" ? value.toString() : value));
        }
        if (typeof arg === "bigint") {
          // Handle BigInt values
          return arg.toString();
        }
        return arg.toString();
      })
      .join(";");
  }
}
