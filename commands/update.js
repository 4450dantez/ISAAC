/**
 * commands/update.js
 * ---------------------
 * .update    — check if a newer version is available.
 *   - On a real git checkout (Termux/VPS): compares HEAD against origin/main.
 *   - On Heroku (no .git at runtime): compares the currently-running slug's
 *     commit (via Heroku's dyno metadata) against the latest commit on
 *     GitHub's main branch, using GitHub's public REST API. No token
 *     required since the repo is public.
 *
 * .updatenow — owner-only.
 *   - On a real git checkout: git pull, npm install if package.json
 *     changed, then restart the bot in place.
 *   - On Heroku: triggers a fresh build from the GitHub repo's tarball via
 *     the Heroku Platform API. Requires HEROKU_API_KEY and HEROKU_APP_NAME
 *     to be set in that app's config vars. Heroku restarts the dyno(s)
 *     automatically once the new build releases — no manual restart step
 *     needed.
 */

const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const root = path.join(__dirname, '..');
const gitDir = path.join(root, '.git');

// Public repo — no auth needed to read commits.
const GITHUB_OWNER = 'kingplayboi';
const GITHUB_REPO = 'ISAAC';
const GITHUB_BRANCH = 'main';

function hasGit() {
  return fs.existsSync(gitDir);
}

function isHeroku() {
  return Boolean(process.env.DYNO);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: root, encoding: 'utf8', timeout: 30000, ...opts }).trim();
}

async function githubApi(endpoint) {
  if (typeof fetch !== 'function') {
    throw new Error('This Node version has no global fetch. Node 18+ is required for update checks.');
  }
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'ISAAC-MD' },
  });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

const DEPLOYED_COMMIT_PATH = path.join(root, '.deployed-commit');

/**
 * Compares the deployed commit against the latest on GitHub.
 *
 * The deployed commit is captured automatically at build time (see
 * scripts/write-commit.js, run via the "heroku-postbuild" npm script) —
 * no manual `heroku labs:enable` step required from the deployer.
 */
async function checkHerokuUpdate() {
  let currentCommit = null;

  if (fs.existsSync(DEPLOYED_COMMIT_PATH)) {
    currentCommit = fs.readFileSync(DEPLOYED_COMMIT_PATH, 'utf8').trim();
  }

  // Fallback for anyone who already has runtime-dyno-metadata enabled from before.
  if (!currentCommit) {
    currentCommit = process.env.HEROKU_SLUG_COMMIT;
  }

  if (!currentCommit) {
    throw new Error(
      'Could not determine the currently deployed commit. This usually means the bot ' +
      'hasn\'t been rebuilt since this feature was added — run .updatenow once, or ' +
      '`git push heroku main`, and this will start working on the next build.'
    );
  }

  const latest = await githubApi(`/commits/${GITHUB_BRANCH}`);
  const latestSha = latest.sha;

  if (latestSha === currentCommit) {
    return { upToDate: true };
  }

  // Get how many commits behind + the commit messages in between.
  const compare = await githubApi(`/compare/${currentCommit}...${latestSha}`);

  return {
    upToDate: false,
    behind: compare.ahead_by ?? compare.total_commits ?? '?',
    latestShortSha: latestSha.slice(0, 7),
    latestMsg: (latest.commit?.message || '').split('\n')[0],
  };
}

module.exports = [
  {
    name: 'update',
    description: 'Check whether a newer version of the bot is available. Usage: .update',
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;

      // --- Real git checkout (Termux / VPS) ---
      if (hasGit()) {
        try {
          run('git fetch origin main --quiet');
          const behind = parseInt(run('git rev-list --count HEAD..origin/main'), 10);

          if (behind === 0) {
            return sock.sendMessage(jid, { text: "✅ You're already on the latest version." }, { quoted: msg });
          }

          const latestMsg = run('git log -1 --format=%s origin/main');
          const latestShortHash = run('git rev-parse --short origin/main');

          return sock.sendMessage(jid, {
            text: `🔄 *Update available!*\n\n` +
                  `You're ${behind} commit${behind === 1 ? '' : 's'} behind.\n` +
                  `Latest: \`${latestShortHash}\` — ${latestMsg}\n\n` +
                  `Run .updatenow to update.`
          }, { quoted: msg });
        } catch (e) {
          return sock.sendMessage(jid, { text: '❌ Failed to check for updates: ' + e.message }, { quoted: msg });
        }
      }

      // --- Heroku (no .git at runtime) ---
      if (isHeroku()) {
        try {
          const result = await checkHerokuUpdate();

          if (result.upToDate) {
            return sock.sendMessage(jid, { text: "✅ You're already on the latest version." }, { quoted: msg });
          }

          return sock.sendMessage(jid, {
            text: `🔄 *Update available!*\n\n` +
                  `You're ${result.behind} commit${result.behind === 1 ? '' : 's'} behind.\n` +
                  `Latest: \`${result.latestShortSha}\` — ${result.latestMsg}\n\n` +
                  `Run .updatenow to update.`
          }, { quoted: msg });
        } catch (e) {
          return sock.sendMessage(jid, { text: '❌ Failed to check for updates: ' + e.message }, { quoted: msg });
        }
      }

      // --- Neither git nor Heroku ---
      return sock.sendMessage(jid, {
        text: "❌ Can't determine update status in this environment."
      }, { quoted: msg });
    }
  },

  {
    name: 'updatenow',
    description: 'Owner-only: update and restart/redeploy the bot. Usage: .updatenow',
    async execute(sock, msg) {
      const jid = msg.key.remoteJid;

      if (!msg.key.fromMe) {
        return sock.sendMessage(jid, { text: '❌ Only the owner can run this.' }, { quoted: msg });
      }

      // --- Real git checkout (Termux / VPS) ---
      if (hasGit()) {
        try {
          run('git fetch origin main --quiet');
          const behind = parseInt(run('git rev-list --count HEAD..origin/main'), 10);

          if (behind === 0) {
            return sock.sendMessage(jid, { text: '✅ Already on the latest version — nothing to update.' }, { quoted: msg });
          }

          await sock.sendMessage(jid, { text: `⏳ Pulling ${behind} commit${behind === 1 ? '' : 's'}...` }, { quoted: msg });

          const beforeHash = run('git rev-parse HEAD');
          run('git pull --ff-only');
          const afterHash = run('git rev-parse HEAD');

          const changedFiles = run(`git diff --name-only ${beforeHash} ${afterHash}`);
          if (changedFiles.split('\n').includes('package.json')) {
            await sock.sendMessage(jid, { text: '📦 package.json changed — installing dependencies (this may take a minute)...' }, { quoted: msg });
            run('npm install --omit=dev', { timeout: 300000 });
          }

          await sock.sendMessage(jid, { text: '✅ Updated. Restarting now — should reconnect in a few seconds.' }, { quoted: msg });

          const child = spawn(process.execPath, [path.join(root, 'index.js')], {
            cwd: root,
            detached: true,
            stdio: 'ignore',
            env: { ...process.env, ISAAC_RESTART_DELAY_MS: '4000' },
          });
          child.unref();

          setTimeout(() => process.exit(0), 1500);
          return;
        } catch (e) {
          return sock.sendMessage(jid, { text: '❌ Update failed: ' + e.message }, { quoted: msg });
        }
      }

      // --- Heroku: trigger a build via the Platform API ---
      if (isHeroku()) {
        const apiKey = process.env.HEROKU_API_KEY;
        const appName = process.env.HEROKU_APP_NAME;

        if (!apiKey || !appName) {
          return sock.sendMessage(jid, {
            text: '❌ HEROKU_API_KEY and/or HEROKU_APP_NAME are not set in this app\'s config vars.\n\n' +
                  'Add both, then try again:\n' +
                  '`heroku config:set HEROKU_API_KEY=<your-api-key> HEROKU_APP_NAME=<your-app-name> -a <your-app-name>`'
          }, { quoted: msg });
        }

        try {
          if (typeof fetch !== 'function') {
            throw new Error('This Node version has no global fetch. Node 18+ is required.');
          }

          await sock.sendMessage(jid, { text: '⏳ Triggering a new Heroku build from GitHub...' }, { quoted: msg });

          const res = await fetch(`https://api.heroku.com/apps/${appName}/builds`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/vnd.heroku+json; version=3',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              source_blob: {
                url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tarball/${GITHUB_BRANCH}`,
              },
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Heroku API returned ${res.status}: ${errText}`);
          }

          const build = await res.json();

          return sock.sendMessage(jid, {
            text: `✅ Build triggered on Heroku (id: \`${build.id}\`).\n\n` +
                  `Heroku will build the latest \`${GITHUB_BRANCH}\` commit and restart the dyno automatically once it's ready. ` +
                  `This usually takes 1–3 minutes — the bot will briefly disconnect and reconnect on its own.\n\n` +
                  `You can watch progress with:\n\`heroku builds:info ${build.id} -a ${appName}\``
          }, { quoted: msg });
        } catch (e) {
          return sock.sendMessage(jid, { text: '❌ Failed to trigger Heroku build: ' + e.message }, { quoted: msg });
        }
      }

      // --- Neither git nor Heroku ---
      return sock.sendMessage(jid, {
        text: "❌ Can't determine how to update in this environment."
      }, { quoted: msg });
    }
  },
];
