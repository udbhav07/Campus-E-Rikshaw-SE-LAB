const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();
require('./firebaseAdmin'); // Initialize Firebase Admin SDK globally

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Base route
app.get('/', (req, res) => res.json({ message: 'E-Rickshaw API is running' }));

// Real-time tracking RAM state
const activeDrivers = {}; // socketId -> { driverId, lat, lng }

function calculateDistance(lat1, lon1, lat2, lon2) {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  socket.on('DRIVER_ONLINE', async (data) => {
    socket.join('drivers');
    try {
        const User = require('./models/User');
        const driver = await User.findOne({ firebaseUid: data.driverId });
        if (driver && !driver.isActive) {
            console.log(`Suspended driver ${data.driverId} attempted to go online.`);
            socket.emit('SUSPENDED_ERROR', { message: 'Your account is currently suspended by an Administrator.' });
            return; // Do not add to active network
        }
        console.log(`Driver online: ${data.driverId}`);
        activeDrivers[socket.id] = { driverId: data.driverId, lat: null, lng: null };
    } catch(err) { console.error(err); }
  });

  socket.on('DRIVER_LOCATION_UPDATE', (data) => {
    // Update RAM state
    if (activeDrivers[socket.id]) {
        activeDrivers[socket.id].lat = data.location[0];
        activeDrivers[socket.id].lng = data.location[1];
    }
    // Broadcast for admin dashboard global tracking
    io.emit('DRIVER_LOCATION_UPDATE', data);
  });

  socket.on('REQUEST_RIDE', async (data) => {
    console.log('New ride requested:', data);
    const pickupLat = data.pickup.lat;
    const pickupLng = data.pickup.lng;

    // Filter drivers within 2km
    const nearbyDriverSockets = Object.keys(activeDrivers).filter(sid => {
        const d = activeDrivers[sid];
        if (!d.lat || !d.lng) return false;
        const dist = calculateDistance(pickupLat, pickupLng, d.lat, d.lng);
        return dist <= 2.0; // 2 Kilometers
    });

    console.log(`Blasting ride to ${nearbyDriverSockets.length} nearby drivers out of ${Object.keys(activeDrivers).length} total drivers.`);
    
    // Broadcast ONLY to nearby sockets, or fallback to all if none found for demo purposes
    if (nearbyDriverSockets.length > 0) {
        nearbyDriverSockets.forEach(sid => io.to(sid).emit('NEW_RIDE_REQUEST', data));
    } else {
        io.emit('NEW_RIDE_REQUEST', data);
    }
  });

  socket.on('RIDE_STATUS_UPDATED', (rideInfo) => {
     io.emit('RIDE_STATUS_UPDATED', rideInfo);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    delete activeDrivers[socket.id];
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
