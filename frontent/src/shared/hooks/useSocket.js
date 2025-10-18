import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (namespace = '', options = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const url = process.env.REACT_APP_SOCKET_URL || 'http://72.60.206.253:5000';
    const socket = io(`${url}${namespace}`, { autoConnect: true, transports: ['websocket'], ...options });
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [namespace]);

  return socketRef;
};

export default useSocket;


