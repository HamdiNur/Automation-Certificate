import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'status_update',
      'reminder',
      'appointment',
      'certificate',
      'name-correction-approved', // ✅ Added
      'name-correction-rejected' , // ✅ Added
       'examination-approved',     // ✅ Add this
     'name-correction-requested' 
    ],
    default: 'status_update',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Notification', notificationSchema);