const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

const connectTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ims', {
      serverSelectionTimeoutMS: 2000,
    });
  } catch (err) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }
};

const disconnectTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectTestDb, disconnectTestDb };
