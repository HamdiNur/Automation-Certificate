
import mongoose from 'mongoose';
const groupSchema = new mongoose.Schema({
  groupNumber: { type: Number, required: true },
  admissionYear: { type: Number, required: true },
  program: String,
  faculty: String,
  projectTitle: String,
  thesisFileUrl: String,

  members: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
      },
      role: {
        type: String,
        enum: ['Leader', 'Member'],
        default: 'Member'
      }
    }
  ],

  phaseOneCleared: Boolean,
  overallStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  clearanceProgress: {
    faculty: {
      status: { type: String, default: 'Pending' },
      clearedBy: String,
      date: Date,
      facultyRemarks: String
    },
    library: {
      status: { type: String, default: 'Pending' },
      clearedBy: String,
      date: Date
    },
    lab: {
      status: { type: String, default: 'Pending' },
      clearedBy: String,
      date: Date
    },
  },
  clearedAt: Date
}, { timestamps: true });

groupSchema.index({ groupNumber: 1, admissionYear: 1 }, { unique: true });

export default mongoose.model('Group', groupSchema);
