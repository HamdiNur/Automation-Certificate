// 📁 utils/financeGenerator.js
import Finance from '../models/finance.js';
import Student from '../models/Student.js';

const GRADUATION_FEE = 300;

let receiptCounter = 1;
const getNextReceipt = () => `RCPT-${String(receiptCounter++).padStart(5, '0')}`;

const getSemesterBaseDates = (sem) => {
  const start = new Date(2021, 9, 10); // October 10, 2021
  const semesterStart = new Date(start.setMonth(8 + (sem - 1) * 6));
  return {
    month1: new Date(semesterStart),
    month2: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 2, 10),
    month3: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 4, 10),
    payDate: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 5, 10),
    gradDate: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 5, 5)
  };
};

export const generateFinanceForStudent = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) return;

  const financeData = [];
  let balance = 0;

  const admissionDate = new Date(2021, 8, 2);

  // Admission Charge
  balance += 25;
  financeData.push({
    studentId,
    semester: 0,
    type: 'Charge',
    description: 'Admission Fee $25',
    amount: 25,
    balanceAfter: balance,
    createdAt: admissionDate,
    paymentMethod: 'Cash',
    receiptNumber: 'N/A',
    status: 'Approved'
  });

  // Admission Payment
  balance -= 25;
  financeData.push({
    studentId,
    semester: 0,
    type: 'Payment',
    description: 'Student Paid $25 Admission Fee',
    amount: 25,
    balanceAfter: 0,
    createdAt: admissionDate,
    paymentMethod: 'Cash',
    receiptNumber: getNextReceipt(),
    status: 'Approved'
  });

  // Loop 8 semesters
  for (let sem = 1; sem <= 8; sem++) {
    const { month1, month2, month3, payDate, gradDate } = getSemesterBaseDates(sem);

    const charges = [
      { amount: 120, date: month1 },
      { amount: 145, date: month2 },
      { amount: 145, date: month3 }
    ];

    if (sem === 8) {
      // Graduation Fee as PENDING
      charges.push({
        amount: GRADUATION_FEE,
        date: gradDate,
        description: `Graduation Fee - $${GRADUATION_FEE}`,
        status: 'Pending' // 👈 mark only graduation fee as pending
      });
    }

    // Add Charges
    for (const charge of charges) {
      balance += charge.amount;

      financeData.push({
        studentId,
        semester: sem,
        type: 'Charge',
        description: charge.description || `Tuition Charge - $${charge.amount}`,
        amount: charge.amount,
        balanceAfter: balance,
        createdAt: charge.date,
        paymentMethod: 'Cash',
        receiptNumber: 'N/A',
        status: charge.status || 'Approved'
      });
    }

    // Pay only Tuition — Graduation remains unpaid
    const tuitionOnly = charges
      .filter(c => !c.description?.includes('Graduation'))
      .reduce((sum, c) => sum + c.amount, 0);

    balance -= tuitionOnly;

    financeData.push({
      studentId,
      semester: sem,
      type: 'Payment',
      description: `Student paid $${tuitionOnly} for Tuition Fee`,
      amount: tuitionOnly,
      balanceAfter: balance,
      createdAt: payDate,
      paymentMethod: 'Cash',
      receiptNumber: getNextReceipt(),
      status: 'Approved'
    });
  }

  await Finance.insertMany(financeData);
};
