import mongoose from 'mongoose';

const courseRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  semester: { type: Number, required: true }, // 1 through 8
  courseCode: { type: String, required: true },
  courseName: { type: String, required: true },
  grade: { type: String }, // e.g., A, B, F, etc.
  passed: { type: Boolean, required: true }
}, { timestamps: true });

export default mongoose.model('course',  courseRecordSchema);