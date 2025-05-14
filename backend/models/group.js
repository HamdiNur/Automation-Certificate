import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  groupNumber: { type: Number, unique: true },
  program: String,
  faculty: String,
  projectTitle: String,
  thesisFileUrl: String,
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  ],
  phaseOneCleared: Boolean,
  overallStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Cleared', 'Rejected'],
    default: 'Pending'
  },
  clearanceProgress: {
    faculty: { status: { type: String, default: 'Pending' }, clearedBy: String, date: Date },
    library: { status: { type: String, default: 'Pending' }, clearedBy: String, date: Date },
    lab: { status: { type: String, default: 'Pending' }, clearedBy: String, date: Date }
  },
  clearedAt: Date
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);

