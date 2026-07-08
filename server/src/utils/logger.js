/**
 * Minimal structured logger. Keeps output readable in dev and JSON-friendly in prod
 * without pulling in a heavy dependency.
 */
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function emit(level, message, meta) {
  if (levels[level] > levels[activeLevel]) return;
  const time = new Date().toISOString();
  if (process.env.NODE_ENV === 'production') {
    process.stdout.write(JSON.stringify({ time, level, message, ...meta }) + '\n');
  } else {
    const tag = { error: '✖', warn: '⚠', info: 'ℹ', debug: '·' }[level];
    const extra = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    process.stdout.write(`${time} ${tag} ${message}${extra}\n`);
  }
}

export const logger = {
  error: (msg, meta) => emit('error', msg, meta),
  warn: (msg, meta) => emit('warn', msg, meta),
  info: (msg, meta) => emit('info', msg, meta),
  debug: (msg, meta) => emit('debug', msg, meta),
};
