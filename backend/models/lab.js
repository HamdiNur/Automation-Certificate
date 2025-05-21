import mongoose from 'mongoose';
const labSchema = new mongoose.Schema({
  members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student'
        }
      ],
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    returnedItems: String,
    issues: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    clearedAt: Date,
    approvedBy: String,
    updatedAt: { type: Date, default: Date.now }
  });
  


  export default mongoose.model('lab', labSchema );
