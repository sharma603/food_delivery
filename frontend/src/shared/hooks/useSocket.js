import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import AppConfig from '../../config/appConfig';

export const useSocket = (namespace = '', options = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const url = AppConfig.API.BACKEND_BASE_URL;
    const socket = io(`${url}${namespace}`, { autoConnect: true, transports: ['websocket'], ...options });
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [namespace]);

  return socketRef;
};

export default useSocket;


