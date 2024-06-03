const MockConsoleLog = (_logDisabled= false, _phaseText=false) => {
  let logs = [];
  const logDisabled: boolean = _logDisabled;
  const phaseText: boolean = _phaseText;
  const originalLog = console.log;
  const originalError = console.error;
  const originalDebug = console.debug;
  const originalWarn = console.warn;
  const notified = [];

  const blacklist = ["Phaser", "variant icon does not exist", "Texture \"%s\" not found"];
  const whitelist = ["Phase"];

  return ({
    log(...args) {
      const argsStr = this.getStr(args);
      logs.push(argsStr);
      if (logDisabled && (!phaseText)) {
        return;
      }
      if ((phaseText && !whitelist.some((b) => argsStr.includes(b))) || blacklist.some((b) => argsStr.includes(b))) {
        return;
      }
      originalLog(args);
    },
    error(...args) {
      const argsStr = this.getStr(args);
      logs.push(argsStr);
      originalError(args); // Appelle le console.error originel
    },
    debug(...args) {
      const argsStr = this.getStr(args);
      logs.push(argsStr);
      if (logDisabled && (!phaseText)) {
        return;
      }
      if (!whitelist.some((b) => argsStr.includes(b)) || blacklist.some((b) => argsStr.includes(b))) {
        return;
      }
      originalDebug(args);
    },
    warn(...args) {
      const argsStr = this.getStr(args);
      logs.push(args);
      if (logDisabled && (!phaseText)) {
        return;
      }
      if (!whitelist.some((b) => argsStr.includes(b)) || blacklist.some((b) => argsStr.includes(b))) {
        return;
      }
      originalWarn(args);
    },
    notify(msg) {
      originalLog(msg);
      notified.push(msg);
    },
    getLogs() {
      return logs;
    },
    clearLogs() {
      logs = [];
    },
    getStr(...args) {
      return args.map(arg => {
        if (typeof arg === "object" && arg !== null) {
          // Handle objects including arrays
          return JSON.stringify(arg, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
          );
        } else if (typeof arg === "bigint") {
          // Handle BigInt values
          return arg.toString();
        } else {
          // Handle all other types
          return arg.toString();
        }
      }).join(";");
    },
  });
};

export default MockConsoleLog;
