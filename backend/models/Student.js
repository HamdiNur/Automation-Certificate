import mongoose from "mongoose"

const studentSchema = new mongoose.Schema(
  {
    // 🎓 Identity & Academic Info
    studentId: {
      type: String,
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
    },
    motherName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    program: {
      type: String,
      required: true,
    },
    faculty: {
      type: String,
      required: true,
    },
    yearOfAdmission: {
      type: Number,
      required: true,
    },
    yearOfGraduation: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      default: 4,
    },
    studentClass: {
      type: String,
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },

    // 📘 Academic Mode & Status
    mode: {
      type: String,
      enum: ["Fulltime", "Parttime"],
      default: "Fulltime",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    // 🔒 Authentication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    rawPassword: {
      type: String,
      required: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },

    // ✅ UPDATED: Complete Name Correction Status Tracking
    nameCorrectionRequested: {
      type: Boolean,
      default: null, // null = not decided, false = declined, true = requested
    },
    nameCorrectionStatus: {
      type: String,
      enum: [
        "Declined", // ✅ Student chose "No"
        "Pending", // ✅ Student chose "Yes", waiting for document
        "Document Uploaded", // ✅ Document uploaded, waiting for officer review
        "Approved", // ✅ Officer approved the name correction
        "Rejected", // ✅ Officer rejected with reason
      ],
      default: null,
    },
    nameCorrectionEligible: {
      type: Boolean,
      default: false,
    },
    requestedName: {
      type: String,
      default: "",
    },
    nameVerified: {
      type: Boolean,
      default: false,
    },
    correctionUploadUrl: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    sentToAdmission: {
      type: Boolean,
      default: false,
    },

    // 🧾 Clearance Status
    clearanceStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    isCleared: {
      type: Boolean,
      default: false,
    },
    // 💬 Chatbot Routing Memory
lastDepartment: {
  type: String,
  enum: ["general", "finance", "faculty", "library", "exam_office", "lab"],
  default: "general",
},
lastRoutingOffer: {
  type: String,
  enum: ["finance", "faculty", "library", "exam_office", "lab"],
  default: null,
},

    // 📷 Profile & Notifications
    profilePicture: {
      type: String,
      default: "",
    },
    fcmToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema)
export default Student
