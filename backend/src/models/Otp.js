import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, required: true, enum: ['register', 'login'] },
  createdAt: { type: Date, default: Date.now, expires: 600 } // automatically expires in 10 minutes (600 seconds)
});

export default mongoose.model('Otp', otpSchema);
