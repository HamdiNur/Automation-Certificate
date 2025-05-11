const financeSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    totalFee: Number,
    paidAmount: Number,
    remainingBalance: Number,
    paymentMethod: { type: String, enum: ['EVC Plus', 'Cash'] },
    status: { type: String, enum: ['Pending', 'Cleared', 'Rejected'], default: 'Pending' },
    remarks: String,
    clearedAt: Date,
    approvedBy: String,
    updatedAt: { type: Date, default: Date.now }
  });