const MockConsoleLog = () => {
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
  return ({
    log(msg) {
      logs.push(msg);
      originalLog(msg); // Appelle le console.log originel
    },
    error(msg) {
      logs.push(msg);
      originalError(msg); // Appelle le console.error originel
    }
  });
};

export default MockConsoleLog;
