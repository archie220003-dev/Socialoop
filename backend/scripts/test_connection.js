import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load .env
dotenv.config();

const mongoUri = process.env.MONGO_URI;
console.log('Testing connection to:', mongoUri ? mongoUri.replace(/:([^@]+)@/, ':****@') : 'undefined');

if (!mongoUri) {
  console.error('MONGO_URI is not defined in the .env file.');
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB Atlas connected successfully!');
  await mongoose.connection.close();
  console.log('Connection closed.');
  process.exit(0);
} catch (err) {
  console.error('Connection failed with error:', err);
  process.exit(1);
}
