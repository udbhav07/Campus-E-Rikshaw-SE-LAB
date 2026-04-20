import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useOutletContext } from 'react-router-dom';

const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// A localized component to fetch and render dynamic road routes using OSRM, mimicking exactly what drivers see.
function RealtimePolyline({ startLoc, endLoc, color }) {
    const [route, setRoute] = useState([]);
    
    useEffect(() => {
        if (!startLoc || !endLoc) return;
        fetch(`https://router.project-osrm.org/route/v1/driving/${startLoc[1]},${startLoc[0]};${endLoc[1]},${endLoc[0]}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
                if (data.routes && data.routes[0]) {
                    const coords = data.routes[0].geometry.coordinates;
                    setRoute(coords.map(c => [c[1], c[0]]));
                }
            })
            .catch(console.error);
    }, [startLoc, endLoc]);

    if (route.length === 0) {
        // Fallback to straight line while loading
        return <Polyline positions={[startLoc, endLoc]} color={color} weight={5} dashArray="10, 10" opacity={0.5} />;
    }
    
    return <Polyline positions={route} color={color} weight={6} opacity={0.9} />;
}

export default function DashboardMap() {
  // Use context passed from App.jsx socket setup
  const { drivers } = useOutletContext(); 
  const [activeRides, setActiveRides] = useState([]);

  useEffect(() => {
     const fetchActive = () => {
         fetch('http://localhost:5000/api/rides/active')
            .then(res => res.json())
            .then(data => setActiveRides(data))
            .catch(console.error);
     };
     fetchActive();
     const intv = setInterval(fetchActive, 5000);
     return () => clearInterval(intv);
  }, []);

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <span style={{ color: 'var(--text-muted)' }}>Active Drivers Online</span>
          <span className="stat-value">{Object.keys(drivers).length}</span>
        </div>
        <div className="stat-card">
          <span style={{ color: 'var(--text-muted)' }}>Map Center</span>
          <span className="stat-value" style={{ fontSize: '20px' }}>University Campus</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, marginTop: '20px' }}>
        <MapContainer center={[28.6139, 77.2090]} zoom={14} className="map-container" zoomControl={false} style={{ flex: 1, height: '100%', borderRadius: '16px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {Object.entries(drivers).map(([id, loc]) => {
              const activeRideForDriver = activeRides.find(r => r.driverId && r.driverId.firebaseUid === id || r.driverId && r.driverId._id === id); 
              
              return (
                <Marker key={id} position={loc} icon={driverIcon}>
                    <Popup>
                      <div style={{ color: '#000' }}>
                        <strong>Driver ID:</strong> {id.substring(0,6)} <br/>
                        <strong>Status:</strong> {activeRideForDriver ? activeRideForDriver.status : 'Idle'}
                      </div>
                    </Popup>
                </Marker>
              );
          })}

          {/* Draw Polylines for Active Rides from driver to destination */}
          {activeRides.map(ride => {
               if (!ride.driverId) return null;
               
               if (ride.status === 'ONGOING') {
                   const matchingId = Object.keys(drivers).find(driverIdString => ride.driverId._id === driverIdString || ride.driverId.firebaseUid === driverIdString);
                   const driverLoc = drivers[matchingId];
                   if (driverLoc && ride.dropLocation) {
                       return <RealtimePolyline key={`poly_ongo_${ride._id}`} startLoc={driverLoc} endLoc={[ride.dropLocation.coordinates[1], ride.dropLocation.coordinates[0]]} color="#ff4757" />;
                   }
               }
               if (ride.status === 'ACCEPTED' || ride.status === 'ARRIVED') {
                   const matchingId = Object.keys(drivers).find(driverIdString => ride.driverId._id === driverIdString || ride.driverId.firebaseUid === driverIdString);
                   const driverLoc = drivers[matchingId];
                   if (driverLoc && ride.pickupLocation) {
                       return <RealtimePolyline key={`poly_acc_${ride._id}`} startLoc={driverLoc} endLoc={[ride.pickupLocation.coordinates[1], ride.pickupLocation.coordinates[0]]} color="#00df82" />;
                   }
               }
               return null;
          })}
        </MapContainer>
        
        {/* Live Trips Text Panel */}
        <div style={{ width: '350px', backgroundColor: 'var(--panel-bg)', borderRadius: '16px', padding: '20px', border: '1px solid var(--panel-border)', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Active Fleet Trips</h3>
            
            {activeRides.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active rides inside campus.</p>}

            {[...activeRides]
              .sort((a, b) => {
                  const statusPriority = { 'REQUESTED': 1, 'ACCEPTED': 2, 'ARRIVED': 3, 'ONGOING': 4, 'COMPLETED': 5, 'CANCELLED': 6 };
                  return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
              })
              .map(ride => (
                <div key={ride._id} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `4px solid ${ride.status === 'ACCEPTED' || ride.status === 'REQUESTED' ? '#00df82' : ride.status === 'COMPLETED' ? 'gray' : ride.status === 'CANCELLED' ? 'red' : '#ff4757'}` }}>
                   <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Tracking #{ride._id.substring(0, 6)}</p>
                   
                   <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>Driver:</span>
                      <span>{ride.driverId ? ride.driverId.name : 'Unassigned'}</span>
                      
                      <span style={{ fontWeight: 'bold' }}>Status:</span>
                      <span style={{ color: ['ACCEPTED', 'REQUESTED', 'ARRIVED'].includes(ride.status) ? '#00df82' : ride.status === 'ONGOING' ? '#ff4757' : ride.status === 'COMPLETED' ? '#bdc3c7' : '#e84118' }}>{ride.status}</span>
                      
                      <span style={{ fontWeight: 'bold' }}>Target:</span>
                      <span>{['ACCEPTED', 'REQUESTED', 'ARRIVED'].includes(ride.status) ? 'Pickup' : ride.status === 'ONGOING' ? 'Dropoff' : '--'}</span>
                   </div>
                </div>
            ))}
        </div>
      </div>
    </>
  );
}
