// 📁 utils/markFinanceEligible.js
import Clearance from '../models/Clearance.js';

export const markFinanceEligible = async (studentId) => {
  try {
    const record = await Clearance.findOne({ studentId });

    if (!record) {
      console.log(`❌ No clearance found for student: ${studentId}`);
      return;
    }

    const { faculty, library, lab } = record;

    // ✅ Eligibility condition: Faculty + Library + Lab must all be approved
    const isEligible =
      faculty?.status === 'Approved' &&
      library?.status === 'Approved' &&
      lab?.status === 'Approved';

    if (isEligible) {
      // 🔄 Only update if not already eligible
      if (!record.finance.eligibleForFinance) {
        record.finance.eligibleForFinance = true;
        record.finance.status = 'Pending'; // Optional: reset status if needed
        await record.save();
        console.log(`✅ Marked eligible for finance: ${studentId}`);
      }
    } else {
      console.log(`⏩ Not eligible yet for finance: ${studentId}`);
    }

  } catch (err) {
    console.error(`❌ Failed to mark finance eligibility for ${studentId}:`, err.message);
  }
};
