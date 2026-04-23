const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { setupSocketManager } = require('./sockets/socketManager');

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

// Setup Real-time sockets
setupSocketManager(io);

// Make io accessible to routes
app.set('io', io);

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

/** * NOMINAL CHANGE: Global Error Handling 
 * This prevents the server from leaking sensitive data during a crash.
 */
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[Error] ${err.message}`);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
