// Simple logger utility
const logger = {
  log: (message: string, ...args: any[]) => console.log(message, ...args),
  info: (message: string, ...args: any[]) => console.info(message, ...args),
  error: (message: string, ...args: any[]) => console.error(message, ...args),
  warn: (message: string, ...args: any[]) => console.warn(message, ...args),
  debug: (message: string, ...args: any[]) => console.debug(message, ...args),
};

export default logger;
