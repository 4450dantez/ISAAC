const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '../auth_info_baileys/.instance.lock');

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const pid = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      try {
        process.kill(Number(pid), 0);
        console.error(`[instanceLock] ❌ Another instance is already running (PID ${pid}). Exiting to protect session.`);
        process.exit(1);
      } catch {
        console.warn('[instanceLock] ⚠️ Stale lock file found. Previous instance died uncleanly. Continuing...');
      }
    }

    fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
    fs.writeFileSync(LOCK_FILE, String(process.pid));

    const cleanup = () => { try { fs.unlinkSync(LOCK_FILE); } catch {} };
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  } catch (err) {
    console.error('[instanceLock] Failed to acquire lock:', err.message);
  }
}

module.exports = { acquireLock };
