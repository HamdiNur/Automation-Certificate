import mongoose from 'mongoose';

const financeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },

  semester: { // 🔹 Added to group transactions per semester
    type: Number,
    required: true,
  },

  type: { // 🔹 Charge or Payment
    type: String,
    enum: ['Charge', 'Payment'],
    required: true,
  },

  description: { // 🔹 e.g., "Tuition Fee", "Other Charges", "Student Paid 145"
    type: String,
    required: true,
  },

  amount: { // 🔹 The value of this transaction
    type: Number,
    required: true,
  },

  paymentMethod: { // 🔹 Optional (for payments only)
    type: String,
    enum: ['EVC Plus', 'Cash', 'Waiver'],
    default: 'Cash',
  },

  receiptNumber: { // 🔹 Optional: if your app shows receipt codes
    type: String,
  },

  status: { // 🔹 Optional: could be helpful if approval needed
    type: String,
    enum: ['Pending', 'Approved','Rejected'],
    default: 'Pending',
  },

  balanceAfter: { // 🔹 Optional: store real-time balance for this transaction
    type: Number,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
export default mongoose.model('Finance', financeSchema);