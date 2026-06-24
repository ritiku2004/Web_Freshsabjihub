const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(serverFile)) {
  let content = fs.readFileSync(serverFile, 'utf8');
  
  // Use a robust regex to replace "const hostname = ..." with "const hostname = undefined"
  // This prevents Next.js from binding to 'localhost' or '0.0.0.0', which blocks Passenger's intercept socket.
  const modifiedContent = content.replace(/const hostname = [^;\n]+/, 'const hostname = undefined');
  
  fs.writeFileSync(serverFile, modifiedContent, 'utf8');
  console.log('[POSTBUILD] Successfully modified standalone server.js (hostname = undefined)');
} else {
  console.error('[POSTBUILD] Error: standalone server.js not found!');
  process.exit(1);
}
