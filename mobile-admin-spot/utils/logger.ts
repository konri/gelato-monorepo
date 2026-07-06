/**
 * Logger utility for development and production
 * In production, errors should be sent to a monitoring service (e.g. Sentry)
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
    // TODO: Send to error monitoring service (Sentry, etc.)
    // Sentry.captureException(args[0]);
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};


