import SERVER_CONFIG from '../config/serverConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Listener = (payload: any) => void;

class SocketService {
  private socket: any | null = null;
  private isEnabled = true;
  private listeners: { [event: string]: Listener[] } = {};

  private getSocketUrl() {
    return `${SERVER_CONFIG.PROTOCOL}://${SERVER_CONFIG.IP}:${SERVER_CONFIG.PORT}`;
  }

  async connect() {
    if (!this.isEnabled || this.socket) return;
    try {
      const { default: io } = await import('socket.io-client');
      const token = await AsyncStorage.getItem('delivery_token');
      
      if (!token) {
        return;
      }

      // Validate token format (basic check)
      if (token.length < 10) {
        return;
      }

      this.socket = io(this.getSocketUrl(), {
        transports: ['websocket'],
        auth: { token }, // Backend expects auth.token, not query.token
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('disconnect', (reason: string) => {
        // If disconnected due to auth error, don't reconnect
        if (reason === 'io server disconnect') {
          this.disconnect();
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        const errorMsg = error.message || '';
        // Handle authentication errors
        if (errorMsg.includes('Authentication error') || errorMsg.includes('Invalid token')) {
          // Disconnect and clear token if authentication fails
          this.disconnect();
          // Don't try to reconnect with invalid token
          this.isEnabled = false;
        }
      });

      // Handle authentication errors from server
      this.socket.on('unauthorized', () => {
        this.disconnect();
        this.isEnabled = false;
      });

      // Wire any pre-registered listeners
      Object.keys(this.listeners).forEach((evt) => {
        this.listeners[evt].forEach((cb) => this.socket?.on(evt, cb));
      });
    } catch (e) {
      // socket.io-client may not be installed; disable silently
      this.isEnabled = false;
    }
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.disconnect(); } catch {}
      this.socket = null;
    }
  }

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    if (this.socket) {
      try { this.socket.on(event, callback); } catch {}
    }
    return () => this.off(event, callback);
  }

  off(event: string, callback: Listener) {
    this.listeners[event] = (this.listeners[event] || []).filter((cb) => cb !== callback);
    if (this.socket) {
      try { this.socket.off(event, callback); } catch {}
    }
  }
}

export const socketService = new SocketService();


