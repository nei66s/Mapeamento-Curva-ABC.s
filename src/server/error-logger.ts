type ErrorEntry = {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  service?: string;
  statusCode?: number | string | undefined;
  meta?: any;
};

const RECENT_ERROR_LIMIT = 100;
const recentErrors: ErrorEntry[] = [];

function createEntry(entry: Partial<ErrorEntry> | Error) {
  const now = new Date();
  return {
    id: `${now.getTime()}-${Math.floor(Math.random() * 100000).toString(16)}`,
    message: (entry as any).message || String(entry),
    stack: (entry as any).stack,
    timestamp: now.toISOString(),
    service: (entry as any).service,
    statusCode: (entry as any).statusCode,
    meta: (entry as any).meta,
  };
}

export async function logErrorToFile(entry: Partial<ErrorEntry> | Error) {
  const obj = createEntry(entry);
  recentErrors.push(obj);
  if (recentErrors.length > RECENT_ERROR_LIMIT) {
    recentErrors.shift();
  }
  // eslint-disable-next-line no-console
  console.error('[server-error]', obj.message, { service: obj.service, statusCode: obj.statusCode, meta: obj.meta, stack: obj.stack });
  return obj;
}

export async function readRecentErrors(limit = 10) {
  if (limit <= 0) return [];
  return recentErrors.slice(-limit).reverse();
}

if (!(globalThis as any).__error_logger_installed) {
  try {
    (globalThis as any).__error_logger_installed = true;
    try {
      (process as any).setMaxListeners?.(50);
    } catch (e) {
      // ignore
    }
    process.on('uncaughtException', (err) => {
      try {
        logErrorToFile({
          message: (err && (err as any).message) || String(err),
          stack: (err && (err as any).stack) || undefined,
          service: 'process',
          meta: { type: 'uncaughtException' },
        }).catch(() => {});
      } catch (e) {
        // swallow
      }
    });
    process.on('unhandledRejection', (reason) => {
      try {
        const msg = reason && (reason as any).message ? (reason as any).message : String(reason);
        logErrorToFile({
          message: msg,
          stack: (reason && (reason as any).stack) || undefined,
          service: 'process',
          meta: { type: 'unhandledRejection' },
        }).catch(() => {});
      } catch (e) {
        // swallow
      }
    });
  } catch (e) {
    // ignore initialization errors
  }
}

const errorLogger = {
  logErrorToFile,
  readRecentErrors,
};

export default errorLogger;
