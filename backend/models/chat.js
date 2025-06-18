// models/Chat.js
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
senderType: {
  type: String,
  enum: ['student',  'finance', 'faculty', 'library', 'exam_office', 'lab'],
  required: true
},
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
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
    enum: ['faculty', 'library', 'lab', 'finance', 'examination', 'general'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
