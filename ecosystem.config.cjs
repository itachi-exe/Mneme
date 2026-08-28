module.exports = {
  apps: [
    {
      name: "mneme-api",
      cwd: "/root/Mneme/apps/api",
      script: "/root/Mneme/node_modules/.bin/tsx",
      args: "src/index.ts",
      env: { NODE_ENV: "production" },
    },
    {
      name: "mneme-web",
      cwd: "/root/Mneme/apps/web",
      script: "/root/Mneme/node_modules/.bin/vite",
      args: "preview --host 0.0.0.0 --port 3010",
      env: { NODE_ENV: "production" },
    },
  ],
};
