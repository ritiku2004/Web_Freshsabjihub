/**
 * FreshSabjiHub - Hostinger Production Server
 *
 * Problem: Hostinger spawns multiple workers simultaneously, all trying to
 * bind port 3000 → port conflict → crash loop → 503.
 *
 * Solution: Use a file-based lock (PID file) so only ONE worker starts
 * the Next.js server. Other workers stay alive (no crash) but stand by.
 * Standing-by workers periodically check if primary has died and take over.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const net = require('net');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
const LOCK_FILE = '/tmp/freshsabjihub-server.lock';
const STANDALONE_SERVER = path.join(__dirname, '.next', 'standalone', 'server.js');

// Set env vars required by Next.js standalone
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = String(PORT);
process.env.HOSTNAME = HOSTNAME;

console.log(`[FreshSabjiHub] Worker PID ${process.pid} starting...`);
console.log(`[FreshSabjiHub] PORT=${PORT} NODE_ENV=${process.env.NODE_ENV}`);

// Verify the standalone server exists
if (!fs.existsSync(STANDALONE_SERVER)) {
  console.error(`[FreshSabjiHub] ERROR: ${STANDALONE_SERVER} not found. Run npm run build first.`);
  process.exit(1);
}

/**
 * Start the Next.js standalone server as the primary worker.
 */
function startAsPrimary() {
  // Write PID lock file
  fs.writeFileSync(LOCK_FILE, String(process.pid), 'utf8');
  console.log(`[FreshSabjiHub] This worker (PID ${process.pid}) is PRIMARY. Starting server...`);

  // Clean up lock on exit
  const cleanup = () => {
    try {
      const stored = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      if (stored === String(process.pid)) {
        fs.unlinkSync(LOCK_FILE);
        console.log(`[FreshSabjiHub] Lock released by PID ${process.pid}.`);
      }
    } catch (_) {}
  };
  process.on('exit', cleanup);
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  process.on('SIGINT', () => { cleanup(); process.exit(0); });

  // Start the standalone server
  require(STANDALONE_SERVER);
}

/**
 * Stand by as a secondary worker.
 * Periodically check if primary has died and take over if so.
 */
function standByAsSecondary(primaryPid) {
  console.log(`[FreshSabjiHub] Worker PID ${process.pid} standing by (primary is PID ${primaryPid}).`);

  const CHECK_INTERVAL = 5000; // check every 5s

  const interval = setInterval(() => {
    try {
      const stored = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
      // Check if primary PID is still alive
      process.kill(stored, 0); // signal 0 = just check existence
      // Primary is alive, keep standing by
    } catch (_) {
      // Lock file missing or primary PID is dead → take over
      clearInterval(interval);
      console.log(`[FreshSabjiHub] Primary died. PID ${process.pid} taking over as new primary.`);
      startAsPrimary();
    }
  }, CHECK_INTERVAL);
}

/**
 * Determine if we should be primary or secondary.
 * Try to connect to the port first. If connected, another worker is up.
 */
function bootstrap() {
  // Check lock file first
  if (fs.existsSync(LOCK_FILE)) {
    const storedPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
    try {
      process.kill(storedPid, 0); // throws if PID doesn't exist
      // Primary is alive — stand by
      return standByAsSecondary(storedPid);
    } catch (_) {
      // Stale lock file — remove it and become primary
      console.log(`[FreshSabjiHub] Stale lock file (PID ${storedPid} is dead). Removing.`);
      try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
    }
  }

  // Double check via TCP: try to connect to the port
  const probe = net.createConnection({ port: PORT, host: '127.0.0.1' });

  probe.once('connect', () => {
    probe.destroy();
    // Something is already listening on this port
    console.log(`[FreshSabjiHub] Port ${PORT} is occupied. Standing by without lock.`);
    // Stand by — keep alive so Hostinger doesn't restart
    const interval = setInterval(() => {
      if (!fs.existsSync(LOCK_FILE)) {
        clearInterval(interval);
        console.log(`[FreshSabjiHub] Lock gone. PID ${process.pid} attempting to become primary.`);
        bootstrap();
      }
    }, 5000);
  });

  probe.once('error', () => {
    // Port is free — become primary
    startAsPrimary();
  });
}

// Small random jitter (0–300ms) to reduce simultaneous-start race condition
const jitter = Math.floor(Math.random() * 300);
setTimeout(bootstrap, jitter);
