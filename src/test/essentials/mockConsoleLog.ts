const MockConsoleLog = () => {
  const logs = [];
  return ({
    log(msg) {
      logs.push(msg);
    },
    error(msg) {
      logs.push(msg);
    }
  });
};

export default MockConsoleLog;
