export default {
  apps: [
    {
      name: 'food-delivery-backend',
      script: 'server.js',
      instances: 1, // Start with 1 instance, can increase later
      exec_mode: 'fork', // Use fork mode for better compatibility
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Production settings
      max_memory_restart: '1G', // Memory limit
      node_args: '--max-old-space-size=1024', // Node.js memory limit
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto restart
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      // Restart policy
      max_restarts: 10,
      min_uptime: '10s',
      // Monitoring
      monitoring: false,
      // Auto restart on crash
      autorestart: true,
      // Kill timeout
      kill_timeout: 5000,
      // Graceful shutdown
      shutdown_with_message: true
    }
  ]
};


