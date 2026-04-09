/**
 * Log ring buffer with SSE subscriber support.
 * Patches the global `log` object from config.js to intercept all log calls.
 * Must be imported early (before other modules that use log).
 */

import { log } from '../config.js';

const MAX_BUFFER = 500;
const _buffer = [];
const _subscribers = new Set();

// Save originals before patching
const _orig = {
  debug: log.debug,
  info: log.info,
  warn: log.warn,
  error: log.error,
};

// Patch each log level
for (const level of ['debug', 'info', 'warn', 'error']) {
  log[level] = (...args) => {
    const entry = {
      ts: Date.now(),
      level,
      msg: args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '),
    };

    _buffer.push(entry);
    if (_buffer.length > MAX_BUFFER) _buffer.shift();

    // Notify SSE subscribers
    for (const fn of _subscribers) {
      try { fn(entry); } catch {}
    }

    // Call original console output
    _orig[level](...args);
  };
}

/** Get recent logs, optionally filtered. */
export function getLogs(since = 0, level = null) {
  let result = _buffer;
  if (since > 0) result = result.filter(e => e.ts > since);
  if (level) result = result.filter(e => e.level === level);
  return result;
}

/** Subscribe to real-time log entries. */
export function subscribeToLogs(callback) {
  _subscribers.add(callback);
}

/** Unsubscribe from real-time log entries. */
export function unsubscribeFromLogs(callback) {
  _subscribers.delete(callback);
}
