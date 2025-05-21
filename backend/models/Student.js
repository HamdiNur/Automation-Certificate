import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  // 🎓 Identity & Academic Info
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  motherName: {
    type: String,
    required: [true, 'Mother’s name is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required']
  },

  // 📚 Academic Background
  program: {
    type: String,
    required: true
  },
  faculty: {
    type: String,
    required: true
  },
  yearOfAdmission: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 4
  },
  yearOfGraduation: {
    type: Number,
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },

  // 🔒 Authentication
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  rawPassword: {
    type: String,
    required: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
nameCorrectionRequested: { type: Boolean, default: false },  // ✅ New

  // ✅ Verification & Status
  nameVerified: {
    type: Boolean,
    default: false
  },
  correctionUploadUrl: {
    type: String,
    default: ''
  },
  clearanceStatus: {
    type: String,
    enum: ['pending', 'Approved', 'Rejected'],
    default: 'pending'
  },
  isCleared: {
    type: Boolean,
    default: false
  },

  // 📷 Profile
  profilePicture: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;
