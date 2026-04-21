import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, Alert, TouchableOpacity } from 'react-native';
import NativeMap from './NativeMap';
import * as Location from 'expo-location';
import { SocketProvider, useSocket } from './src/SocketContext';
import Login from './src/Login';
import { auth, onAuthStateChanged, signOut } from './firebaseConfig';

function DriverDashboard({ user }) {
  const { socket, isConnected } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [rideRequest, setRideRequest] = useState(null);
  
  const [activeRide, setActiveRide] = useState(null);
  const [driverState, setDriverState] = useState('IDLE');
  const [routePolyline, setRoutePolyline] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // Listen for ride requests and system errors
  useEffect(() => {
    if (!socket) return;
    
    const handleSuspended = (data) => {
       Alert.alert("Account Suspended", data.message || 'Your account is suspended.');
       setIsOnline(false);
    };
    socket.on('SUSPENDED_ERROR', handleSuspended);
    
    // Explicitly define handleNewRide to be clean
    const handleNewRide = (ride) => {
      if (isOnline && !activeRide) {
        setRideRequest(ride);
        
        setTimeout(() => {
           setRideRequest((currentReq) => {
              if (currentReq && (currentReq.rideId === ride.rideId || currentReq._id === ride._id)) return null;
              return currentReq;
           });
        }, 25000);
      }
    };
    
    socket.on('NEW_RIDE_REQUEST', handleNewRide);

    // Listen for cancellations
    const handleStatusUpdate = (update) => {
        if (update.ride && update.ride.status === 'CANCELLED') {
             setActiveRide((currentActive) => {
                 if (currentActive && currentActive._id === update.ride._id) {
                     Alert.alert("Ride Cancelled", "Passenger cancelled the ride.");
                     setDriverState('IDLE');
                     setRoutePolyline([]);
                     return null;
                 }
                 return currentActive;
             });
             setRideRequest((currentReq) => {
                 if (currentReq && (currentReq.rideId === update.ride._id || currentReq._id === update.ride._id)) {
                      return null; 
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
  }, [socket, isOnline, activeRide]);

  // Continuously broadcast location if online
  useEffect(() => {
    let interval;
    if (isOnline && socket && location) {
      // Announce we are online
      socket.emit('DRIVER_ONLINE', { driverId: user.uid });
      
      interval = setInterval(() => {
        const payload = { driverId: user.uid, location: [location.latitude, location.longitude] };
        if (activeRide) payload.rideId = activeRide._id;

        socket.emit('DRIVER_LOCATION_UPDATE', payload);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isOnline, socket, location]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const declineRide = () => {
    setRideRequest(null);
  };

  // Dynamic OSRM Routing based on driverState
  useEffect(() => {
    if (!activeRide || !location) return;

    let targetCoords = null;
    if (driverState === 'ACCEPTED') {
         targetCoords = { lng: activeRide.pickupLocation.coordinates[0], lat: activeRide.pickupLocation.coordinates[1] };
    } else if (driverState === 'ONGOING') {
         targetCoords = { lng: activeRide.dropLocation.coordinates[0], lat: activeRide.dropLocation.coordinates[1] };
    } else {
         setRoutePolyline([]);
         return;
    }

    fetch(`https://router.project-osrm.org/route/v1/driving/${location.longitude},${location.latitude};${targetCoords.lng},${targetCoords.lat}?overview=full&geometries=geojson`)
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
         const res = await fetch(`http://10.0.2.2:5000/api/rides/${activeRide._id}/status`, {
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
             setDriverState('IDLE');
             setRoutePolyline([]);
             Alert.alert("Success", "Ride marked as Completed! Good Job.");
         }
     } catch (err) {
         console.error(err);
     }
  };

  const acceptRide = async () => {
    try {
        const res = await fetch(`http://10.0.2.2:5000/api/rides/${rideRequest.rideId || rideRequest._id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACCEPTED', driverFirebaseUid: user.uid })
        });
        
        if (res.status === 403) {
            Alert.alert("Access Denied", "Your driver account is suspended.");
            setIsOnline(false);
            setRideRequest(null);
            return;
        }
        
        const data = await res.json();
        socket.emit('RIDE_STATUS_UPDATED', {
           ride: data.ride,
           driverInfo: data.driverInfo
        });
        
        setActiveRide(data.ride);
        setDriverState('ACCEPTED');
        setRideRequest(null);
    } catch(err) {
        console.error(err);
        Alert.alert("Error", "Failed to accept ride.");
        setRideRequest(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Segment - Placed at base layer */}
      {location ? (
        <NativeMap location={location} style={styles.map} routePolyline={routePolyline} activeRide={activeRide} driverState={driverState} />
      ) : (
        <View style={styles.mapLoading}>
           <Text style={{ color: '#8b9bb4', fontWeight: 'bold' }}>Acquiring GPS Signal...</Text>
        </View>
      )}

      {/* Floating Header bar */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text style={styles.headerText}>Terminal <Text style={{ color: isConnected ? '#00ff88' : '#ff0055' }}>•</Text></Text>
          <TouchableOpacity onPress={handleLogout}><Text style={{ color: '#ff0055', marginTop: 4, fontWeight: '700' }}>DISCONNECT</Text></TouchableOpacity>
        </View>
        <View style={styles.toggleContainer}>
          <Text style={{ marginRight: 10, color: '#fff', fontWeight: '900', letterSpacing: 1 }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#00ff88' }}
            thumbColor={isOnline ? '#000000' : '#8b9bb4'}
          />
        </View>
      </View>

      {/* Ride Request Blast Modal */}
      {rideRequest && !activeRide && (
        <View style={[styles.requestCard, { borderColor: 'rgba(255,0,85,0.4)' }]}>
          <Text style={styles.requestTitle}>URGENT: Request</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 20 }}>Passenger is requesting a campus pickup nearby.</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={declineRide}>
              <Text style={{color: '#fff', fontWeight: '900', fontSize: 16}}>DECLINE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={acceptRide}>
              <Text style={{color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5}}>ACCEPT RIDE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Active Ride HUD Overlay */}
      {activeRide && (
         <View style={[styles.requestCard, { borderColor: '#00ff88', borderWidth: 2 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
               <Text style={[styles.requestTitle, { color: '#00ff88', marginBottom: 0 }]}>
                 {driverState === 'ACCEPTED' ? 'Navigating to Pickup' : driverState === 'ARRIVED' ? 'At Pickup' : 'Driving to Destination'}
               </Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Passenger En Route</Text>
            <Text style={{ color: '#8b9bb4', fontSize: 16, marginBottom: 25, marginTop: 5 }}>Follow navigation. Please proceed safely.</Text>
            
            <View style={styles.buttonRow}>
               {driverState === 'ACCEPTED' && (
                 <TouchableOpacity style={[styles.acceptBtn, {flex: 1}]} onPress={() => handleRideStatusUpdate('ARRIVED')}>
                   <Text style={{color: '#000', fontWeight: '900', fontSize: 16}}>Mark Arrived</Text>
                 </TouchableOpacity>
               )}
               {driverState === 'ARRIVED' && (
                 <TouchableOpacity style={[styles.acceptBtn, {flex: 1}]} onPress={() => handleRideStatusUpdate('ONGOING')}>
                   <Text style={{color: '#000', fontWeight: '900', fontSize: 16}}>Start Trip</Text>
                 </TouchableOpacity>
               )}
               {driverState === 'ONGOING' && (
                 <TouchableOpacity style={[styles.acceptBtn, {flex: 1}]} onPress={() => handleRideStatusUpdate('COMPLETED')}>
                   <Text style={{color: '#000', fontWeight: '900', fontSize: 16}}>Complete Trip</Text>
                 </TouchableOpacity>
               )}
            </View>
         </View>
      )}
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) return <View style={styles.container}><Text style={{color:'white', marginTop:100, textAlign:'center'}}>Loading...</Text></View>;

  if (!user) {
    return <Login onAuthSuccess={() => console.log('Logged in')} />;
  }

  return (
    <SocketProvider>
      <DriverDashboard user={user} />
    </SocketProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(22, 27, 34, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  headerBrand: {
    flexDirection: 'column'
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117'
  },
  requestCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(22, 27, 34, 0.98)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  requestTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
    color: '#ff0055',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  declineBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 18,
    borderRadius: 16,
    flex: 0.48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  acceptBtn: {
    backgroundColor: '#00ff88',
    padding: 18,
    borderRadius: 16,
    flex: 0.48,
    alignItems: 'center',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
});

