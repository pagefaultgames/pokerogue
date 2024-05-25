const MockConsoleLog = () => {
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
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
    }
  });
};

export default MockConsoleLog;
