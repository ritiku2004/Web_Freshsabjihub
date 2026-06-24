/**
 * FreshSabjiHub - Hostinger-Compatible Production Server
 *
 * IMPORTANT: Hostinger's Node.js hosting runs its own process manager that
 * bypasses 'npm start' and executes Next.js startup code directly. Our
 * custom lock-file mechanism never runs. This file now wraps Next.js's own
 * HTTP server with a minimal EADDRINUSE guard so secondary workers never
 * crash → no restart loops.
 *
 * Startup messages you'll see in Hostinger logs:
 *   "▲ Next.js 16.2.9 / ✓ Ready in 0ms"    
 * Those come from Next.js itself during app.prepare() — that's normal.
 */

'use strict';

const http  = require('http');
const { parse } = require('url');
const next  = require('next');
const path  = require('path');
const net   = require('net');

const PORT = parseInt(process.env.PORT, 10) || 3000;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// ── Keep process alive indefinitely (no exit = no Hostinger restart loop) ──
function parkForever(reason) {
  console.log(`[FSH] PID=${process.pid} parked (${reason}) – no restart needed`);
  // Dummy interval keeps the event loop running so Hostinger won't kill us
  setInterval(() => {}, 60_000);
}

// ── Quick port probe: returns true if port is FREE, false if already in use ──
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', (err) => {
      tester.close();
      resolve(err.code !== 'EADDRINUSE'); // port busy = false
    });
    tester.once('listening', () => {
      tester.close(() => resolve(true)); // port free = true
    });
    tester.listen(port, '0.0.0.0');
  });
}

async function main() {
  console.log(`[FSH] PID=${process.pid} starting on PORT=${PORT}`);

  // Fast port probe before doing expensive app.prepare()
  // This avoids two workers both spending ~1s on preparation.
  const free = await isPortFree(PORT);
  if (!free) {
    // Another worker already owns the port → we are a secondary.
    // Do NOT exit — just park so Hostinger doesn't spawn yet another worker.
    console.log(`[FSH] PID=${process.pid} port ${PORT} already in use → secondary worker`);
    parkForever('port-busy');
    return;
  }

  // We won the port probe — prepare and start Next.js.
  const app = next({ dev: false, dir: path.join(__dirname) });
  const handle = app.getRequestHandler();

  try {
    await app.prepare();
  } catch (err) {
    console.error('[FSH] app.prepare() failed:', err.message || err);
    parkForever('prepare-error');
    return;
  }

  const server = http.createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // Lost the race between probe and listen (tiny window) → park gracefully
      console.warn(`[FSH] PID=${process.pid} EADDRINUSE after probe → secondary`);
      server.close();
      parkForever('eaddrinuse-after-probe');
      return;
    }
    // Any other server error — log but keep process alive
    console.error(`[FSH] Server error: ${err.message}`);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FSH] PID=${process.pid} ✓ Primary – listening on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown signals
  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT',  shutdown);
}

main().catch((err) => {
  console.error('[FSH] Unhandled startup error:', err);
  parkForever('unhandled-error');
});
