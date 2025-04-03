class CustomLogger {
  private formatMessage(level: string, fn: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level} [${fn}]: ${message}`;
  }

  error(fn: string, message: string, error?: Error) {
    const formattedMessage = this.formatMessage(
      "ERROR",
      fn,
      `${message} (Stack: ${error})`
    );
    console.error(formattedMessage);
  }

  warn(fn: string, message: string) {
    const formattedMessage = this.formatMessage("WARN", fn, message);
    console.warn(formattedMessage);
  }

  info(fn: string, message: string) {
    const formattedMessage = this.formatMessage("INFO", fn, message);
    console.log(formattedMessage);
  }
}

const logger = new CustomLogger();

export function logError(fn: string, message: string, error?: Error) {
  logger.error(fn, message, error);
}

export function logWarning(fn: string, message: string) {
  logger.warn(fn, message);
}

export function logInfo(fn: string, message: string) {
  logger.info(fn, message);
}

export default logger;
