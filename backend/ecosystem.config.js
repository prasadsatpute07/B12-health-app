// PM2 Ecosystem Config — B12 Health Tracker Backend
// Run: pm2 start ecosystem.config.js
// Startup: pm2 save && pm2 startup

module.exports = {
  apps: [
    // ─── Python FastAPI Scoring Service ──────────────────────
    {
      name: 'b12-python-api',
      script: 'uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000',
      cwd: 'D:\\B12\\backend-v2\\python-service',
      interpreter: 'python',
      interpreter_args: '-m',
      // Restart automatically if it crashes
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      // Wait for Python service to be ready before Node starts
      wait_ready: true,
      listen_timeout: 15000,
      // Restart delay on crash (0.5s, 1s, 2s, 4s...)
      exp_backoff_restart_delay: 500,
      // Log files (persistent across restarts)
      out_file: 'D:\\B12\\backend-v2\\logs\\python-api-out.log',
      error_file: 'D:\\B12\\backend-v2\\logs\\python-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        DATABASE_URL: 'postgresql://b12user:B12Health@localhost:5432/b12db',
        FASTAPI_PORT: '8000',
      },
    },

    // ─── Node.js Express API Gateway ─────────────────────────
    {
      name: 'b12-node-api',
      script: 'server.js',
      cwd: 'D:\\B12\\backend-v2\\node-service',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      exp_backoff_restart_delay: 500,
      out_file: 'D:\\B12\\backend-v2\\logs\\node-api-out.log',
      error_file: 'D:\\B12\\backend-v2\\logs\\node-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        NODE_PORT: '3000',
        DATABASE_URL: 'postgresql://b12user:B12Health@localhost:5432/b12db',
        JWT_SECRET: 'B12HealthSecretKey2026ChangeMeInProduction',
        JWT_EXPIRES_IN: '7d',
        FASTAPI_URL: 'http://localhost:8000',
        ENABLE_MONGODB: 'false',
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX: '100',
      },
    },
  ],
};
