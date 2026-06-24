/**
 * FreshSabjiHub - Production Server
 *
 * Designed for Hostinger Node.js hosting which spawns multiple processes.
 * Key guarantees:
 *  1. NEVER calls process.exit() on EADDRINUSE — avoids restart loops.
 *  2. Only one worker actually binds the port (lock-file based).
 *  3. Secondary workers park in a tight sleep loop — no crash = no respawn.
 *  4. Lock is refreshed every 10s so stale-lock detection works reliably.
 */

'use strict';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const LOCK_FILE = '/tmp/fshjhub_v2.lock';
const LOCK_REFRESH_MS = 10_000;   // refresh every 10 s
const LOCK_STALE_MS  = 25_000;   // consider stale after 25 s

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const pid = process.pid;
console.log(`[FSH] PID=${pid} starting (PORT=${PORT})`);

// ─── Atomic lock helpers ──────────────────────────────────────────────────────

/**
 * Lock file format: "<pid>:<unixMs>"
 * Returns true if we successfully became the lock holder.
 */
function tryAcquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const raw = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      const [storedPid, storedTs] = raw.split(':').map(Number);
      const age = Date.now() - (storedTs || 0);

      if (!isNaN(storedPid) && age < LOCK_STALE_MS) {
        // Lock is fresh — check if that PID is alive
        try {
          process.kill(storedPid, 0);
          return false; // still alive → we are a secondary
        } catch (_) {
          // PID is dead — fall through and take over
          console.log(`[FSH] PID=${pid} detected dead primary PID=${storedPid}, taking over`);
        }
      }
      // Stale or dead — remove
      try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
    }

    fs.writeFileSync(LOCK_FILE, `${pid}:${Date.now()}`, 'utf8');
    return true;
  } catch (err) {
    console.error('[FSH] Lock error:', err.message);
    return false;
  }
}

function refreshLock() {
  try {
    // Only refresh if we still own it
    const raw = fs.existsSync(LOCK_FILE)
      ? fs.readFileSync(LOCK_FILE, 'utf8').trim()
      : '';
    const [storedPid] = raw.split(':').map(Number);
    if (storedPid === pid) {
      fs.writeFileSync(LOCK_FILE, `${pid}:${Date.now()}`, 'utf8');
    }
  } catch (_) {}
}

function releaseLock() {
  try {
    const raw = fs.existsSync(LOCK_FILE)
      ? fs.readFileSync(LOCK_FILE, 'utf8').trim()
      : '';
    const [storedPid] = raw.split(':').map(Number);
    if (storedPid === pid) fs.unlinkSync(LOCK_FILE);
  } catch (_) {}
}

// ─── Primary: actually starts Next.js and binds the port ─────────────────────

function startPrimary() {
  console.log(`[FSH] PID=${pid} → PRIMARY`);

  // Refresh lock periodically so secondaries detect we're alive
  const refreshInterval = setInterval(refreshLock, LOCK_REFRESH_MS);

  // Release lock cleanly on exit
  const cleanup = () => {
    clearInterval(refreshInterval);
    releaseLock();
  };
  process.once('exit',   cleanup);
  process.once('SIGTERM', () => { cleanup(); process.exit(0); });
  process.once('SIGINT',  () => { cleanup(); process.exit(0); });

  const app = next({ dev: false, dir: path.join(__dirname) });
  const handle = app.getRequestHandler();

  app.prepare()
    .then(() => {
      const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          // Port in use — another primary already holds it.
          // Stand down gracefully WITHOUT exiting (avoids restart loop).
          console.warn(`[FSH] PID=${pid} port ${PORT} already in use, standing down as secondary`);
          clearInterval(refreshInterval);
          releaseLock();
          standByAsSecondary();
          return;
        }
        // Unexpected server error — log but do NOT exit
        console.error(`[FSH] Server error: ${err.message}`);
      });

      server.listen(PORT, '0.0.0.0', () => {
        console.log(`[FSH] PID=${pid} ✓ Listening on http://0.0.0.0:${PORT}`);
      });
    })
    .catch((err) => {
      // Next.js failed to prepare — log but keep process alive
      console.error('[FSH] Next.js prepare() failed:', err.message || err);
      clearInterval(refreshInterval);
      releaseLock();
      // Park the process to avoid Hostinger respawn loop
      parkForever('prepare-error');
    });
}

// ─── Secondary: parks without crashing ───────────────────────────────────────

function standByAsSecondary() {
  console.log(`[FSH] PID=${pid} → SECONDARY (polling for primary death)`);

  const poll = setInterval(() => {
    if (tryAcquireLock()) {
      clearInterval(poll);
      startPrimary();
    }
  }, 6000 + Math.floor(Math.random() * 2000)); // 6-8s poll with jitter
}

/**
 * Keep process alive indefinitely without consuming CPU.
 * Used when we can't start but don't want Hostinger to restart us.
 */
function parkForever(reason) {
  console.log(`[FSH] PID=${pid} parked indefinitely (reason: ${reason})`);
  setInterval(() => {}, 60_000); // no-op timer keeps event loop alive
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

// Stagger startup with jitter to reduce simultaneous lock contention
const jitter = Math.floor(Math.random() * 500); // 0–500 ms

setTimeout(() => {
  if (tryAcquireLock()) {
    startPrimary();
  } else {
    standByAsSecondary();
  }
}, jitter);
