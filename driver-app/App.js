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
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>Driver Status: {isConnected ? 'Connected' : 'Offline'}</Text>
          <TouchableOpacity onPress={handleLogout}><Text style={{ color: '#ff4757', marginTop: 4 }}>Logout</Text></TouchableOpacity>
        </View>
        <View style={styles.toggleContainer}>
          <Text style={{ marginRight: 10, color: '#fff', fontWeight: 'bold' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#767577', true: '#00df82' }}
            thumbColor={isOnline ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Map Segment */}
      {location ? (
        <NativeMap location={location} style={styles.map} routePolyline={routePolyline} activeRide={activeRide} driverState={driverState} />
      ) : (
        <View style={styles.mapLoading}>
           <Text>Acquiring GPS...</Text>
        </View>
      )}

      {/* Ride Request Modal Overlay */}
      {rideRequest && !activeRide && (
        <View style={styles.requestCard}>
          <Text style={styles.requestTitle}>🚨 New Ride Request!</Text>
          <Text style={{marginBottom: 10}}>Passenger is requesting a campus pickup.</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={declineRide}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>DECLINE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={acceptRide}>
              <Text style={{color: '#000', fontWeight: 'bold'}}>ACCEPT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Active Ride HUD */}
      {activeRide && (
         <View style={[styles.requestCard, { borderColor: '#00df82', borderWidth: 2 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
               <Text style={styles.requestTitle}>
                 {driverState === 'ACCEPTED' ? 'Navigating to Pickup' : driverState === 'ARRIVED' ? 'At Pickup' : 'Driving to Destination'}
               </Text>
            </View>
            <Text style={{color: '#333'}}>Please proceed safely.</Text>
            
            <View style={styles.buttonRow}>
               {driverState === 'ACCEPTED' && (
                 <TouchableOpacity style={[styles.acceptBtn, {flex: 1}]} onPress={() => handleRideStatusUpdate('ARRIVED')}>
                   <Text style={{color: '#000', fontWeight: 'bold'}}>I Have Arrived</Text>
                 </TouchableOpacity>
               )}
               {driverState === 'ARRIVED' && (
                 <TouchableOpacity style={[styles.acceptBtn, {flex: 1}]} onPress={() => handleRideStatusUpdate('ONGOING')}>
                   <Text style={{color: '#000', fontWeight: 'bold'}}>Start Trip</Text>
                 </TouchableOpacity>
               )}
               {driverState === 'ONGOING' && (
                 <TouchableOpacity style={[styles.acceptBtn, {flex: 1}]} onPress={() => handleRideStatusUpdate('COMPLETED')}>
                   <Text style={{color: '#000', fontWeight: 'bold'}}>Complete Trip</Text>
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
    backgroundColor: '#0f1115',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#191c24',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCard: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  requestTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    color: '#ff4757',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  declineBtn: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#00df82',
    padding: 15,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
});
