/**
 * FreshSabjiHub – Root server.js (repo root)
 *
 * Hostinger runs this via `npm start` from the repo root.
 * This changes the working directory to .next/standalone and requires the server
 * directly in the same process, avoiding child_process.spawn restrictions
 * and asynchronous port probing collisions with Phusion Passenger.
 */

'use strict';

const path = require('path');
const fs   = require('fs');

const STANDALONE_DIR = path.join(__dirname, '.next', 'standalone');
const STANDALONE_SERVER = path.join(STANDALONE_DIR, 'server.js');

console.log(`[FSH] PID=${process.pid} root-server starting`);

// Verify standalone server exists
if (!fs.existsSync(STANDALONE_SERVER)) {
  console.error(`[FSH] ERROR: ${STANDALONE_SERVER} not found!`);
  console.error('[FSH] Did "next build" run with output: standalone?');
  // Keep alive to avoid Hostinger restart loop
  setInterval(() => {}, 60_000);
} else {
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

