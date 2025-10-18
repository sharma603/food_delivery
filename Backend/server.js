import app from './src/app.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Food Delivery Backend Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📍 Nepal Address API: http://localhost:${PORT}/api/v1/address/provinces`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /api/v1/address/provinces`);
  console.log(`   GET /api/v1/address/districts/:province`);
  console.log(`   GET /api/v1/address/municipalities/:province/:district`);
  console.log(`   GET /api/v1/address/validate/:province/:district/:municipality`);
  console.log(`   GET /api/v1/address/statistics`);
  console.log(`   GET /api/v1/address/data`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
