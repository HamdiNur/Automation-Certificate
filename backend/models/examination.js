import mongoose from 'mongoose';
const examinationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  hasPassedAllCourses: Boolean,
  canGraduate: Boolean,
  appointmentDate: Date,
  confirmationPdfUrl: String,
  nameConfirmed: { type: Boolean, default: false },
  nameCorrectionDoc: String,
  requiredDocs: {
    passportUploaded: { type: Boolean, default: false },
    otherDocsVerified: { type: Boolean, default: false }
  },
clearanceStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  remarks: String,
  rescheduleReason: { type: String },

  finalDecisionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clearedAt: Date,
  checkedIn: Boolean,
  attendedAt: Date,
  updatedAt: { type: Date, default: Date.now }

});

export default mongoose.model('examination', examinationSchema);
