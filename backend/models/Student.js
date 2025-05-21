import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
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
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  rawPassword: {
    type: String,
    required: true
  },
  hashedPassword: {
    type: String,
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
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  phone: {
    type: String,
    required: true
  },
  nameVerified: {
    type: Boolean,
    default: false
  },
  correctionUploadUrl: {
    type: String,
    default: ''
  }
  ,
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
  profilePicture: {
    type: String,
    default: ''
  },
 clearanceStatus: {
  type: String,
  enum: ['Pending', 'Approved', 'Rejected'],
  default: 'Pending'
},
isCleared: {
  type: Boolean,
  default: false
}

}, { timestamps: true });

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;
