import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  ],

  thesisTitle: { type: String },

  printedThesisSubmitted: { type: Boolean, default: false },
  signedFormSubmitted: { type: Boolean, default: false },
  softCopyReceived: { type: Boolean, default: false },
  supervisorCommentsWereCorrected: { type: Boolean, default: false },

  facultyRemarks: { type: String },
  rejectionReason: { type: String, default: "" },

status: {
  type: String,
  enum: ['Pending', 'Approved', 'Rejected'],
  required: true
}
,

  resubmissionCount: {
    type: Number,
    default: 0
  },

  requestedAt: { type: Date, default: Date.now },


  requestedAt: { type: Date, default: Date.now },
  clearedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now },

  history: [
    {
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected']
      },
      reason: String,
          startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
      actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

export default mongoose.model('Faculty', facultySchema);
