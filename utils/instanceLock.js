const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '../auth_info_baileys/.instance.lock');

// Basename of our own entry point e.g. "index.js"
// Only a process running THIS script counts as a duplicate.
const OUR_SCRIPT = path.basename(process.argv[1]);

function isOurBotProcess(pid) {
  try {
    process.kill(pid, 0); // throws ESRCH if process is dead
  } catch {
    return false; // stale lock
  }

  try {
    // Args are null-byte separated in /proc/cmdline
    const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8')
      .replace(/\0/g, ' ')
      .trim();

    const isNode = /\bnode\b/i.test(cmdline);
    const isOurScript = cmdline.includes(OUR_SCRIPT); // must have "index.js"

    return isNode && isOurScript;
  } catch {
    // /proc not readable — can't confirm, treat as not ours
    return false;
  }
}

function acquireLock() {
  try {
    fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });

    if (fs.existsSync(LOCK_FILE)) {
      const pid = Number(fs.readFileSync(LOCK_FILE, 'utf8').trim());

      if (!Number.isNaN(pid) && pid !== process.pid) {
        if (isOurBotProcess(pid)) {
          console.error(
            `[instanceLock] ❌ Another ISAAC-MD instance is already running (PID ${pid}). Exiting to protect session.`
          );
          process.exit(1);
        } else {
          console.warn(
            `[instanceLock] ⚠️ PID ${pid} is not ISAAC-MD (stale or foreign). Replacing lock.`
          );
        }
      }
    }

    fs.writeFileSync(LOCK_FILE, String(process.pid));
    console.log(`[instanceLock] ✅ Lock acquired (PID ${process.pid})`);

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
    process.on('SIGINT',  () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  } catch (err) {
    console.error('[instanceLock] Error:', err.message);
  }
}

module.exports = { acquireLock };
