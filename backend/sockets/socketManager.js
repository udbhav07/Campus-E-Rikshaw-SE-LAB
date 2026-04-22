const { calculateDistance } = require('../utils/geoUtils');
const User = require('../models/User');

// Centralize RAM state for driver tracking
const activeDrivers = {}; // socketId -> { driverId, lat, lng }

/**
 * Initializes socket event listeners and handles real-time communication.
 * 
 * @param {Server} io - The Socket.io server instance.
 */
function setupSocketManager(io) {
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);
        
        // Handle driver coming online
        socket.on('DRIVER_ONLINE', async (data) => {
            socket.join('drivers');
            try {
                const driver = await User.findOne({ firebaseUid: data.driverId });
                
                // Prevent suspended drivers from connecting
                if (driver && !driver.isActive) {
                    console.log(`Suspended driver ${data.driverId} attempted to go online.`);
                    socket.emit('SUSPENDED_ERROR', { message: 'Your account is currently suspended by an Administrator.' });
                    return; 
                }
                
                console.log(`Driver online: ${data.driverId}`);
                activeDrivers[socket.id] = { driverId: data.driverId, lat: null, lng: null };
            } catch (err) { 
                console.error('Error handling DRIVER_ONLINE:', err); 
            }
        });

        // Handle regular driver location updates
        socket.on('DRIVER_LOCATION_UPDATE', (data) => {
            // Update in-memory state for nearby driver calculation
            if (activeDrivers[socket.id]) {
                activeDrivers[socket.id].lat = data.location[0];
                activeDrivers[socket.id].lng = data.location[1];
            }
            
            // Broadcast for admin dashboard global tracking
            io.emit('DRIVER_LOCATION_UPDATE', data);
        });

        // Handle incoming ride requests
        socket.on('REQUEST_RIDE', async (data) => {
            console.log('New ride requested:', data);
            const pickupLat = data.pickup.lat;
            const pickupLng = data.pickup.lng;

            // Find drivers within 2km radius
            const nearbyDriverSockets = Object.keys(activeDrivers).filter(sid => {
                const driverData = activeDrivers[sid];
                if (!driverData.lat || !driverData.lng) return false;
                
                const distance = calculateDistance(pickupLat, pickupLng, driverData.lat, driverData.lng);
                return distance <= 2.0; // Max 2 Kilometers
            });

            console.log(`Sending ride request to ${nearbyDriverSockets.length} nearby drivers out of ${Object.keys(activeDrivers).length} total active drivers.`);
            
            // Target nearby drivers. If none, broadcast to all for demo purposes.
            if (nearbyDriverSockets.length > 0) {
                nearbyDriverSockets.forEach(sid => io.to(sid).emit('NEW_RIDE_REQUEST', data));
            } else {
                io.emit('NEW_RIDE_REQUEST', data);
            }
        });

        // Global broadcast for ride status updates
        socket.on('RIDE_STATUS_UPDATED', (rideInfo) => {
            io.emit('RIDE_STATUS_UPDATED', rideInfo);
        });

        // Cleanup on disconnect
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            delete activeDrivers[socket.id];
        });
    });
}

module.exports = {
    setupSocketManager,
    activeDrivers // Exporting for debugging or extended use if necessary
};
