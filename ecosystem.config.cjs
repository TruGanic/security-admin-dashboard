/** @type { import('pm2').StartOptions } */
module.exports = {
  apps: [
    {
      name: 'dashboard-backend',
      cwd: './backend',
      script: 'dist/server.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' },
      instances: 1,
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
