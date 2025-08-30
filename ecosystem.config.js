/**
 * PM2 Ecosystem Configuration File
 * Astral Core Mental Health Platform
 * Production Deployment Management
 * Configured by Agent Delta
 */

module.exports = {
  apps: [
    {
      // Main Application Server
      name: 'astralcore-app',
      script: './server-http.js',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '2G',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        HOST: '0.0.0.0',
        VITE_APP_ENV: 'production'
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: process.env.PORT || 3001,
        HOST: '0.0.0.0',
        VITE_APP_ENV: 'staging'
      },
      
      // Logging configuration
      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      log_file: './logs/pm2/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced PM2 features
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
      
      // Node.js optimization
      node_args: '--max-old-space-size=4096 --optimize-for-size',
      
      // Source map support
      source_map_support: true,
      disable_source_map_support: process.env.NODE_ENV === 'production'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'production.astralcore.health',
      ref: 'origin/master',
      repo: 'git@github.com:astralcore/mental-health-platform.git',
      path: '/var/www/astralcore',
      'pre-deploy': 'git fetch --all',
      'post-deploy': 'npm ci --production && npm run build:production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/astralcore/logs/pm2',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'deploy',
      host: 'staging.astralcore.health',
      ref: 'origin/staging',
      repo: 'git@github.com:astralcore/mental-health-platform.git',
      path: '/var/www/astralcore-staging',
      'post-deploy': 'npm ci && npm run build:staging && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};