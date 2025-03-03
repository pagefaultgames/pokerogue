export default class ErrorInterceptor {
  private static instance: ErrorInterceptor;
  public running;

  constructor() {
    this.running = [];
  }

  public static getInstance(): ErrorInterceptor {
    if (!ErrorInterceptor.instance) {
      ErrorInterceptor.instance = new ErrorInterceptor();
    }
    return ErrorInterceptor.instance;
  }

  clear() {
    this.running = [];
  }

  add(obj) {
    this.running.push(obj);
  }

  remove(obj) {
    const index = this.running.indexOf(obj);
    if (index !== -1) {
      this.running.splice(index, 1);
    }
  }
}


process.on("uncaughtException", (error) => {
  console.log(error);
  const toStop = ErrorInterceptor.getInstance().running;
  for (const elm of toStop) {
    elm.rejectAll(error);
  }
  global.testFailed = true;
});

// Global error handler for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.log(reason);
  const toStop = ErrorInterceptor.getInstance().running;
  for (const elm of toStop) {
    elm.rejectAll(reason);
  }
  global.testFailed = true;
});
