export type LogService = 'auth' | 'registry' | 'slides' | 'web';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFields = Record<string, unknown>;
export type LogFn = (msg: string, fields?: LogFields) => void;
export interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

const order: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function readLogLevel(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.LOG_LEVEL;
  }
  return undefined;
}

function isProdDefault(): boolean {
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'production'
  ) {
    return true;
  }
  if (import.meta && typeof import.meta === 'object' && 'env' in import.meta) {
    const metaEnv = import.meta.env;
    if (metaEnv && typeof metaEnv === 'object' && 'MODE' in metaEnv) {
      return metaEnv.MODE === 'production';
    }
  }
  return false;
}

function resolveCutoff(): LogLevel {
  const raw = readLogLevel();
  if (raw === undefined || raw.trim() === '') {
    return isProdDefault() ? 'error' : 'info';
  }
  const value = raw.trim().toLowerCase();
  if (
    value === 'debug' ||
    value === 'info' ||
    value === 'warn' ||
    value === 'error'
  ) {
    return value;
  }
  throw new Error(`Invalid LOG_LEVEL: ${raw}`);
}

function normalize(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    const record: Record<string, unknown> = value as Record<string, unknown>;
    for (const [key, entry] of Object.entries(record)) {
      out[key] = normalize(entry);
    }
    return out;
  }
  return value;
}

function writeLine(line: string): void {
  if (typeof process !== 'undefined' && process.stderr) {
    process.stderr.write(line);
  } else {
    console.error(line.trimEnd());
  }
}

export function createLogger(service: LogService): Logger {
  const cutoff = order[resolveCutoff()];
  const emit = (lvl: LogLevel, msg: string, fields?: LogFields): void => {
    if (order[lvl] < cutoff) {
      return;
    }
    const extra = normalize(fields ?? {});
    const entry = {
      ts: new Date().toISOString(),
      svc: service,
      lvl,
      msg,
      ...(typeof extra === 'object' && extra !== null ? extra : {}),
    };
    writeLine(`${JSON.stringify(entry)}\n`);
  };
  return {
    debug: (msg, fields) => emit('debug', msg, fields),
    info: (msg, fields) => emit('info', msg, fields),
    warn: (msg, fields) => emit('warn', msg, fields),
    error: (msg, fields) => emit('error', msg, fields),
  };
}
