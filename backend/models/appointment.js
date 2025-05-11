
import mongoose from 'mongoose';
const appointmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    appointmentDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rescheduled: { type: Boolean, default: false },
    rescheduleReason: String,
    status: { type: String, enum: ['scheduled', 'rescheduled', 'completed', 'missed'], default: 'scheduled' },
    checkedIn: { type: Boolean, default: false },
    attendedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  

  export default mongoose.model('appointment', appointmentSchema);
