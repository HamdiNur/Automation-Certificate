import Chat from '../models/chat.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { chatResponses, getRandomResponse, addBlessing, getLocalizedResponse } from '../utils/chatResponses.js';

// 🔍 Keyword-based department detection

const detectMessageType = (message) => {
  const lower = message.toLowerCase().trim();
  
  // 🕌 Islamic & Regular Greetings
  if (
    lower.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/) ||
    lower.match(/^(asc|assalamu|assalamu calaykum|assalamu alaykum|salaam|salam)/) ||
    lower.includes("assalamu calaykum") || lower.includes("peace be upon you")
  ) {
    return "greeting";
  }
  
  // 🏫 App/University questions
  if (
    lower.includes("what is this") || lower.includes("how does this work") || 
    lower.includes("what is the app") || lower.includes("jamhuriya") ||
    lower.includes("university") || lower.includes("clearance system")
  ) {
    return "app_info";
  }
  
  // 📊 Status questions
  if (
    lower.includes("my status") || lower.includes("where am i") || 
    lower.includes("what's next") || lower.includes("progress") ||
    lower.includes("xaalka") || lower.includes("halkee gaadhay") // Somali for status
  ) {
    return "status_check";
  }
  
  // ❓ Help questions
  if (
    lower.includes("how do i") || lower.includes("how to") || 
    lower.includes("what should i do") || lower.includes("help") ||
    lower.includes("sidee") || lower.includes("maxaan sameeya") // Somali for how/what to do
  ) {
    return "help_request";
  }
  
  // 🏢 Department detection (your existing logic)
  return autoDetectDepartment(message);
};
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

// 📩 Student/Admin Send Message

export const sendMessage = async (req, res) => {
  try {
    let { senderId, senderType, message } = req.body;
    if (!senderId || !senderType || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    let senderName = "Unknown";
    let department = "general";
    let receiverId = null;
    let botResponse = null;
    let shouldRoute = false;

    if (senderType === "student") {
      let student = null;
      if (senderId.match(/^[0-9a-fA-F]{24}$/)) {
        student = await Student.findById(senderId);
      }
      if (!student) {
        student = await Student.findOne({ studentId: senderId });
      }
      if (!student) return res.status(404).json({ error: "Student not found" });

      senderId = student._id.toString();
      senderName = student.fullName;

      // 🤖 BOT RESPONSE LOGIC - Now using organized responses
      const messageType = detectMessageType(message);

      switch(messageType) {
        case "greeting":
          botResponse = getLocalizedResponse(message, "greeting");
          break;
          
        case "app_info":
          botResponse = getLocalizedResponse(message, "app_info");
          break;

        case "help":
          botResponse = addBlessing(chatResponses.help_general);
          break;

        case "status":
          botResponse = chatResponses.status_help;
          break;
          
        case "finance":
        case "library": 
        case "lab":
        case "faculty":
        case "examination":
          // Use organized routing messages
          botResponse = chatResponses.routing_messages[messageType];
          shouldRoute = true;
          department = messageType;
          break;
      }

      // Rest of your existing logic...
      if (!shouldRoute) {
        const detected = autoDetectDepartment(message);
        department = detected !== "general" ? detected : (student.lastDepartment || "general");

        if (department === "general") {
          const lastStudentMessage = await Chat.findOne({ senderId }).sort({ timestamp: -1 });
          if (lastStudentMessage && lastStudentMessage.department !== "general") {
            department = lastStudentMessage.department;
          }
        }
      }

      if (department !== "general") {
        student.lastDepartment = department;
        await student.save();
      }
    } else {
      const user = await User.findById(senderId);
      senderName = user?.fullName || "Unknown Staff";
      department = user?.department || "general";
    }

    // Save original message
    const newMessage = new Chat({
      senderId,
      senderType,
      senderName,
      message,
      department,
      receiverId,
      timestamp: new Date(),
    });
    await newMessage.save();

    // 🤖 Send bot response if available
    if (botResponse && senderType === "student") {
      const botMessage = new Chat({
        senderId: "system",
        senderType: "chatbot", 
        senderName: "Jamhuriya Assistant",
        message: botResponse,
        department: department,
        receiverId: senderId,
        timestamp: new Date(),
      });
      await botMessage.save();
      
      global._io.emit('newMessage', newMessage);
      global._io.emit('newMessage', botMessage);
      
      return res.status(201).json({ 
        studentMessage: newMessage, 
        botResponse: botMessage 
      });
    }

    global._io.emit('newMessage', newMessage);
    res.status(201).json(newMessage);

  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ error: 'Server error while sending message' });
  }
};


// 📥 Get messages (only for one student)
export const getMessages = async (req, res) => {
  try {
    const { studentId } = req.params;
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

    const messages = await Chat.find({
      $or: [
        { senderId: student._id.toString() },
        { receiverId: student._id.toString() }
      ]
    }).sort({ timestamp: 1 }); // ✅ FIXED: Changed from createdAt to timestamp

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get Messages Error:", err);
    res.status(500).json({ error: "Server error while fetching messages" });
  }
};

// 📨 Admin replies to a student message
export const replyToStudent = async (req, res) => {
  const { message } = req.body;
  const { messageId } = req.params;
  const senderType = "finance"; // or req.user.department

  try {
    if (!messageId) return res.status(400).json({ error: "Message ID missing" });

    const original = await Chat.findById(messageId);
    if (!original) return res.status(404).json({ error: "Original message not found" });

    const newReply = new Chat({
      senderType,
      senderName: "Finance Department",
      senderId: req.user._id,
      message,
      department: original.department,
      receiverId: original.senderId, // ✅ Target specific student
      timestamp: new Date(),
      isRead: false,
    });

    await newReply.save();

    const populated = await Chat.findById(newReply._id);
    global._io.emit('newMessage', populated);
    res.status(201).json(newReply);

  } catch (err) {
    console.error("❌ Reply Error:", err);
    res.status(500).json({ error: "Failed to send reply" });
  }
};

// ✅ Department-wide messages (for admin dashboards)
export const getMessagesByDepartment = async (req, res) => {
  const { department } = req.params;

  try {
    const messages = await Chat.find({ department }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Error fetching department messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Mark messages sent TO a student as read
export const markMessagesAsRead = async (req, res) => {
  const { studentId } = req.params;

  try {
    await Chat.updateMany(
      {
        receiverId: studentId,
        isRead: false
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: "All messages marked as read." });
  } catch (err) {
    console.error("❌ Mark as read error:", err);
    res.status(500).json({ error: "Failed to update read status" });
  }
};

// ✅ Count unread messages
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