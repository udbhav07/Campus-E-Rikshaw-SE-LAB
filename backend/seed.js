const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Ride = require('./models/Ride');

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to DB. Clearing old mock data...');
        // Only clear users with mock emails if we want to be safe, but we'll just clear all here for dev.
        await User.deleteMany();
        await Ride.deleteMany();

        console.log('Seeding fake Drivers and Passengers...');

        // Create 2 Passengers
        const passengers = await User.insertMany([
            { name: "Rahul Kumar", email: "rahul@mock.edu", role: "PASSENGER", firebaseUid: "mock_p_1", isActive: true },
            { name: "Priya Singh", email: "priya@mock.edu", role: "PASSENGER", firebaseUid: "mock_p_2", isActive: true },
        ]);

        // Create 5 Drivers
        const drivers = await User.insertMany([
            { name: "Suresh", email: "suresh@mock.edu", role: "DRIVER", firebaseUid: "mock_d_1", isActive: true },
            { name: "Amit", email: "amit@mock.edu", role: "DRIVER", firebaseUid: "mock_d_2", isActive: true },
            { name: "Vikram", email: "vikram@mock.edu", role: "DRIVER", firebaseUid: "mock_d_3", isActive: false }, // Suspended
            { name: "Raju", email: "raju@mock.edu", role: "DRIVER", firebaseUid: "mock_d_4", isActive: true },
            { name: "Dilip", email: "dilip@mock.edu", role: "DRIVER", firebaseUid: "mock_d_5", isActive: true },
        ]);

        console.log('Seeding fake Rides...');
        
        let ridesData = [];
        const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'ONGOING', 'CANCELLED'];

        for (let i = 0; i < 20; i++) {
            const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
            const randomPassenger = passengers[Math.floor(Math.random() * passengers.length)];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            // Random dates within the last 7 days for analytics
            const generatedDate = new Date();
            generatedDate.setDate(generatedDate.getDate() - Math.floor(Math.random() * 7));

            ridesData.push({
                passengerId: randomPassenger._id,
                driverId: randomDriver._id,
                pickupLocation: {
                    type: 'Point',
                    coordinates: [77.2090 + (Math.random() * 0.01), 28.6139 + (Math.random() * 0.01)]
                },
                dropLocation: {
                    type: 'Point',
                    coordinates: [77.2190, 28.6239]
                },
                status: randomStatus,
                fare: Math.floor(Math.random() * 50) + 20,
                createdAt: generatedDate
            });
        }

        await Ride.insertMany(ridesData);

        console.log('Mock Data Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error with data import', error);
        process.exit(1);
    }
};

seedDatabase();
