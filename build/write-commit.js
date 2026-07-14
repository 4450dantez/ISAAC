/**
 * scripts/write-commit.js
 * -------------------------
 * Runs automatically during Heroku's build (via the "heroku-postbuild"
 * script in package.json), while .git is still present in the build
 * directory — before Heroku strips it from the final slug.
 *
 * Captures the current commit hash into a plain file so the running app
 * can know "what commit am I running" at runtime, without needing the
 * `heroku labs:enable runtime-dyno-metadata` opt-in feature (which
 * requires a manual CLI step most deployers will never know to run).
 *
 * Safe no-op on non-Heroku environments or if git isn't available —
 * never fails the build.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_PATH = path.join(__dirname, '..', '.deployed-commit');

try {
  const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  fs.writeFileSync(OUT_PATH, commit);
  console.log(`[write-commit] Recorded deployed commit: ${commit}`);
} catch (e) {
  console.warn('[write-commit] Could not determine git commit at build time — .update on Heroku may not work until the next successful build.', e.message);
}
