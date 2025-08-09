import Chat from "../models/chat.js"
import Student from "../models/Student.js"
import User from "../models/User.js"
import { chatResponses, getRandomResponse, addBlessing, getLocalizedResponse } from "../utils/chatResponses.js"

function capitalize(str) {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Check if message is a resolution command
const isResolutionCommand = (message) => {
  const lower = message.toLowerCase().trim()
  return (
    lower === "resolved" ||
    lower === "done" ||
    lower === "finished" ||
    lower === "solved" ||
    lower === "back to general" ||
    lower === "go back" ||
    lower === "general" ||
    lower === "home" ||
    lower === "main menu"
  )
}

const detectMessageType = (message) => {
  const lower = message.toLowerCase().trim();

  // Check for resolution commands first
  if (isResolutionCommand(message)) {
    return "resolved";
  }

  // Thank you expressions
  if (
    lower === "thanks" ||
    lower === "thank you" ||
    lower === "thx" ||
    lower === "mahadsanid" ||
    lower === "aad baad u mahadsantahay"
  ) {
    return "thank_you";
  }

  // Islamic & Regular Greetings
  if (lower.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return "hi";
  }
  if (lower.match(/^(asc|ascw|asc wr wb|assalamu calaykum)/) || lower.startsWith("asc")) {
    return "asc";
  }
  if (
    lower.match(/^(assalamu alaykum|salaam|salam|peace be upon you)/) ||
    lower.includes("wa alaykumu") ||
    lower.includes("alaykum salaam")
  ) {
    return "salam";
  }

  // App/University questions (English & Somali)
  if (
    lower.includes("what is this") ||
    lower.includes("how does this work") ||
    lower.includes("what is the app") ||
    lower.includes("jamhuriya") ||
    lower.includes("university") ||
    lower.includes("clearance system") ||
    lower.includes("waa maxay") ||
    lower.includes("muxuu qabtaa") ||
    lower.includes("waa ayo") ||
    lower.includes("application") ||
    lower.includes("app-kan") ||
    lower.includes("nidaamkan") ||
    lower.includes("nidaamka")
  ) {
    return "app_info";
  }

  // Status questions
  if (
    lower.includes("my status") ||
    lower.includes("where am i") ||
    lower.includes("what's next") ||
    lower.includes("progress") ||
    lower.includes("xaalka") ||
    lower.includes("halkee gaadhay")
  ) {
    return "status_check";
  }

  // Help questions
  if (
    lower.includes("how do i") ||
    lower.includes("how to") ||
    lower.includes("what should i do") ||
    lower.includes("help") ||
    lower.includes("sidee") ||
    lower.includes("maxaan sameeya")
  ) {
    return "help_request";
  }

  return autoDetectDepartment(message);
};


const autoDetectDepartment = (message) => {
  const lower = message.toLowerCase()

  if (
    lower.includes("lacag") ||
    lower.includes("payment") ||
    lower.includes("fees") ||
    lower.includes("bixin") ||
    lower.includes("finance") ||
    lower.includes("waafi") ||
    lower.includes("malin") ||
    lower.includes("mali")
  )
    return "finance"

  if (lower.includes("kutub") || lower.includes("book") || lower.includes("library") || lower.includes("thesis"))
    return "library"

  if (lower.includes("qalab") || lower.includes("equipment") || lower.includes("lab") || lower.includes("return items"))
    return "lab"

  if (
    lower.includes("macalin") ||
    lower.includes("teacher") ||
    lower.includes("faculty") ||
    lower.includes("supervisor") ||
    lower.includes("project") ||
    lower.includes("research")
  )
    return "faculty"

  if (
    lower.includes("imtixaan") ||
    lower.includes("exam") ||
    lower.includes("examination") ||
    lower.includes("certificate") ||
    lower.includes("shahaado") ||
    lower.includes("name correction") ||
    lower.includes("result") ||
    lower.includes("passport")
  )
    return "exam_office"

  return "general"
}

export const sendMessage = async (req, res) => {
  try {
    let { senderId, senderType, message, department: clientDept } = req.body;

    if (!senderId || !senderType || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    let senderName = "Unknown";
    let department = clientDept || "general"; // Prioritize frontend-sent department
    const receiverId = null;
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

      const messageType = detectMessageType(message);
      const isValidDept = ["finance", "faculty", "library", "exam_office", "lab"];

      // 🟢 Handle resolution command
      if (messageType === "resolved") {
        student.lastDepartment = "general";
        await student.save();
        botResponse = getRandomResponse(chatResponses.resolved_responses);
        department = "general";
      }

      // 🟡 Student is already in a department and said something generic
      else if (
        student.lastDepartment &&
        student.lastDepartment !== "general" &&
        messageType === "general"
      ) {
        department = student.lastDepartment;
      }

      // 🔵 Handle normal routing
      else {
        // 🔹 Prioritize valid frontend department
        if (clientDept && isValidDept.includes(clientDept)) {
          department = clientDept;
          shouldRoute = true;
        } else {
          switch (messageType) {
          case "hi":
       case "asc":
         case "salam":
         const greetingArray = chatResponses.greeting[messageType] || chatResponses.greeting.fallback;
          botResponse = getRandomResponse(greetingArray);
             break;

            case "app_info":
              botResponse = getLocalizedResponse(message, "app_info");
              break;
            case "help_request":
              botResponse = addBlessing(chatResponses.help_general);
              break;
            case "status_check":
              botResponse = chatResponses.status_help;
              break;
            case "finance":
            case "library":
            case "lab":
            case "faculty":
            case "exam_office":
              botResponse = chatResponses.routing_messages[messageType];
              shouldRoute = true;
              department = messageType;
              break;
              case "thank_you":
  botResponse = getRandomResponse(chatResponses.thank_you_responses);
  break;

case "unknown":
  botResponse = getRandomResponse(chatResponses.unknown_responses);

  // Reuse last department if available
case "unknown":
  if (student.lastDepartment && student.lastDepartment !== "general") {
    botResponse = `I'm not sure I understood that. 🤔 Would you like me to forward this to your last department (${capitalize(student.lastDepartment)})? Just reply with "yes" or the department name.`;
  } else {
    botResponse = getRandomResponse(chatResponses.unknown_responses);
  }
  break;
            default:
              if (!student.lastDepartment || student.lastDepartment === "general") {
                botResponse =
                  "I'm here to assist you with university-related services. Please mention the department or topic (e.g., payment, thesis, exam) for faster assistance.";
              } else {
                department = student.lastDepartment;
              }
              break;
          }
        }
      }

      // 📝 Update student's last department
      if (department !== "general") {
        const yesNo = message.toLowerCase().trim();
if ((yesNo === "yes" || yesNo === "haa") && student.lastDepartment && student.lastDepartment !== "general") {
  department = student.lastDepartment;
  shouldRoute = true;
  botResponse = `Okay! I'm forwarding your message to the ${capitalize(student.lastDepartment)} department. ✅`;
}
if (yesNo === "no" || yesNo === "maya") {
  botResponse = "Okay, let me know how I can assist you.";
}

        student.lastDepartment = department;
        await student.save();
      }
    } else {
      const user = await User.findById(senderId);
      senderName = user?.fullName || "Unknown Staff";
      department = user?.department || "general";
    }

    // 💾 Save student message
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


global._io.to(senderId).emit("newMessage", newMessage);   // Student gets their own message
global._io.to(department).emit("newMessage", newMessage); // ✅

console.log(`📤 Message saved: ${message} | Department: ${department} | Sender: ${senderName}`);

// ✅ Send bot reply to student room
// global._io.to(senderId).emit("newMessage", botMessage);

// global._io.emit("newMessage", botMessage);
  // 📢 Notify staff dashboard
if (department !== "general") {
  global._io.emit(`department:${department}`, newMessage);
}
    // 🤖 Bot/system response (to student only)
  if (botResponse && senderType === "student") {
  const botMessage = new Chat({
    senderId: "system",
    senderType: "chatbot",
    senderName: "Assistant",
    message: botResponse,
    department,
    receiverId: senderId,
    timestamp: new Date(),
    isSystemMessage: shouldRoute,
  });

  await botMessage.save();

  // ✅ Send to student only (no staff)
  global._io.to(senderId).emit("newMessage", botMessage);

  return res.status(201).json({
    studentMessage: newMessage,
    botResponse: botMessage,
  });
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ error: "Server error while sending message" });
  }
};


export const getMessages = async (req, res) => {
  try {
    const { studentId } = req.params
    let student = null

    if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(studentId)
    }
    if (!student) {
      student = await Student.findOne({ studentId })
    }
    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    // Get ALL messages for this student across ALL departments
    const messages = await Chat.find({
      $or: [{ senderId: student._id.toString() }, { receiverId: student._id.toString() }],
    }).sort({ timestamp: 1 })

    res.status(200).json(messages)
  } catch (err) {
    console.error("Get Messages Error:", err)
    res.status(500).json({ error: "Server error while fetching messages" })
  }
}
export const replyToStudent = async (req, res) => {
  const { message } = req.body;
  const { messageId } = req.params;

  const validSenderTypes = ["student", "chatbot", "finance", "faculty", "library", "exam_office", "lab"];
  let senderType = req.user?.department?.toLowerCase().replace(/\s+/g, "_");
  if (!validSenderTypes.includes(senderType)) senderType = "library";

  try {
    if (!messageId) return res.status(400).json({ error: "Message ID missing" });

    const original = await Chat.findById(messageId);
    if (!original) return res.status(404).json({ error: "Original message not found" });

    // ✅ Always resolve the student’s Mongo _id for the room
    const studentMongoId =
      original.senderType === "student" ? original.senderId : original.receiverId;

    if (!studentMongoId) {
      return res.status(400).json({ error: "Could not resolve student room id" });
    }

    // (Optional) also fetch human studentId for fallback emit during debugging
    let humanStudentId = null;
    try {
      const s = await Student.findById(String(studentMongoId)).select("studentId");
      humanStudentId = s?.studentId || null;
    } catch (_) {}

    const newReply = new Chat({
      senderType,
      senderName: `${senderType.charAt(0).toUpperCase() + senderType.slice(1)} Department`,
      senderId: req.user._id,
      message,
      department: original.department,
      receiverId: studentMongoId,    // DB points to student
      timestamp: new Date(),
      isRead: false,
    });

    await newReply.save();

    // 🔎 Debug: log sockets in rooms before emitting
    const mongoRoom = String(studentMongoId);
    const mongoRoomSize = global._io.sockets?.adapter?.rooms?.get(mongoRoom)?.size || 0;
    console.log(`📤 Staff reply | dept=${original.department} | mongoRoom=${mongoRoom} | socketsInRoom=${mongoRoomSize}`);

    global._io.to(mongoRoom).emit("newMessage", newReply);

    // 🔁 Fallback emit to human-readable studentId (remove once everything works)
    if (humanStudentId) {
      const humanRoomSize = global._io.sockets?.adapter?.rooms?.get(humanStudentId)?.size || 0;
      console.log(`📤 (fallback) humanRoom=${humanStudentId} | socketsInRoom=${humanRoomSize}`);
      global._io.to(humanStudentId).emit("newMessage", newReply);
    }

    return res.status(201).json(newReply);
  } catch (err) {
    console.error("❌ Reply Error:", err);
    return res.status(500).json({ error: "Failed to send reply" });
  }
};



export const getMessagesByDepartment = async (req, res) => {
  const { department } = req.params

  try {
    const messages = await Chat.find({
      department,
      isSystemMessage: { $ne: true }, // Exclude system messages
    }).sort({ timestamp: 1 })

    console.log(`📥 Fetched ${messages.length} messages for ${department} department`)

    res.status(200).json(messages)
  } catch (error) {
    console.error("❌ Error fetching department messages:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const markMessagesAsRead = async (req, res) => {
  const { studentId } = req.params

  try {
    await Chat.updateMany(
      {
        receiverId: studentId,
        isRead: false,
      },
      { $set: { isRead: true } },
    )

    res.status(200).json({ message: "All messages marked as read." })
  } catch (err) {
    console.error("❌ Mark as read error:", err)
    res.status(500).json({ error: "Failed to update read status" })
  }
}

export const getUnreadCount = async (req, res) => {
  const { studentId } = req.params

  try {
    const count = await Chat.countDocuments({
      receiverId: studentId,
      isRead: false,
    })

    res.status(200).json({ count })
  } catch (err) {
    console.error("Count Error:", err)
    res.status(500).json({ error: "Could not fetch unread count" })
  }
}

export const markMessageResolved = async (req, res) => {
  try {
    const { messageId } = req.params

    const updated = await Chat.findByIdAndUpdate(messageId, { status: "resolved" }, { new: true })

    if (!updated) return res.status(404).json({ error: "Message not found" })

    res.status(200).json({ message: "Marked as resolved.", data: updated })
  } catch (err) {
    console.error("❌ Resolve Error:", err)
    res.status(500).json({ error: "Could not update status" })
  }
}


// ✅ Controller: Total unread messages for finance (across all students)
export const getTotalUnreadCount = async (req, res) => {
  try {
    const count = await Chat.countDocuments({
      department: 'finance',
      isRead: false,
    });

    res.json({ total: count });
  } catch (error) {
    console.error("Error fetching total unread count:", error);
    res.status(500).json({ message: "Server error" });
  }
};