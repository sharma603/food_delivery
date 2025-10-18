import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.eventListeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.isConnecting = false;
  }

  connect(url, token) {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      // Convert WebSocket URL to Socket.IO URL
      const socketUrl = url.replace('ws://', 'http://').replace('wss://', 'https://');
      
      this.socket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      
      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnecting = false;
        this.emit('disconnected');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.connect(url, token);
          }, this.reconnectInterval);
        } else {
          console.error('Max reconnection attempts reached');
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      });

      // Handle custom events
      this.socket.onAny((eventName, ...args) => {
        console.log('Socket.IO event received:', eventName, args);
        
        if (this.eventListeners[eventName]) {
          this.eventListeners[eventName].forEach(callback => {
            try {
              callback(...args);
            } catch (error) {
              console.error('Error in Socket.IO event listener:', error);
            }
          });
        }
      });

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners = {};
    this.reconnectAttempts = 0;
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    
    // Also register with Socket.IO
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
    
    // Also unregister from Socket.IO
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  send(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket.IO is not connected');
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  getReadyState() {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;