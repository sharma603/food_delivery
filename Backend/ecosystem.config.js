module.exports = {
  apps: [
    {
      name: 'food-delivery-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Production settings
      max_memory_restart: '2G', // Increased memory limit
      node_args: '--max-old-space-size=2048', // Increased Node.js memory limit
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Auto restart
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      // Restart policy
      max_restarts: 10,
      min_uptime: '30s', // Increased minimum uptime before restart
      // Monitoring
      monitoring: false,
      // Health check
      health_check_grace_period: 5000, // Increased grace period
      // Auto restart on crash
      autorestart: true,
      // Kill timeout
      kill_timeout: 5000,
      // Wait for ready
      wait_ready: true,
      // Listen timeout
      listen_timeout: 10000
    }
  ]
};


