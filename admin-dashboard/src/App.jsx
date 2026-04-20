import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import Layout from './Layout';
import DashboardMap from './DashboardMap';
import Analytics from './Analytics';
import Drivers from './Drivers';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [drivers, setDrivers] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('DRIVER_LOCATION_UPDATE', (data) => {
      setDrivers(prev => ({
        ...prev,
        [data.driverId]: data.location
      }));
    });

    return () => newSocket.close();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Pass socket context via Layout state */}
        <Route path="/" element={<Layout isConnected={isConnected} drivers={drivers} />}>
          <Route index element={<DashboardMap />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="suspensions" element={<Drivers suspensionsOnly={true} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
