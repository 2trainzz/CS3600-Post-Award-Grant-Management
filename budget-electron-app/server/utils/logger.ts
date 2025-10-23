//simple log utils for console.log

class Logger {
  //format a log message with timestamp
  private format(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  //log info messages
  info(message: string, data?: any): void {
    console.log(this.format('INFO', message, data));
  }

  //log error messages
  error(message: string, data?: any): void {
    console.error(this.format('ERROR', message, data));
  }

  //log debug messages
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.format('DEBUG', message, data));
    }
  }
}

//export singleton instance
export const logger = new Logger();