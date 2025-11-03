/**
 * Production Server Startup Script
 * Clean production startup - loads environment and starts server
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure production mode
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Start the server
import '../../server.js';

