/**
 * hostinger-server.js → copied to .next/standalone/server.js in postbuild
 *
 * Critical fixes vs previous versions:
 *  1. HOSTNAME always '0.0.0.0' (never process.env.HOSTNAME which is the
 *     machine name on Linux, not a bind address)
 *  2. process.exit intercepted for ALL codes (0 and non-zero)
 *     Next.js standalone may call exit(0) on EADDRINUSE
 *  3. keepAlive setInterval so event loop never drains naturally
 *  4. Unhandled rejection + uncaughtException → park instead of crash
 */

'use strict';

const net  = require('net');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
// CRITICAL: always use 0.0.0.0 — process.env.HOSTNAME on Linux is the
// machine hostname (e.g. srv123.hostinger.com), NOT a valid bind address
const BIND = '0.0.0.0';

console.log(`[FSH] PID=${process.pid} wrapper starting — PORT=${PORT}`);

// ── Keep the event loop alive permanently so natural drain can't exit us ───────
const _keepAlive = setInterval(() => {}, 60_000);

// ── Track graceful shutdown so we don't block SIGTERM ─────────────────────────
let _shuttingDown = false;
const _onShutdown = () => {
  _shuttingDown = true;
  clearInterval(_keepAlive);
  console.log(`[FSH] PID=${process.pid} shutdown signal received`);
};
process.once('SIGTERM', _onShutdown);
process.once('SIGINT',  _onShutdown);

// ── Intercept process.exit for ALL codes (including 0) ────────────────────────
const _originalExit = process.exit.bind(process);
process.exit = function (code) {
  if (_shuttingDown) {
    // Allow exit only during SIGTERM-triggered shutdown
    _originalExit(code);
    return;
  }
  console.warn(`[FSH] PID=${process.pid} process.exit(${code}) suppressed → parking`);
  startPolling();  // poll to take over when primary slot is free
};

// ── Global error handlers → park instead of crash ─────────────────────────────
process.on('uncaughtException', (err) => {
  console.error(`[FSH] uncaughtException: ${err.code || ''} ${err.message}`);
  // Don't re-throw — keepAlive keeps us running
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error(`[FSH] unhandledRejection: ${msg}`);
  // Don't re-throw
});

// ── Port probe (using fixed BIND address) ─────────────────────────────────────
function probePort(cb) {
  const tester = net.createServer();
  tester.once('error', (err) => {
    tester.close();
    cb(err.code === 'EADDRINUSE');  // true = busy, false = other error (treat as free)
  });
  tester.once('listening', () => {
    tester.close(() => cb(false));  // false = port is free
  });
  tester.listen(PORT, BIND);
}

// ── Start Next.js standalone server ───────────────────────────────────────────
let _loaded = false;
function startServer() {
  if (_loaded) return;
  _loaded = true;
  console.log(`[FSH] PID=${process.pid} → starting Next.js standalone server`);
  const serverPath = path.join(__dirname, 'server_nextjs.js');
  try {
    require(serverPath);
  } catch (e) {
    if (e.code === 'ERR_REQUIRE_ESM') {
      console.log('[FSH] ESM module detected, using dynamic import');
      import(serverPath).catch((err) => {
        console.error('[FSH] ESM import failed:', err.message);
        _loaded = false; // allow retry
      });
    } else {
      console.error('[FSH] Failed to load server_nextjs.js:', e.message);
      _loaded = false;
    }
  }
}

// ── Poll until we can become primary ──────────────────────────────────────────
let _polling = false;
function startPolling() {
  if (_polling) return;
  _polling = true;
  console.log(`[FSH] PID=${process.pid} parking — polling every 6s for primary slot`);
  const interval = setInterval(() => {
    probePort((busy) => {
      if (!busy) {
        clearInterval(interval);
        _polling = false;
        _loaded = false;
        console.log(`[FSH] PID=${process.pid} primary slot free — taking over`);
        startServer();
      }
    });
  }, 6000);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
probePort((busy) => {
  if (busy) {
    console.log(`[FSH] PID=${process.pid} port ${PORT} busy → secondary`);
    startPolling();
  } else {
    console.log(`[FSH] PID=${process.pid} port ${PORT} free → primary`);
    startServer();
  }
});
