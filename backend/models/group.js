import mongoose from 'mongoose';
const groupSchema = new mongoose.Schema({
    groupNumber: { type: Number, required: true, unique: true },
    program: { type: String, required: true },
    faculty: { type: String, required: true },
    projectTitle: String,
    thesisFileUrl: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    phaseOneCleared: { type: Boolean, default: false },
    overallStatus: { type: String, enum: ['Pending', 'In Progress', 'Cleared', 'Rejected'], default: 'Pending' },
    clearanceProgress: {
      faculty: { status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }, clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: Date },
      library: { status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }, clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: Date },
      lab: { status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }, clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: Date }
    },
    clearedAt: Date
  }, { timestamps: true });

  export default mongoose.model('group', groupSchema);
