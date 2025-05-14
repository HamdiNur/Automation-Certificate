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

// 🔁 Generate semester timeline
const getSemesterBaseDates = (sem) => {
  const start = new Date(2021, 9, 10); // September 1, 2021
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

      // 🔹 Admission Fee (one-time before Semester 1)
      const admissionDate = new Date(2021, 8, 2); //  25, 2021
      balance += 25;
      financeData.push({
        studentId: student._id,
        semester: 0,
        type: 'Charge',
        description: 'Admission Fee  $25',
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
        createdAt: new Date(2021, 8, 2),
        paymentMethod: faker.helpers.arrayElement(['Cash', 'EVC Plus']),
        receiptNumber: getNextReceipt(),
        status: 'Approved'
      });

      // 🔁 Loop through 8 semesters
      for (let sem = 1; sem <= 8; sem++) {
        const { month1, month2, month3, payDate, gradDate } = getSemesterBaseDates(sem);

        const charges = [
          { amount: 120, date: month1 },
          { amount: 145, date: month2 },
          { amount: 145, date: month3 }
        ];

        const hasGraduation = sem === 8 && Math.random() < 0.6;
        if (hasGraduation) {
          charges.push({
            amount: GRADUATION_FEE,
            date: gradDate,
            description: `Graduation Fee - $${GRADUATION_FEE}`
          });
        }

        // 💳 Charges
        for (const charge of charges) {
          balance += charge.amount;
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
            status: 'Approved'
          });
        }

        // 🧾 Payment if eligible
        const shouldPay = !hasGraduation || Math.random() < 0.9;
if (shouldPay) {
  const paymentDesc = hasGraduation
    ? `Total Amount student paid $${balance} for Tuition and Graduation Fees this semester`
    : `Total Amount student paid $${balance} for Tuition Fee this semester`;

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
