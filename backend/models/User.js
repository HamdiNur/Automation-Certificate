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
    required: [true, 'Password is require'],
    minlength: 6
  },
  rawPassword: {
    type: String,
    select: false // prevents accidental exposure
  },  
  role: {
    type: String,
    enum: ['admin', 'student', 'staff', 'finance', 'library', 'faculty', 'exam_office', 'lab'],
    default: 'student'
  },
  userId: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profilePicture: {
    type: String,
    default: ''
  },
  rolePermissions: {
    type: [String],
    default: []
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
