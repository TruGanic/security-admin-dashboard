/** @type { import('pm2').StartOptions } */
module.exports = {
  apps: [
    {
      name: 'dashboard-backend',
      cwd: './backend',
      script: 'dist/server.js',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      env: { NODE_ENV: 'production' },
      autorestart: true,
      watch: false,
    },
    {
      name: 'dashboard-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      interpreter: 'none',
      autorestart: true,
      watch: false,
    },
  ],
};
