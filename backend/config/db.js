const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    // Do not exit process in some testing scenarios, but standard practice is 1
    // process.exit(1); 
  }
};

module.exports = connectDB;
