import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setConnected] = useState(false);

  useEffect(() => {
    // You should replace localhost with your machine's local IP address (e.g. 192.168.1.5) 
    // when running on a physical Android/iOS phone so it can hit the dev machine's backend.
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Driver connected to Socket Server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
