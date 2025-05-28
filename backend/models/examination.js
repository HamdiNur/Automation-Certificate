import mongoose from 'mongoose';

const examinationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  hasPassedAllCourses: Boolean,
  canGraduate: Boolean,
  confirmationPdfUrl: String,

  nameConfirmed: { type: Boolean, default: false },
  nameCorrectionDoc: String,

  requiredDocs: {
    passportUploaded: { type: Boolean, default: false },
    // otherDocsVerified: { type: Boolean, default: false }
  },

  clearanceStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },

  remarks: String,
  finalDecisionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clearedAt: Date,
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Examination', examinationSchema);
