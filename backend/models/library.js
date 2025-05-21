import mongoose from 'mongoose';
const librarySchema = new mongoose.Schema({
   members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }
    ],
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    facultyCleared: { type: Boolean, default: false },
    thesisBookReveiced: { type: Boolean, default: false },
    thesisBookReceivedDate: Date,
    remarks: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    clearedAt: Date,
    libraryStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  });


  export default mongoose.model('library', librarySchema);
