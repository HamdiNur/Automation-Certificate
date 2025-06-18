import Chat from '../models/chat.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// 🔍 Keyword-based department detection
const autoDetectDepartment = (message) => {
  const lower = message.toLowerCase();

  if (
    lower.includes("lacag") || lower.includes("payment") ||
    lower.includes("fees") || lower.includes("bixin") ||
    lower.includes("finance") || lower.includes("waafi") ||
    lower.includes("malin") || lower.includes("mali")
  ) return "finance";

  if (
    lower.includes("kutub") || lower.includes("book") ||
    lower.includes("library") || lower.includes("thesis")
  ) return "library";

  if (
    lower.includes("qalab") || lower.includes("equipment") ||
    lower.includes("lab") || lower.includes("return items")
  ) return "lab";

  if (
    lower.includes("macalin") || lower.includes("teacher") ||
    lower.includes("faculty") || lower.includes("supervisor") ||
    lower.includes("project") || lower.includes("research")
  ) return "faculty";

  if (
    lower.includes("imtixaan") || lower.includes("exam") ||
    lower.includes("examination") || lower.includes("certificate") ||
    lower.includes("shahaado") || lower.includes("name correction") ||
    lower.includes("result") || lower.includes("passport")
  ) return "examination";

  return "general";
};

// 📩 Send message
export const sendMessage = async (req, res) => {
  try {
    const { senderId, senderType, message } = req.body;

    if (!senderId || !senderType || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    let senderName = "Unknown";
    let department = "general";

    if (senderType === "student") {
      const student = await Student.findById(senderId);
      senderName = student?.fullName || "Unknown Student";

      const detected = autoDetectDepartment(message);
      department = detected !== "general" ? detected : (student?.lastDepartment || "general");

      // 🟩 Fallback to previous message's department
      if (department === "general") {
        const lastStudentMessage = await Chat.findOne({ senderId }).sort({ createdAt: -1 });
        if (lastStudentMessage && lastStudentMessage.department !== "general") {
          department = lastStudentMessage.department;
        }
      }

      // 🟢 Save last used department
      if (department !== "general") {
        student.lastDepartment = department;
        await student.save();
      }

    } else {
      const user = await User.findById(senderId);
      senderName = user?.fullName || "Unknown Staff";
      department = user?.department || "general";
    }

    const newMessage = new Chat({
      senderId,
      senderType,
      senderName,
      message,
      department,
      timestamp: new Date(),
    });

    await newMessage.save();
const populated = await Chat.findById(newMessage._id); // ✅ Ensures _id and full document

global._io.emit('newMessage', populated); // ✅ 
   res.status(201).json(newMessage);

  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ error: 'Server error while sending message' });
  }
};


// 📥 Get messages (for a specific student)
export const getMessages = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Try both real MongoID and readable studentId (e.g. C123456)
    let student = null;

    if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(studentId);
    }

    if (!student) {
      student = await Student.findOne({ studentId });
    }

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // 📥 Fetch messages
    const messages = await Chat.find({
      senderId: student._id.toString()
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (err) {
    console.error("Get Messages Error:", err);
    res.status(500).json({ error: "Server error while fetching messages" });
  }
};

// Get all chat messages for a specific department
export const getMessagesByDepartment = async (req, res) => {
  const { department } = req.params;

  try {
   const messages = await Chat.find({ department })
  .sort({ createdAt: 1 }); // ✅ USE STORED senderName FIELD

    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Error fetching department messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// 📍 Mark all messages sent to a student as read
export const markMessagesAsRead = async (req, res) => {
  const { studentId } = req.params;

  try {
    await Chat.updateMany(
      {
        receiverId: studentId, // ✅ target messages received by student
        isRead: false
      },
      {
        $set: { isRead: true } // ✅ mark them as read
      }
    );

    res.status(200).json({ message: "All messages marked as read." });
  } catch (err) {
    console.error("❌ Mark as read error:", err);
    res.status(500).json({ error: "Failed to update read status" });
  }
};
export const replyToStudent = async (req, res) => {
  const { message } = req.body;
  const { messageId } = req.params;
  const senderType = "finance";

  console.log("✅ messageId from params:", messageId);
  console.log("✅ req.user:", req.user);

  try {
    if (!messageId) return res.status(400).json({ error: "Message ID missing in route" });

    const original = await Chat.findById(messageId);
    if (!original) return res.status(404).json({ error: "Original message not found" });

    const newReply = new Chat({
      senderType,
      senderName: "Finance Department",
      senderId: req.user._id,
      message,
      department: original.department,
      receiverId: original.senderId,
      timestamp: new Date(),
      isRead: false,
    });

    await newReply.save();

const populated = await Chat.findById(newReply._id); //  FIXED name
global._io.emit('newMessage', populated);
 // emits the full message
res.status(201).json(newReply);

  } catch (err) {
    console.error("❌ Reply Error:", err);
    res.status(500).json({ error: "Failed to send reply" });
  }
};


export const getUnreadCount = async (req, res) => {
  const { studentId } = req.params;

  try {
    const count = await Chat.countDocuments({
      receiverId: studentId,
      isRead: false,
    });

    res.status(200).json({ count });
  } catch (err) {
    console.error("Count Error:", err);
    res.status(500).json({ error: "Could not fetch unread count" });
  }
};
