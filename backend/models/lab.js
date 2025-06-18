import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  ],
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },

  issues: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Incomplete'],
    default: 'Pending'
  },
  clearedAt: Date,

  expectedItems: {
    type: [String],
    default: []
  },
  returnedItems: {
    type: [String],
    default: []
  },

  // ✅ Add this block to track approval/rejection history
  history: [
    {
      status: String,
      reason: String,
      actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],

  approvedBy: String
}, { timestamps: true });

export default mongoose.model('lab', labSchema);