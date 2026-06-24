const fs = require('fs');
const path = require('path');

// Helper to copy directory recursively (with fallback support)
function copyDirRecursive(src, dest) {
  try {
    if (typeof fs.cpSync === 'function') {
      fs.cpSync(src, dest, { recursive: true, force: true });
    } else {
      // Fallback manual recursive copy
      if (!fs.existsSync(src)) return;
      fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDirRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  } catch (err) {
    console.warn(`[POSTBUILD] Warning copying ${src} to ${dest}: ${err.message}`);
  }
}

const serverFile = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(serverFile)) {
  let content = fs.readFileSync(serverFile, 'utf8');
  
  // Use a robust regex to replace "const hostname = ..." with "const hostname = undefined"
  // This prevents Next.js from binding to 'localhost' or '0.0.0.0', which blocks Passenger's intercept socket.
  const modifiedContent = content.replace(/const hostname = [^;\n]+/, 'const hostname = undefined');
  
  fs.writeFileSync(serverFile, modifiedContent, 'utf8');
  console.log('[POSTBUILD] Successfully modified standalone server.js (hostname = undefined)');

  // 1. Copy public assets
  console.log('[POSTBUILD] Copying public assets...');
  const publicSrc = path.join(__dirname, 'public');
  const publicDest = path.join(__dirname, '.next', 'standalone', 'public');
  copyDirRecursive(publicSrc, publicDest);

  // 2. Copy static files
  console.log('[POSTBUILD] Copying static assets...');
  const staticSrc = path.join(__dirname, '.next', 'static');
  const staticDest = path.join(__dirname, '.next', 'standalone', '.next', 'static');
  copyDirRecursive(staticSrc, staticDest);

  // 3. Create tmp and touch restart trigger
  console.log('[POSTBUILD] Creating restart trigger...');
  const tmpDir = path.join(__dirname, '.next', 'standalone', 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'restart.txt'), String(Date.now()), 'utf8');

  console.log('[POSTBUILD] Done!');
} else {
  console.error('[POSTBUILD] Error: standalone server.js not found!');
  process.exit(1);
}

