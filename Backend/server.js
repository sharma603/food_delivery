import app from './src/app.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Food Delivery Backend Server`);
  console.log('='.repeat(60));
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Server: http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  
  if (process.env.MONGODB_URI) {
    const mongoInfo = process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@');
    console.log(`💾 MongoDB: ${mongoInfo.split('/').pop()?.split('?')[0] || 'Connected'}`);
  }
  
  console.log('='.repeat(60));
  console.log('✅ Server is running and ready to accept requests');
  console.log('='.repeat(60));
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
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      console.log('👋 Server shutdown complete');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
