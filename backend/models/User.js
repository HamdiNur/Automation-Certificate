import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows null values, only enforces unique if value is provided
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    rawPassword: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "student", "staff", "finance", "library", "faculty", "exam_office", "lab"],
      default: "student",
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String, // For staff
    },
    yearOfEmployment: {
      type: Number, // e.g., 2023
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ✅ NEW: Default Examination Officer Flag
    isDefaultExamOfficer: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    rolePermissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
)

const User = mongoose.models.User || mongoose.model("User", userSchema)
export default User
