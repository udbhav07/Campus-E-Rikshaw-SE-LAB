import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../context/SocketContext';

// Custom icons
const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Component to handle map clicks for pickup/dropoff
function LocationMarker({ pickup, setPickup, dropoff, setDropoff, selectingMode }) {
    useMapEvents({
        click(e) {
            if (selectingMode === 'pickup') {
                setPickup(e.latlng);
            } else if (selectingMode === 'dropoff') {
                setDropoff(e.latlng);
            }
        },
    });

    return (
        <React.Fragment>
            {pickup && <Marker position={pickup} icon={customIcon}><Popup>Pickup Location</Popup></Marker>}
            {dropoff && <Marker position={dropoff} icon={customIcon}><Popup>Dropoff Location</Popup></Marker>}
        </React.Fragment>
    );
}

export default function AppMap({ pickup, setPickup, dropoff, setDropoff, selectingMode, activeRide, assignedDriver }) {
    // Default campus coordinates (example: generic center)
    const [center] = useState([28.6139, 77.2090]); 
    const { socket } = useSocket();
    const [drivers, setDrivers] = useState({});

    // Listen to real-time driver locations
    useEffect(() => {
        if (!socket) return;
        socket.on('DRIVER_LOCATION_UPDATE', (data) => {
            setDrivers(prev => ({
                ...prev,
                [data.driverId]: data.location // { lat, lng }
            }));
        });
        return () => socket.off('DRIVER_LOCATION_UPDATE');
    }, [socket]);

    const [route, setRoute] = useState([]);

    useEffect(() => {
        if (pickup && dropoff) {
            fetch(`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`)
              .then(res => res.json())
              .then(data => {
                  if (data.routes && data.routes[0]) {
                      const coords = data.routes[0].geometry.coordinates;
                      // OSRM returns [lng, lat], Leaflet wants [lat, lng]
                      const latLngs = coords.map(c => [c[1], c[0]]);
                      setRoute(latLngs);
                  }
              })
              .catch(console.error);
        } else {
            setRoute([]);
        }
    }, [pickup, dropoff]);

    return (
        <MapContainer center={center} zoom={14} className="map-container" zoomControl={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker 
               pickup={pickup} setPickup={setPickup} 
               dropoff={dropoff} setDropoff={setDropoff} 
               selectingMode={selectingMode} 
            />
            
            {/* Render online drivers */}
            {Object.entries(drivers).map(([id, loc]) => {
                // If ride gets assigned, hide all drivers EXCEPT our driver
                if (activeRide && assignedDriver) {
                    if (assignedDriver.firebaseUid !== id) return null;
                }
                return (
                  <Marker key={id} position={loc} icon={driverIcon}>
                      <Popup>
                          <strong>{assignedDriver?.firebaseUid === id ? "Your Driver" : "Rickshaw"}</strong>
                          {assignedDriver?.firebaseUid === id && <br/>}
                          {assignedDriver?.firebaseUid === id && assignedDriver.name}
                      </Popup>
                  </Marker>
                )
            })}

            {route.length > 0 && <Polyline positions={route} color="var(--primary)" weight={5} opacity={0.8} />}
        </MapContainer>
    );
}
