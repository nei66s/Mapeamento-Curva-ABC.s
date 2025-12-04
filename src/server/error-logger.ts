import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'errors.log');
const RETENTION_DAYS = Number(process.env.LOG_RETENTION_DAYS || 14);

type ErrorEntry = {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  service?: string;
  statusCode?: number | string | undefined;
  meta?: any;
};

async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

export async function logErrorToFile(entry: Partial<ErrorEntry> | Error) {
  try {
    await ensureLogDir();
    const now = new Date();
    const obj: ErrorEntry = {
      id: `${now.getTime()}-${Math.floor(Math.random() * 100000).toString(16)}`,
      message: (entry as any).message || String(entry),
      stack: (entry as any).stack,
      timestamp: now.toISOString(),
      service: (entry as any).service,
      statusCode: (entry as any).statusCode,
      meta: (entry as any).meta,
    };

    // determine today's file (daily rotation)
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayFile = path.join(LOG_DIR, `errors-${yyyy}${mm}${dd}.log`);
    const line = JSON.stringify(obj) + '\n';
    await fs.appendFile(todayFile, line, { encoding: 'utf8' });
    // also write/refresh a pointer file for compatibility (errors.log)
    try {
      await fs.writeFile(LOG_FILE, line, { encoding: 'utf8', flag: 'a' });
    } catch (e) {
      // ignore
    }

    // trigger cleanup asynchronously (non-blocking)
    rotateAndCleanup().catch(() => {});
    return obj;
  } catch (e) {
    // If logging fails, write to console as a last resort
    // eslint-disable-next-line no-console
    console.error('Failed to write error log to file', e);
    return null;
  }
}

export async function readRecentErrors(limit = 10) {
  try {
    await ensureLogDir();
    // read recent daily files (newest first)
    const files = (await fs.readdir(LOG_DIR)).filter((f) => /^errors-\d{8}\.log$/.test(f)).sort().reverse();
    const out: ErrorEntry[] = [];
    for (const f of files) {
      if (out.length >= limit) break;
      try {
        const raw = await fs.readFile(path.join(LOG_DIR, f), 'utf8');
        const lines = raw.split(/\r?\n/).filter(Boolean);
        for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
          try {
            const parsed = JSON.parse(lines[i]);
            out.push(parsed);
          } catch (e) {
            // skip
          }
        }
      } catch (e) {
        // skip file read errors
      }
    }
    return out;
  } catch (e) {
    return [];
  }
}

async function rotateAndCleanup() {
  try {
    await ensureLogDir();
    if (!RETENTION_DAYS || RETENTION_DAYS <= 0) return;
    const files = await fs.readdir(LOG_DIR);
    const now = Date.now();
    for (const f of files) {
      const m = f.match(/^errors-(\d{8})\.log$/);
      if (!m) continue;
      const dateStr = m[1];
      const yyyy = Number(dateStr.slice(0, 4));
      const mm = Number(dateStr.slice(4, 6)) - 1;
      const dd = Number(dateStr.slice(6, 8));
      const fileTime = new Date(yyyy, mm, dd).getTime();
      const ageDays = Math.floor((now - fileTime) / (1000 * 60 * 60 * 24));
      if (ageDays > RETENTION_DAYS) {
        try { await fs.unlink(path.join(LOG_DIR, f)); } catch (e) { /* ignore */ }
      }
    }
  } catch (e) {
    // ignore cleanup errors
  }
}

// Ensure we only register process handlers and monkey-patch once
if (!(globalThis as any).__error_logger_installed) {
  try {
    (globalThis as any).__error_logger_installed = true;

    // Guard listener registration so hot-reloads or multiple imports don't
    // accumulate listeners and trigger MaxListenersExceededWarning.
    try { (process as any).setMaxListeners?.(50); } catch (e) {}

    // Capture process-level uncaught errors so they appear in the file logs
    process.on('uncaughtException', (err) => {
      try {
        // don't await — fire-and-forget
        logErrorToFile({ message: (err && (err as any).message) || String(err), stack: (err && (err as any).stack) || undefined, service: 'process', meta: { type: 'uncaughtException' } }).catch(() => {});
      } catch (e) {
        // swallow
      }
    });

    process.on('unhandledRejection', (reason) => {
      try {
        const msg = reason && (reason as any).message ? (reason as any).message : String(reason);
        logErrorToFile({ message: msg, stack: (reason && (reason as any).stack) || undefined, service: 'process', meta: { type: 'unhandledRejection' } }).catch(() => {});
      } catch (e) {
        // swallow
      }
    });

    // Monkey-patch console.error to also write to the file log. This helps capture
    // errors that are caught and logged via console.error across the server code.
    try {
      const origConsoleError = console.error.bind(console);
      console.error = (...args: any[]) => {
        try {
          // preserve original behavior
          origConsoleError(...args);
          // attempt to extract error-like info
          const first = args[0];
          if (first instanceof Error) {
            logErrorToFile({ message: first.message, stack: first.stack, meta: { args } }).catch(() => {});
          } else if (typeof first === 'string') {
            logErrorToFile({ message: first, meta: { args } }).catch(() => {});
          } else if (first && typeof first === 'object') {
            try {
              const msg = first.message || JSON.stringify(first);
              logErrorToFile({ message: msg, meta: { args } }).catch(() => {});
            } catch (e) {
              logErrorToFile({ message: String(first), meta: { args } }).catch(() => {});
            }
          }
        } catch (e) {
          try { origConsoleError('error-logger failed to log', e); } catch (_) {}
        }
      };
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore initialization errors
  }
}

export default {
  logErrorToFile,
  readRecentErrors,
};
