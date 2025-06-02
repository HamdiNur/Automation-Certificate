import mongoose from 'mongoose';

const clearanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },

  faculty: {
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    clearedAt: Date,
    rejectionReason: { type: String, default: '' }  // ✅ Added this
  },

  library: {
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    clearedAt: Date
  },

  lab: {
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    clearedAt: Date
  },

  finance: {
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    clearedAt: Date
  },

  examination: {
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    clearedAt: Date
  },

  finalStatus: {
    type: String,
    enum: ['Incomplete', 'Approved'],
    default: 'Incomplete'
  },
},
   { timestamps: true }); //


export default mongoose.model('Clearance', clearanceSchema);
