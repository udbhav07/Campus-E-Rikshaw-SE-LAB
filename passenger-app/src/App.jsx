import React, { useState, useEffect } from 'react';
import AppMap from './components/Map';
import { useSocket } from './context/SocketContext';
import { MapPin, Navigation, CarTaxiFront, LogOut, User as UserIcon, Clock } from 'lucide-react';
import Login from './components/Login';
import Profile from './components/Profile';
import History from './components/History';
import { auth, onAuthStateChanged, signOut } from './firebaseConfig';

function App() {
  //change1
  const [pickupText, setPickupText] = useState('');
const [dropoffText, setDropoffText] = useState('');
  const { isConnected, socket } = useSocket();
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [selectingMode, setSelectingMode] = useState('pickup');
  const [rideStatus, setRideStatus] = useState('IDLE'); // IDLE, REQUESTING, ASSIGNED, COMPLETED, RATING
  const [activeRide, setActiveRide] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [ratingInput, setRatingInput] = useState({ rating: 5, feedback: '' });
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('map'); // 'map', 'profile', 'history'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);
  //change2
  useEffect(() => {
  if (pickup) setPickupText("Pickup selected on map");
}, [pickup]);

useEffect(() => {
  if (dropoff) setDropoffText("Destination selected on map");
}, [dropoff]);
  // Registering socket listeners once
  useEffect(() => {
     if (!socket) return;
     socket.on('RIDE_STATUS_UPDATED', (data) => {
         console.log("Passenger received ride update:", data);
         if(data.ride && data.ride.status === 'ACCEPTED') {
            setRideStatus('ASSIGNED');
            setAssignedDriver(data.driverInfo);
            setActiveRide(data.ride); // Update to get DB driverId
         }
         if(data.ride && data.ride.status === 'ARRIVED') {
            // Driver is outside
         }
         if(data.ride && data.ride.status === 'ONGOING') {
            // En route to destination
         }
         if(data.ride && data.ride.status === 'CANCELLED') {
             alert('Ride was cancelled.');
             setRideStatus('IDLE');
             setPickup(null); setDropoff(null); setActiveRide(null); setAssignedDriver(null);
         }
         if(data.ride && data.ride.status === 'COMPLETED') {
            setRideStatus('RATING');
         }
     });
     return () => socket.off('RIDE_STATUS_UPDATED');
  }, [socket]);
  
  const requestRide = async () => {
    if (!pickup || !dropoff) return alert("Select pickup and dropoff on the map!");
    setRideStatus('REQUESTING');
    
    try {
        const res = await fetch('http://localhost:5000/api/rides/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                passengerId: user.uid,
                pickupLocation: { type: 'Point', coordinates: [pickup.lng, pickup.lat] },
                dropLocation: { type: 'Point', coordinates: [dropoff.lng, dropoff.lat] }
            })
        });
        const ride = await res.json();
        setActiveRide(ride);

        // Tell the server to broadcast using the 2km Haversine radar
        socket.emit('REQUEST_RIDE', {
          rideId: ride._id,
          pickup,
          dropoff
        });

        // 3 Minute Timeout (180,000ms)
        setTimeout(() => {
            setRideStatus((currentStatus) => {
                if (currentStatus === 'REQUESTING') {
                    // Auto-cancel if still requesting after 3 mins
                    cancelRideFlow(ride._id);
                    alert("No drivers are currently available. Please try again later.");
                    return 'IDLE';
                }
                return currentStatus;
            });
        }, 180000);

    } catch(err) {
        console.error(err);
        alert("Failed to request ride");
        setRideStatus('IDLE');
    }
  };
  //change3
 const searchLocation = async (query) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
  );
  const data = await res.json();
  return data[0];
};
  const submitRating = async () => {
      try {
          await fetch(`http://localhost:5000/api/rides/${activeRide._id}/rating`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ratingInput)
          });
          setRideStatus('IDLE');
          setPickup(null);
          setDropoff(null);
          setActiveRide(null);
          setAssignedDriver(null);
          alert('Thanks for your feedback!');
      } catch(err) { console.error(err); }
  };

  const cancelRideFlow = async (rideIdToCancel) => {
      try {
          const res = await fetch(`http://localhost:5000/api/rides/${rideIdToCancel}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'CANCELLED' })
          });
          const data = await res.json();
          socket.emit('RIDE_STATUS_UPDATED', { ride: data.ride });
          
          setRideStatus('IDLE');
          setPickup(null); setDropoff(null); setActiveRide(null); setAssignedDriver(null);
      } catch(err) { console.error(err); }
  }

  const cancelRide = () => {
      if (activeRide) {
          cancelRideFlow(activeRide._id);
      } else {
          setRideStatus('IDLE');
      }
  };

  const logout = () => signOut(auth);

  if (authLoading) return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  if (!user) {
    return <Login onAuthSuccess={() => console.log('Logged in!')} />;
  }

  return (
    <div className="app-container">
      {view === 'profile' && <Profile user={user} onClose={() => setView('map')} />}
      {view === 'history' && <History user={user} onClose={() => setView('map')} />}
      
      {/* Top Header Floating Pill Layers */}
      <div className="top-header">
        <div className="brand">
          <CarTaxiFront className="brand-icon" size={24} strokeWidth={2.5} />
          <span>Campus Rides</span>
        </div>
        <div className="connection-status">
          <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <Clock size={18} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setView('history')} />
             <UserIcon size={18} style={{ cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 4 }} onClick={() => setView('profile')} />
             <div style={{ width: '1px', height: '16px', background: 'var(--panel-border)', margin: '0 8px' }}></div>
             <div className="pulsing-dot" style={{ backgroundColor: isConnected ? '#00d2ff' : '#ff0055', boxShadow: isConnected ? '0 0 0 rgba(0, 210, 255, 0.4)' : 'none', animation: isConnected ? 'pulse 2s infinite' : 'none' }}></div>
             <span style={{ fontSize: '14px', fontWeight: '700', color: isConnected ? '#fff' : 'var(--text-muted)' }}>{isConnected ? 'Live' : 'Offline'}</span>
             <LogOut size={16} style={{ marginLeft: '12px', cursor: 'pointer', color: 'var(--danger)' }} onClick={logout} />
          </div>
        </div>
      </div>

      {/* Map Background */}
      <AppMap 
        pickup={pickup} setPickup={setPickup} 
        dropoff={dropoff} setDropoff={setDropoff} 
        selectingMode={selectingMode} 
        activeRide={activeRide}
        assignedDriver={assignedDriver}
      />

      {/* Bottom Booking UI */}
      <div className="booking-card glass-panel">
        
        {rideStatus === 'IDLE' && (
          <div className="animate-fade-in">
            <h2 style={{ marginBottom: '24px', fontSize: '28px', color: '#fff', letterSpacing: '-0.5px' }}>Where to?</h2>
            
            <div 
              className="input-group" 
              style={{ borderColor: selectingMode === 'pickup' ? 'var(--primary)' : 'var(--panel-border)', background: selectingMode === 'pickup' ? 'rgba(0, 210, 255, 0.05)' : '' }}
              onClick={() => setSelectingMode('pickup')}
            >
              <MapPin size={22} color="var(--primary)" />
              {/* change4 */}
              <input
                type="text"
                placeholder="Enter Pickup or tap map"
                value={pickupText}
                onChange={(e) => setPickupText(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const place = await searchLocation(pickupText);
                    if (place) {
                      setPickup({
                        lat: parseFloat(place.lat),
                        lng: parseFloat(place.lon)
                      });
                      setPickupText(place.display_name);
                    }
                  }
                }}
              />
            </div>
            
            <div 
              className="input-group" 
              style={{ borderColor: selectingMode === 'dropoff' ? 'var(--danger)' : 'var(--panel-border)', background: selectingMode === 'dropoff' ? 'rgba(255, 0, 85, 0.05)' : '', marginBottom: '24px' }}
              onClick={() => setSelectingMode('dropoff')}
            >
              <Navigation size={22} color="var(--danger)" />
               {/* change5 */}
              <input
                type="text"
                placeholder="Enter Destination or tap map"
                value={dropoffText}
                onChange={(e) => setDropoffText(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const place = await searchLocation(dropoffText);
                    if (place) {
                      setDropoff({
                        lat: parseFloat(place.lat),
                        lng: parseFloat(place.lon)
                      });
                      setDropoffText(place.display_name);
                    }
                  }
                }}
              />
            </div>

            <button className="btn-primary" onClick={requestRide}>
              Request E-Rickshaw
            </button>
          </div>
        )}

        {rideStatus === 'REQUESTING' && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '24px 12px' }}>
             <div className="pulsing-dot" style={{ margin: '0 auto 24px auto', width: '32px', height: '32px' }}></div>
             <h3 style={{ fontSize: '22px', fontWeight: '800' }}>Locating E-Rickshaws...</h3>
             <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '32px', fontSize: '16px' }}>Broadcasting request to nearby drivers on campus</p>
             <button className="btn-decline" onClick={cancelRide}>
                Cancel Request
             </button>
          </div>
        )}

        {rideStatus === 'ASSIGNED' && assignedDriver && (
          <div className="animate-fade-in" style={{ padding: '12px 0' }}>
             <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span className="pulsing-dot" style={{width: 10, height: 10}}></span> Driver En Route!
             </h3>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--secondary-bg)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #00d2ff, #3a86ff)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                  {assignedDriver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '20px', fontWeight: '700' }}>{assignedDriver.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>Vehicle: <span style={{color: '#fff'}}>{assignedDriver.vehicle}</span></p>
                </div>
             </div>
             <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px' }}>Sit tight. Your driver will mark the ride complete upon arrival.</p>
             <button className="btn-decline" style={{ marginTop: '24px' }} onClick={cancelRide}>
                Cancel Trip
             </button>
          </div>
        )}

        {rideStatus === 'RATING' && (
           <div className="animate-fade-in" style={{ textAlign: 'center', padding: '16px 0' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '12px', fontSize: '28px' }}>You have arrived!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '16px' }}>How was your trip with {assignedDriver?.name}?</p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px' }}>
                  {[1,2,3,4,5].map(star => (
                      <span key={star} onClick={() => setRatingInput({...ratingInput, rating: star})} style={{ fontSize: '40px', cursor: 'pointer', color: star <= ratingInput.rating ? '#ffcc00' : 'var(--panel-border)', textShadow: star <= ratingInput.rating ? '0 0 16px rgba(255, 204, 0, 0.4)' : 'none', transition: 'all 0.2s' }}>
                         ★
                      </span>
                  ))}
              </div>
              <div className="input-group" style={{ marginBottom: '24px' }}>
                  <input 
                    type="text" 
                    placeholder="Leave a comment (optional)" 
                    value={ratingInput.feedback} 
                    onChange={e => setRatingInput({...ratingInput, feedback: e.target.value})}
                  />
              </div>
              <button className="btn-primary" onClick={submitRating}>Submit Feedback</button>
           </div>
        )}

      </div>
    </div>
  );
}

export default App;