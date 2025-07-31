import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  senderType: {
    type: String,
    enum: ['student', 'chatbot', 'finance', 'faculty', 'library', 'exam_office', 'lab'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  senderName: {
    type: String,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  message: {
    type: String,
    required: true
  },
  department: {
    type: String,
    enum: ['faculty', 'library', 'lab', 'finance', 'exam_office', 'general'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSystemMessage: { // ✅ New
    type: Boolean,
    default: false
  },
  isRoutingNotice: { // ✅ New
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: ['open', 'pending', 'resolved'],
    default: 'open'
  },
  tags: {
    type: [String],
    default: []
  },
  language: {
    type: String,
    enum: ['en', 'so'],
    default: 'en'
  },
  attachmentUrl: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
