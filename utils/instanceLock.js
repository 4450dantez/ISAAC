const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '../auth_info_baileys/.instance.lock');

function acquireLock() {
  try {
    fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });

    if (fs.existsSync(LOCK_FILE)) {
      const pid = Number(fs.readFileSync(LOCK_FILE, 'utf8').trim());

      if (!Number.isNaN(pid)) {
        try {
          process.kill(pid, 0); // throws if process doesn't exist

          // Check cmdline — null bytes separate args, replace for readability
          const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8')
            .replace(/\0/g, ' ')
            .trim();

          // Check working directory — only our bot runs from the same folder
          let cwd = null;
          try {
            cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
          } catch {}

          const isNode = cmdline.toLowerCase().includes('node');
          const isSameDir = cwd === process.cwd();

          if (isNode && isSameDir) {
            console.error(
              `[instanceLock] ❌ Another ISAAC-MD instance is already running (PID ${pid}). Exiting to protect session.`
            );
            process.exit(1);
          }

          // Process exists but it's not our bot (different dir or not Node)
          console.warn(
            `[instanceLock] ⚠️ PID ${pid} exists but is not ISAAC-MD. Replacing stale lock.`
          );
        } catch (e) {
          if (e.code === 'ESRCH') {
            // Process is dead — stale lock, safe to overwrite
            console.warn('[instanceLock] ⚠️ Stale lock found (process dead). Replacing...');
          }
        }
      }
    }

    fs.writeFileSync(LOCK_FILE, String(process.pid));

    // Clean up lock on exit — only remove if it's still ours
    const cleanup = () => {
      try {
        if (
          fs.existsSync(LOCK_FILE) &&
          fs.readFileSync(LOCK_FILE, 'utf8').trim() === String(process.pid)
        ) {
          fs.unlinkSync(LOCK_FILE);
        }
      } catch {}
    };

    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  } catch (err) {
    console.error('[instanceLock]', err.message);
  }
}

module.exports = { acquireLock };
