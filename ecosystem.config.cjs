const path = require("path");

const root = __dirname;

/**
 * PM2 process definitions for VScanMail (backend API + frontend UI).
 *
 * Goals: run continuously (auto-restart on crash, restart on memory bloat,
 * survive transient errors) and come back automatically after a server reboot
 * (see `pm2 save` + `pm2 startup` in scripts/setup-pm2.ps1 / docs).
 *
 * Both apps must be built first: `npm run build` (root) and `npm run build`
 * inside `frontend/`.
 *
 * NOTE: we launch Next.js's own binary with `node` rather than `npm run start`.
 * On Windows + recent Node, PM2 spawning `npm`/`npm.cmd` fails with
 * `spawn EINVAL`; running the JS entrypoint under `node` avoids that entirely.
 * Each app's `cwd` makes the relative `node_modules/next/...` path resolve to
 * that app's own Next version (backend 15.x, frontend 16.x).
 */
const nextBin = path.join("node_modules", "next", "dist", "bin", "next");

const common = {
  interpreter: "node",
  autorestart: true,
  // Exponential backoff so a crash-looping app retries forever without hammering.
  exp_backoff_restart_delay: 200,
  // Don't count a start as "stable" until it has stayed up this long.
  min_uptime: "30s",
  // Next.js start can take a few seconds to bind the port.
  listen_timeout: 30000,
  kill_timeout: 10000,
  // Timestamped, merged logs.
  time: true,
  merge_logs: true,
  windowsHide: true,
};

module.exports = {
  apps: [
    {
      ...common,
      name: "vscanmail-api",
      cwd: root,
      script: nextBin,
      args: "start -p 3010",
      // Restart before the 4GB heap cap turns into a hard OOM crash.
      max_memory_restart: "3G",
      out_file: path.join(root, "logs", "api-out.log"),
      error_file: path.join(root, "logs", "api-error.log"),
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=4096",
      },
    },
    {
      ...common,
      name: "vscanmail-ui",
      cwd: path.join(root, "frontend"),
      script: nextBin,
      args: "start -H 0.0.0.0 -p 3001",
      max_memory_restart: "1G",
      out_file: path.join(root, "logs", "ui-out.log"),
      error_file: path.join(root, "logs", "ui-error.log"),
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
