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

  approvedBy: String
}, { timestamps: true }); // ✅ This automatically adds createdAt + updatedAt



  export default mongoose.model('lab', labSchema );
