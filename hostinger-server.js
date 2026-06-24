/**
 * hostinger-server.js
 *
 * Copied to .next/standalone/server.js during postbuild.
 * This replaces Next.js's generated standalone server with a version
 * that NEVER calls process.exit() — preventing Hostinger's restart loop
 * when a secondary worker gets EADDRINUSE.
 *
 * How it works:
 *  1. Quick TCP probe: if port is already bound → park as secondary (poll for takeover)
 *  2. If port is free → intercept process.exit + uncaughtException, then load real Next.js server
 *  3. If primary dies later → secondary detects it and takes over
 */

'use strict';

const net = require('net');
const path = require('path');

const PORT     = parseInt(process.env.PORT, 10) || 3000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

console.log(`[FSH] PID=${process.pid} starting on PORT=${PORT}`);

// ── TCP port probe ────────────────────────────────────────────────────────────
// Returns 'free' | 'busy' | 'error'
function probePort(callback) {
  const tester = net.createServer();
  tester.once('error', (err) => {
    tester.close();
    callback(err.code === 'EADDRINUSE' ? 'busy' : 'error');
  });
  tester.once('listening', () => {
    tester.close(() => callback('free'));
  });
  tester.listen(PORT, HOSTNAME);
}

// ── Secondary mode: poll until primary dies, then take over ──────────────────
function runAsSecondary() {
  console.log(`[FSH] PID=${process.pid} → SECONDARY (port busy), polling for takeover`);
  const poll = setInterval(() => {
    probePort((status) => {
      if (status === 'free') {
        clearInterval(poll);
        console.log(`[FSH] PID=${process.pid} primary died → taking over`);
        runAsPrimary();
      }
    });
  }, 5000); // check every 5s
}

// ── Primary mode: load the real Next.js standalone server ────────────────────
function runAsPrimary() {
  console.log(`[FSH] PID=${process.pid} → PRIMARY`);

  // Intercept process.exit so crashes don't trigger Hostinger restart loop.
  // We allow exit(0) (graceful shutdown) but park on error exits.
  const _exit = process.exit.bind(process);
  process.exit = function (code) {
    if (code === 0) {
      _exit(0);
      return;
    }
    console.warn(`[FSH] process.exit(${code}) suppressed → parking`);
    runAsSecondary();
  };

  // Catch EADDRINUSE and any other uncaught errors from Next.js internals
  process.once('uncaughtException', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[FSH] EADDRINUSE caught → secondary`);
      runAsSecondary();
      return;
    }
    console.error('[FSH] Uncaught exception:', err.message);
    // Park instead of crashing to avoid restart loop
    runAsSecondary();
  });

  process.once('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    if (msg.includes('EADDRINUSE') || (reason && reason.code === 'EADDRINUSE')) {
      console.log('[FSH] EADDRINUSE rejection → secondary');
      runAsSecondary();
      return;
    }
    console.error('[FSH] Unhandled rejection:', msg);
    runAsSecondary();
  });

  // Load the REAL Next.js standalone server (renamed to server_nextjs.js in postbuild)
  const serverPath = path.join(__dirname, 'server_nextjs.js');
  try {
    require(serverPath);
  } catch (e) {
    if (e.code === 'ERR_REQUIRE_ESM') {
      // Next.js standalone uses ESM in some versions — use dynamic import
      import(serverPath).catch((err) => {
        console.error('[FSH] ESM import failed:', err.message);
        runAsSecondary();
      });
    } else {
      console.error('[FSH] Failed to load server_nextjs.js:', e.message);
      runAsSecondary();
    }
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
probePort((status) => {
  if (status === 'free') {
    runAsPrimary();
  } else {
    // busy OR probe error → stand by as secondary
    runAsSecondary();
  }
});
