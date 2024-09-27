const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('process.env.MONGO_CONNECTION :>> ', process.env.MONGO_CONNECTION); 
    await mongoose.connect(process.env.MONGO_CONNECTION);
    console.log('MongoDB connected');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
