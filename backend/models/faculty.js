import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  thesisTitle: String,
  printedThesisSubmitted: { type: Boolean, default: false },
  signedFormSubmitted: { type: Boolean, default: false },
  softCopyReceived: { type: Boolean, default: false },
  facultyRemarks: String,

  // ✅ NEW FIELD
  rejectionReason: { type: String, default: "" },

  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  clearedAt: Date,
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Faculty', facultySchema);
