/**
 * FreshSabjiHub - Production Server
 * 
 * Uses Next.js custom server API so we can handle Hostinger's
 * multi-worker spawning gracefully. Only ONE worker binds the port;
 * others stay alive without crashing (no restart loop).
 */

'use strict';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const LOCK_FILE = '/tmp/fshjhub.lock';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`[FSH] Worker PID=${process.pid} PORT=${PORT}`);

// ─── Lock mechanism: only one worker starts the HTTP server ───────────────────

function isPidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (_) { return false; }
}

function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const stored = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
    if (!isNaN(stored) && isPidAlive(stored)) {
      return false; // another worker holds the lock
    }
    // Stale lock — remove and take over
    fs.unlinkSync(LOCK_FILE);
  }
  fs.writeFileSync(LOCK_FILE, String(process.pid), 'utf8');
  return true;
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const stored = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
      if (stored === process.pid) fs.unlinkSync(LOCK_FILE);
    }
  } catch (_) {}
}

// ─── Start primary server ─────────────────────────────────────────────────────

function startPrimary() {
  console.log(`[FSH] PID ${process.pid} → PRIMARY, starting Next.js...`);

  // Write lock
  fs.writeFileSync(LOCK_FILE, String(process.pid), 'utf8');

  // Release lock on exit
  ['exit', 'SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(sig =>
    process.on(sig, () => { releaseLock(); if (sig !== 'exit') process.exit(0); })
  );

  const app = next({ dev: false, dir: path.join(__dirname) });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    })
    .once('error', (err) => {
      console.error(`[FSH] Server error: ${err.message}`);
      process.exit(1);
    })
    .listen(PORT, '0.0.0.0', () => {
      console.log(`[FSH] ✓ Ready on http://0.0.0.0:${PORT}`);
    });
  }).catch(err => {
    console.error('[FSH] Failed to start:', err);
    process.exit(1);
  });
}

// ─── Stand by as secondary (no crash = no restart loop) ───────────────────────

function standByAsSecondary() {
  console.log(`[FSH] PID ${process.pid} → SECONDARY, standing by...`);

  // Check every 5s if the primary died; take over if so
  const interval = setInterval(() => {
    if (!acquireLock()) return; // still locked by primary
    // Lock acquired — become the new primary
    clearInterval(interval);
    startPrimary();
  }, 5000);
}

// ─── Bootstrap with random jitter to reduce race conditions ──────────────────

const jitter = Math.floor(Math.random() * 200); // 0-200ms

setTimeout(() => {
  if (acquireLock()) {
    startPrimary();
  } else {
    standByAsSecondary();
  }
}, jitter);
