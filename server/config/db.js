const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  if (mongoose.connection.readyState !== 0) {
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
