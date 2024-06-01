const MockConsoleLog = (_logDisabled=false) => {
  let logs = [];
  const logDisabled: boolean = _logDisabled;
  const originalLog = console.log;
  const originalError = console.error;
  const originalDebug = console.debug;
  const originalWarn = console.warn;
  const notified = [];

  const blacklist = ["variant icon does not exist", "Texture \"%s\" not found"];

  return ({
    log(...args) {
      const argsStr = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg.toString()).join(";");
      if (argsStr.includes("wurmple")) {
        console.log("here");
      }
      logs.push(argsStr);
      if (logDisabled || blacklist.some((b) => argsStr.includes(b))) {
        return;
      }
      originalLog(args);
    },
    error(...args) {
      const argsStr = args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg.toString()).join(";");
      logs.push(argsStr);
      if (blacklist.some((b) => argsStr.includes(b))) {
        return;
      }
      originalError(args); // Appelle le console.error originel
    },
    debug(...args) {
      logs.push(args);
      originalDebug(args);
    },
    warn(...args) {
      logs.push(args);
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
    }
  });
};

export default MockConsoleLog;
