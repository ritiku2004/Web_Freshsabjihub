/**
 * FreshSabjiHub – Root server.js (repo root)
 *
 * Hostinger runs this via `npm start` from the repo root.
 * This changes the working directory to .next/standalone and requires the server
 * directly in the same process, avoiding child_process.spawn restrictions on Hostinger.
 */

'use strict';

const net  = require('net');
const path = require('path');
const fs   = require('fs');

let PORT = process.env.PORT || 3000;
const isSocket = typeof PORT === 'string' && (PORT.startsWith('/') || PORT.startsWith('\\'));

if (!isSocket) {
  PORT = parseInt(PORT, 10) || 3000;
}

const STANDALONE_DIR = path.join(__dirname, '.next', 'standalone');
const STANDALONE_SERVER = path.join(STANDALONE_DIR, 'server.js');

console.log(`[FSH] PID=${process.pid} root-server starting, PORT=${PORT} (isSocket=${isSocket})`);

// Verify standalone server exists
if (!fs.existsSync(STANDALONE_SERVER)) {
  console.error(`[FSH] ERROR: ${STANDALONE_SERVER} not found!`);
  console.error('[FSH] Did "next build" run with output: standalone?');
  // Keep alive to avoid Hostinger restart loop
  setInterval(() => {}, 60_000);
  return;
}

// ── Port probe (only for TCP ports) ───────────────────────────────────────────
function isPortFree(callback) {
  const tester = net.createServer();
  tester.once('error', () => { tester.close(); callback(false); });
  tester.once('listening', () => { tester.close(() => callback(true)); });
  tester.listen(PORT, '0.0.0.0');
}

// ── Park: keep process alive, poll to retry as primary ───────────────────────
function parkAndPoll(reason) {
  console.log(`[FSH] PID=${process.pid} parking (${reason}), polling every 8s`);
  const poll = setInterval(() => {
    isPortFree((free) => {
      if (free) {
        clearInterval(poll);
        console.log(`[FSH] PID=${process.pid} primary slot free — taking over`);
        startPrimary();
      }
    });
  }, 8000);
}

// ── Load the standalone server in-process ─────────────────────────────────────
function startPrimary() {
  console.log(`[FSH] PID=${process.pid} changing cwd to ${STANDALONE_DIR} and requiring server directly`);
  try {
    process.chdir(STANDALONE_DIR);
    require(STANDALONE_SERVER);
  } catch (err) {
    console.error(`[FSH] Failed to load standalone server: ${err.message}`);
    // Keep process alive to avoid Hostinger restart loop
    setInterval(() => {}, 60_000);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
if (isSocket) {
  console.log(`[FSH] PID=${process.pid} Unix socket detected → starting primary directly`);
  startPrimary();
} else {
  isPortFree((free) => {
    if (free) {
      startPrimary();
    } else {
      parkAndPoll('port-busy-on-start');
    }
  });
}
