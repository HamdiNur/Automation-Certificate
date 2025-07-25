// models/Chat.js
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
// In models/Chat.js - UPDATE this line:
senderType: {
  type: String,
  enum: ['student', 'chatbot', 'finance', 'faculty', 'library', 'exam_office', 'lab'], // ✅ Added 'chatbot'
  required: true
},
  senderId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  senderName: {
  type: String,
},
receiverId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Student",
},
isRead: {
  type: Boolean,
  default: false, // Unread by default
},
attachmentUrl: {
  type: String,
  default: null
},


  department: {
    type: String,
    enum: ['faculty', 'library', 'lab', 'finance', 'exam_office', 'general'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
