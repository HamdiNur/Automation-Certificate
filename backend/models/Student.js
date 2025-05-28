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
    required: true
  },
  motherName: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
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
  yearOfGraduation: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 4
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },

  // 📘 Academic Mode & Status
  mode: {
    type: String,
    enum: ['fulltime', 'parttime'],
    default: 'fulltime'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'], // active: still student, inactive: graduated
    default: 'active'
  },
  role: {
    type: String,
    enum: ['leader', 'member'],
    default: 'null'
  },

  // 🔒 Authentication
  email: {
    type: String,
    required: true,
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

  // ✅ Verification & Name Correction
  nameCorrectionRequested: {
    type: Boolean,
    default: null
  },
  nameCorrectionEligible: {
    type: Boolean,
    default: false
  },
  requestedName: {
    type: String,
    default: ''
  },
  nameVerified: {
    type: Boolean,
    default: false
  },
  correctionUploadUrl: {
    type: String,
    default: ''
  },
  sentToAdmission: {
    type: Boolean,
    default: false
  },

  // 🧾 Clearance Status
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
