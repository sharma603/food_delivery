#!/usr/bin/env node

// Enhanced startup script for the backend
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Food Delivery Backend...\n');

// Run health check first
console.log('Running health check...');
const healthCheck = spawn('node', ['scripts/health-check.js'], {
  cwd: __dirname + '/..',
  stdio: 'inherit'
});

healthCheck.on('close', (code) => {
  if (code === 0) {
    console.log('\n✓ Health check passed. Starting server...\n');
    
    // Start the actual server
    const server = spawn('node', ['server.js'], {
      cwd: __dirname + '/..',
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });
    
    server.on('close', (code) => {
      console.log(`\nServer exited with code ${code}`);
      if (code !== 0) {
        console.log('✗ Server crashed. Check logs for details.');
        process.exit(code);
      }
    });
    
    server.on('error', (error) => {
      console.error('✗ Failed to start server:', error);
      process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT. Shutting down gracefully...');
      server.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM. Shutting down gracefully...');
      server.kill('SIGTERM');
    });
    
  } else {
    console.log('\n✗ Health check failed. Please fix the issues above.');
    process.exit(1);
  }
});

healthCheck.on('error', (error) => {
  console.error('✗ Failed to run health check:', error);
  process.exit(1);
});
