const MockConsoleLog = () => {
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
  const notified = [];
  return ({
    log(msg) {
      logs.push(msg);
      if (msg.includes("phase")) {
        originalLog(msg);
      }
    },
    error(msg) {
      logs.push(msg);
      originalError(msg); // Appelle le console.error originel
    },
    debug(msg) {
      logs.push(msg);
    },
    warn(msg) {
      logs.push(msg);
    },
    notify(msg) {
      originalLog(msg);
      notified.push(msg);
    }
  });
};

export default MockConsoleLog;
