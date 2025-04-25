import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'staff','finance'], // Add more roles as needed
    default: 'student'
  },
  userId: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema); // prevent dublicate or overwrite 

export default User;
