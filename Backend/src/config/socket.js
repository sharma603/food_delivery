// Socket.io configuration
// This will be initialized in server.js

import { Server as SocketIOServer } from 'socket.io';

let io;

import jwt from 'jsonwebtoken';

const initSocket = (server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userType = decoded.type;
      socket.permissions = decoded.permissions || [];
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.userId} (${socket.userType})`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join user to their role-based room
    socket.join(socket.userType);

    // Handle joining specific order rooms
    socket.on('join', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`User ${socket.userId} joined order room: ${orderId}`);
    });

    // Handle leaving specific order rooms
    socket.on('leave', (orderId) => {
      socket.leave(`order_${orderId}`);
      console.log(`User ${socket.userId} left order room: ${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export { initSocket, getIO };