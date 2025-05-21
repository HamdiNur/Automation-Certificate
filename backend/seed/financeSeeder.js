// 📁 seed/financeSeeder.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import Finance from '../models/finance.js';
import Student from '../models/Student.js';
import { connectDB } from '../config/db.js';

dotenv.config();
await connectDB();

const GRADUATION_FEE = 300;
let receiptCounter = 1;

const getNextReceipt = () => `RCPT-${String(receiptCounter++).padStart(5, '0')}`;

const getSemesterBaseDates = (sem) => {
  const start = new Date(2021, 9, 10);
  const semesterStart = new Date(start.setMonth(8 + (sem - 1) * 6));
  return {
    month1: new Date(semesterStart),
    month2: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 2, 10),
    month3: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 4, 10),
    payDate: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 5, 10),
    gradDate: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 5, 5)
  };
};

const seedFinance = async () => {
  try {
    await Finance.deleteMany();
    const students = await Student.find({});
    const financeData = [];

    for (const student of students) {
      let balance = 0;

      // 🧾 Admission Fee
      const admissionDate = new Date(2021, 8, 2);
      balance += 25;
      financeData.push({
        studentId: student._id,
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

      balance -= 25;
      financeData.push({
        studentId: student._id,
        semester: 0,
        type: 'Payment',
        description: 'Student Paid $25 Admission Fee',
        amount: 25,
        balanceAfter: 0,
        createdAt: admissionDate,
        paymentMethod: faker.helpers.arrayElement(['Cash', 'EVC Plus']),
        receiptNumber: getNextReceipt(),
        status: 'Approved'
      });

      // 🔁 Loop 8 semesters
      for (let sem = 1; sem <= 8; sem++) {
        const { month1, month2, month3, payDate, gradDate } = getSemesterBaseDates(sem);

        const charges = [
          { amount: 120, date: month1 },
          { amount: 145, date: month2 },
          { amount: 145, date: month3 }
        ];

        // 🎓 Graduation logic — only for semester 8
        let graduationScenario = null;
        if (sem === 8) {
          const random = Math.random();
          if (random < 0.33) graduationScenario = 'notCharged';
          else if (random < 0.66) graduationScenario = 'chargedNotPaid';
          else graduationScenario = 'chargedAndPaid';

          if (graduationScenario === 'chargedNotPaid' || graduationScenario === 'chargedAndPaid') {
            charges.push({
              amount: GRADUATION_FEE,
              date: gradDate,
              description: `Graduation Fee - $${GRADUATION_FEE}`
            });
          }
        }

        // 💳 Add Charges
        for (const charge of charges) {
          balance += charge.amount;

          const isGraduationCharge = charge.description?.includes("Graduation");
          const isPendingGradFee = graduationScenario === 'chargedNotPaid' && isGraduationCharge;

          financeData.push({
            studentId: student._id,
            semester: sem,
            type: 'Charge',
            description: charge.description || `Tuition Charge - $${charge.amount}`,
            amount: charge.amount,
            balanceAfter: balance,
            createdAt: charge.date,
            paymentMethod: 'Cash',
            receiptNumber: 'N/A',
            status: isPendingGradFee ? 'Pending' : 'Approved'
          });
        }

        // ✅ Add Payment (skip only if graduation fee was charged but not paid)
        const skipPayment = graduationScenario === 'chargedNotPaid';
        if (!skipPayment) {
          const paymentDesc =
            graduationScenario === 'chargedAndPaid'
              ? `Student paid $${balance} for Tuition and Graduation Fee`
              : `Student paid $${balance} for Tuition Fee`;

          financeData.push({
            studentId: student._id,
            semester: sem,
            type: 'Payment',
            description: paymentDesc,
            amount: balance,
            balanceAfter: 0,
            createdAt: payDate,
            paymentMethod: faker.helpers.arrayElement(['Cash', 'EVC Plus']),
            receiptNumber: getNextReceipt(),
            status: 'Approved'
          });

          balance = 0;
        }
      }
    }

    await Finance.insertMany(financeData);
    console.log(`✅ Seeded finance records for ${students.length} students`);
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedFinance();
