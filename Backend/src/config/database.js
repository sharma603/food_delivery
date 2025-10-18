import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery';
    console.log('MongoDB URI:', mongoUri ? 'Configured' : 'Not configured');

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      heartbeatFrequencyMS: 2000,
      connectTimeoutMS: 10000,
      // Proper buffering configuration
      bufferCommands: true,
      // Retry configuration
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
      // Don't exit - let the application continue with degraded functionality
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn(' MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log(' MongoDB reconnected successfully');
    });
    
    mongoose.connection.on('connected', () => {
      console.log(' MongoDB connection established');
    });
    
  } catch (error) {
    console.error('❌ MongoDB initial connection error:', error.message);
    console.warn('⚠️  Server will continue running without database connection. Please check MongoDB status.');
    console.log('💡 Make sure MongoDB is running: mongod --version');
    // Don't exit - let the application start and handle database errors gracefully
  }
};

export default connectDB;