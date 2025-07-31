import express from 'express';
import { sendMessage, getMessages, getMessagesByDepartment, markMessagesAsRead, replyToStudent, getUnreadCount, markMessageResolved, getTotalUnreadCount } from '../controllers/chatController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Send a message (Student or Staff)
router.post('/send', sendMessage);

// ✅ Get all messages related to a student
router.get('/messages/:studentId', getMessages);
router.get('/department/:department', getMessagesByDepartment);
router.post('/reply/:messageId',auth, replyToStudent);
router.post('/mark-read/:studentId', markMessagesAsRead); // ✅ Add this one
router.get("/unread/:studentId", getUnreadCount);
router.get('/unread-total', auth, getTotalUnreadCount); // ✅ NEW
router.put('/resolve/:messageId', markMessageResolved); // ✅ New route




export default router;