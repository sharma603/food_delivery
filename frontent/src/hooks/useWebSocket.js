// useWebSocket Hook
// This file structure created as per requested organization
import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(0);
  const messageHistory = useRef([]);

  useEffect(() => {
    const ws = new WebSocket(url);
    setSocket(ws);

    ws.onopen = () => setReadyState(1);
    ws.onclose = () => setReadyState(3);
    ws.onerror = () => setReadyState(3);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      messageHistory.current.push(message);
      setLastMessage(message);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message) => {
    if (socket && readyState === 1) {
      socket.send(JSON.stringify(message));
    }
  };

  return {
    socket,
    lastMessage,
    readyState,
    sendMessage,
    messageHistory: messageHistory.current,
  };
};

export default useWebSocket;
