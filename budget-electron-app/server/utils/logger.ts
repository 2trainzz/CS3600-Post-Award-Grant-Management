/**
 * Simple Logger Utility
 * 
 * Just wraps console.log with timestamps and categories
 * No external dependencies, drop-in replacement for console.log
 */

class Logger {
  /**
   * Format a log message with timestamp
   */
  private format(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: any): void {
    console.log(this.format('INFO', message, data));
  }

  /**
   * Log error messages
   */
  error(message: string, data?: any): void {
    console.error(this.format('ERROR', message, data));
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.format('DEBUG', message, data));
    }
  }
}

// Export singleton instance
export const logger = new Logger();