import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { CarTaxiFront, LogOut, User as UserIcon, Clock } from 'lucide-react';
import Login from './components/Login';
import Profile from './components/Profile';
import History from './components/History';
import { auth, onAuthStateChanged, signOut } from './firebaseConfig';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const rickshawIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

function App() {
  const { isConnected, socket } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState([28.6139, 77.2090]); // Default to center
  const [rideRequest, setRideRequest] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [activePassenger, setActivePassenger] = useState(null);
  const [driverState, setDriverState] = useState('IDLE'); // IDLE, ACCEPTED, ARRIVED, ONGOING
  const [routePolyline, setRoutePolyline] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('map'); // 'map', 'profile', 'history'

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Web Geolocation & Socket emit
  useEffect(() => {
    let watchId;
    if (isOnline && socket && user) {
      const driverId = user.uid;
      socket.emit('DRIVER_ONLINE', { driverId });
      
      watchId = navigator.geolocation.watchPosition(
          (position) => {
              const { latitude, longitude } = position.coords;
              setLocation([latitude, longitude]);
              
              const payload = { driverId, location: [latitude, longitude] };
              if (activeRide) payload.rideId = activeRide._id;

              socket.emit('DRIVER_LOCATION_UPDATE', payload);
          },
          (err) => console.log('Location error:', err),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    
    return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, socket, user]);

  // Socket Listener for incoming rides and errors
  useEffect(() => {
    if (!socket) return;
    
    // Explicit suspension disconnect hook
    const handleSuspended = (data) => {
       alert(data.message || 'Your account is suspended.');
       setIsOnline(false);
    };
    socket.on('SUSPENDED_ERROR', handleSuspended);
    
    if (!isOnline) {
       return () => socket.off('SUSPENDED_ERROR', handleSuspended);
    }
    
    const handleNewRide = (ride) => {
      setRideRequest(ride);
      
      // Auto-expire request off their screen after 25 seconds
      setTimeout(() => {
          setRideRequest((currentReq) => {
              if (currentReq && currentReq.rideId === ride.rideId) return null;
              return currentReq;
          });
      }, 25000);
    };

    socket.on('NEW_RIDE_REQUEST', handleNewRide);
    
    // Listen for mid-ride cancellations or universal state updates
    const handleStatusUpdate = (update) => {
        if (update.ride && update.ride.status === 'CANCELLED') {
             setActiveRide((currentActive) => {
                 if (currentActive && currentActive._id === update.ride._id) {
                     alert("Passenger cancelled the ride.");
                     setDriverState('IDLE');
                     setRoutePolyline([]);
                     return null;
                 }
                 return currentActive;
             });
             setRideRequest((currentReq) => {
                 if (currentReq && (currentReq.rideId === update.ride._id || currentReq._id === update.ride._id)) {
                      return null; // hide modal if looking at it
                 }
                 return currentReq;
             });
        }
    };
    
    socket.on('RIDE_STATUS_UPDATED', handleStatusUpdate);

    return () => {
        socket.off('NEW_RIDE_REQUEST', handleNewRide);
        socket.off('SUSPENDED_ERROR', handleSuspended);
        socket.off('RIDE_STATUS_UPDATED', handleStatusUpdate);
    }
  }, [socket, isOnline]);

  // Dynamic OSRM Routing based on driverState
  useEffect(() => {
    if (!activeRide || !location) return;

    let targetCoords = null;
    if (driverState === 'ACCEPTED') { // En route to pickup
         targetCoords = { lng: activeRide.pickupLocation.coordinates[0], lat: activeRide.pickupLocation.coordinates[1] };
    } else if (driverState === 'ONGOING') { // En route to dropoff
         targetCoords = { lng: activeRide.dropLocation.coordinates[0], lat: activeRide.dropLocation.coordinates[1] };
    } else {
         setRoutePolyline([]);
         return;
    }

    fetch(`https://router.project-osrm.org/route/v1/driving/${location[1]},${location[0]};${targetCoords.lng},${targetCoords.lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
            if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates;
                setRoutePolyline(coords.map(c => [c[1], c[0]]));
            }
        })
        .catch(console.error);

  }, [activeRide, location, driverState]);

  const handleRideStatusUpdate = async (status) => {
     try {
         const res = await fetch(`http://localhost:5000/api/rides/${activeRide._id}/status`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ status })
         });
         const data = await res.json();
         socket.emit('RIDE_STATUS_UPDATED', { ride: data.ride });
         setActiveRide(data.ride);
         setDriverState(status);

         if (status === 'COMPLETED') {
             setActiveRide(null);
             setActivePassenger(null);
             setDriverState('IDLE');
             setRoutePolyline([]);
             alert("Ride marked as Completed! Good Job.");
         }
     } catch (err) {
         console.error(err);
     }
  };

  const acceptRide = async () => {
    try {
        const res = await fetch(`http://localhost:5000/api/rides/${rideRequest.rideId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACCEPTED', driverFirebaseUid: user.uid })
        });
        const data = await res.json();
        
        socket.emit('RIDE_STATUS_UPDATED', {
           ride: data.ride,
           driverInfo: data.driverInfo
        });
        
        setActiveRide(data.ride);
        setActivePassenger(rideRequest);
        setDriverState('ACCEPTED');
        setRideRequest(null);
    } catch(err) {
        console.error(err);
        alert(err.message || "Failed to accept ride.");
        setRideRequest(null);
    }
  };

  const declineRide = () => {
    setRideRequest(null);
  };

  const logout = () => {
      setIsOnline(false);
      signOut(auth);
  };

  if (authLoading) return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  if (!user) {
    return <Login onAuthSuccess={() => console.log('Logged in')} />;
  }

  return (
    <div className="app-container">
      {view === 'profile' && <Profile user={user} onClose={() => setView('map')} />}
      {view === 'history' && <History user={user} onClose={() => setView('map')} />}

      {/* Top Header Layer */}
      <div className="top-header">
        <div className="brand">
          <CarTaxiFront size={28} style={{ color: 'var(--primary)' }} />
          Driver Terminal
          <div style={{ marginLeft: 12, display: 'flex', gap: 16, borderLeft: '1px solid var(--panel-border)', paddingLeft: 16 }}>
            <Clock size={20} onClick={() => setView('history')} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            <UserIcon size={20} onClick={() => setView('profile')} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            <LogOut size={20} onClick={logout} style={{ cursor: 'pointer', color: 'var(--danger)' }} />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 1000 }}>
        <div className="status-pill">
            <span style={{ fontWeight: 900, color: isOnline ? '#fff' : 'var(--text-muted)', letterSpacing: '1px' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            <input 
              type="checkbox" 
              className="toggle-switch"
              checked={isOnline}
              onChange={(e) => setIsOnline(e.target.checked)}
            />
        </div>
      </div>

      {/* Map Layer */}
      <MapContainer key={location.toString()} center={location} zoom={16} className="map-container" zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={location} icon={rickshawIcon}>
            <Popup>You are here</Popup>
        </Marker>
        {routePolyline.length > 0 && <Polyline positions={routePolyline} color="#00df82" weight={6} opacity={0.9} />}
        {activeRide && driverState !== 'ONGOING' && <Marker position={[activeRide.pickupLocation.coordinates[1], activeRide.pickupLocation.coordinates[0]]}><Popup>Pickup</Popup></Marker>}
        {activeRide && driverState === 'ONGOING' && <Marker position={[activeRide.dropLocation.coordinates[1], activeRide.dropLocation.coordinates[0]]}><Popup>Dropoff</Popup></Marker>}
      </MapContainer>

      {/* Ride Request Blast Modal */}
      {rideRequest && !activeRide && (
        <div className="ride-request-modal animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="pulsing-dot" style={{ backgroundColor: 'var(--danger)', animation: 'pulse-green 1s infinite' }}></div>
            <h2 style={{ color: 'var(--danger)' }}>URGENT: Request</h2>
          </div>
          <p style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '500' }}>Passenger is requesting a campus pickup nearby.</p>
          
          <div className="action-buttons">
            <button className="btn-decline-solid" onClick={declineRide}>Decline</button>
            <button className="btn-accept" onClick={acceptRide}>ACCEPT RIDE</button>
          </div>
        </div>
      )}

      {/* Active Ride HUD Overlay */}
      {activeRide && (
         <div className="ride-request-modal active-hud animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'var(--primary)', fontSize: '24px' }}>
                  {driverState === 'ACCEPTED' ? 'Navigating to Pickup' : driverState === 'ARRIVED' ? 'At Pickup' : 'Driving to Destination'}
                </h2>
                <span className="pulsing-dot" style={{ backgroundColor: '#00ff88', animation: 'pulse-green 1.5s infinite' }}></span>
            </div>
            
            <p style={{ color: '#fff', fontSize: '20px', fontWeight: '800' }}>Passenger En Route</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '16px' }}>Follow navigation. Please proceed safely.</p>
            
            <div style={{ display: 'flex', gap: '16px' }}>
                {driverState === 'ACCEPTED' && <button className="btn-primary" onClick={() => handleRideStatusUpdate('ARRIVED')}>Mark Arrived</button>}
                {driverState === 'ARRIVED'  && <button className="btn-primary" onClick={() => handleRideStatusUpdate('ONGOING')}>Start Trip</button>}
                {driverState === 'ONGOING'  && <button className="btn-primary" onClick={() => handleRideStatusUpdate('COMPLETED')}>Complete Trip</button>}
            </div>
         </div>
      )}

    </div>
  );
}

export default App;
