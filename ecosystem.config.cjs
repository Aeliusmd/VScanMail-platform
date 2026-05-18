const path = require("path");

const root = __dirname;

module.exports = {
  apps: [
    {
      name: "vscanmail-api",
      cwd: root,
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=4096",
      },
    },
    {
      name: "vscanmail-ui",
      cwd: path.join(root, "frontend"),
      script: "npm",
      args: "run start -- -p 3001 -H 0.0.0.0",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
