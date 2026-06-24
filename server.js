/**
 * FreshSabjiHub – Root server.js (repo root)
 *
 * Hostinger runs this via `npm start` from the repo root.
 * Instead of using the next() API (which doesn't work with standalone output),
 * this spawns .next/standalone/server.js as a child process.
 *
 * Crash-prevention strategy:
 *  1. Probe the port first — if busy, park as secondary (no exit = no restart loop)
 *  2. If free, spawn the real standalone server as a child process
 *  3. If the child crashes (EADDRINUSE, OOM, any reason), park instead of exiting
 *  4. Periodically poll — if primary dies, spawn again to take over
 */

'use strict';

const { spawn } = require('child_process');
const net       = require('net');
const path      = require('path');
const fs        = require('fs');

const PORT            = parseInt(process.env.PORT, 10) || 3000;
const STANDALONE_SERVER = path.join(__dirname, '.next', 'standalone', 'server.js');

console.log(`[FSH] PID=${process.pid} root-server starting on PORT=${PORT}`);

// Verify standalone server exists
if (!fs.existsSync(STANDALONE_SERVER)) {
  console.error(`[FSH] ERROR: ${STANDALONE_SERVER} not found!`);
  console.error('[FSH] Did "next build" run with output: standalone?');
  // Keep alive to avoid Hostinger restart loop
  setInterval(() => {}, 60_000);
  return;
}

// ── Port probe ────────────────────────────────────────────────────────────────
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
        spawnPrimary();
      }
    });
  }, 8000);
}

// ── Spawn the standalone server as child process ──────────────────────────────
function spawnPrimary() {
  console.log(`[FSH] PID=${process.pid} spawning ${STANDALONE_SERVER}`);

  const child = spawn(process.execPath, [STANDALONE_SERVER], {
    stdio: 'inherit',           // child logs appear in Hostinger runtime logs
    env: { ...process.env },
    cwd: path.join(__dirname, '.next', 'standalone'),
  });

  child.on('error', (err) => {
    console.error(`[FSH] Failed to spawn child: ${err.message}`);
    parkAndPoll('spawn-error');
  });

  child.on('exit', (code, signal) => {
    console.log(`[FSH] Child exited (code=${code} signal=${signal}) — parking instead of crashing`);
    // Do NOT let the parent exit — that would cause Hostinger to restart us
    parkAndPoll(`child-exit-${code ?? signal}`);
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
isPortFree((free) => {
  if (free) {
    spawnPrimary();
  } else {
    parkAndPoll('port-busy-on-start');
  }
});
