const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_prompt_studio';
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
    });
    isConnected = true;
    console.log(`[Database] Connected successfully to MongoDB (${uri})`);
  } catch (error) {
    isConnected = false;
    console.warn(`[Database Warning] Could not connect to local MongoDB (${error.message}).`);
    console.warn(`[Database Notice] Application will operate in lightweight in-memory demo mode for models.`);
  }
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };
