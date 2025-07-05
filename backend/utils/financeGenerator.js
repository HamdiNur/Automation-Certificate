import Finance from "../models/finance.js"
import Student from "../models/Student.js"

const GRADUATION_FEE = 250 // Keep at 250 for description

let receiptCounter = 1
const getNextReceipt = () => `RCPT-${String(receiptCounter++).padStart(5, "0")}`

const getSemesterBaseDates = (sem) => {
  const start = new Date(2021, 9, 10) // October 10, 2021
  const semesterStart = new Date(start.setMonth(8 + (sem - 1) * 6))
  return {
    month1: new Date(semesterStart),
    month2: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 2, 10),
    month3: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 4, 10),
    payDate: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 5, 10),
    gradDate: new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 5, 5),
  }
}

export const generateFinanceForStudent = async (studentId) => {
  const student = await Student.findById(studentId)
  if (!student) return

  console.log(`💰 Generating 8-semester finance records for: ${student.studentId}`)

  const financeData = []
  let balance = 0

  const admissionDate = new Date(2021, 8, 2)

  // Admission Charge
  balance += 25
  financeData.push({
    studentId,
    semester: 0,
    type: "Charge",
    description: "Admission Fee $25",
    amount: 25,
    balanceAfter: balance,
    createdAt: admissionDate,
    paymentMethod: "EVC Plus",
    receiptNumber: "N/A",
    status: "Approved",
  })

  // Admission Payment
  balance -= 25
  financeData.push({
    studentId,
    semester: 0,
    type: "Payment",
    description: "Student Paid $25 Admission Fee",
    amount: 25,
    balanceAfter: 0,
    createdAt: admissionDate,
    paymentMethod: "EVC Plus",
    receiptNumber: getNextReceipt(),
    status: "Approved",
  })

  // Loop 8 semesters
  for (let sem = 1; sem <= 8; sem++) {
    const { month1, month2, month3, payDate, gradDate } = getSemesterBaseDates(sem)

    const charges = [
      { amount: 120, date: month1 },
      { amount: 145, date: month2 },
      { amount: 145, date: month3 },
    ]

    // ✅ Add graduation fee in semester 8
    if (sem === 8) {
      charges.push({
        amount: GRADUATION_FEE,
        date: gradDate,
        description: `Graduation Fee - $${GRADUATION_FEE}`, // Shows $250 in description
        status: "Pending",
      })
    }

    for (const charge of charges) {
      balance += charge.amount
      financeData.push({
        studentId,
        semester: sem,
        type: "Charge",
        description: charge.description || `Tuition Charge - $${charge.amount}`,
        amount: charge.amount,
        balanceAfter: balance,
        createdAt: charge.date,
        paymentMethod: "EVC Plus",
        receiptNumber: "N/A",
        status: charge.status || "Approved",
      })
    }

    // Pay tuition only (not graduation fee)
    const tuitionOnly = charges
      .filter((c) => !c.description?.includes("Graduation"))
      .reduce((sum, c) => sum + c.amount, 0)

    balance -= tuitionOnly
    financeData.push({
      studentId,
      semester: sem,
      type: "Payment",
      description: `Student paid $${tuitionOnly} for Tuition Fee`,
      amount: tuitionOnly,
      balanceAfter: balance,
      createdAt: payDate,
      paymentMethod: "EVC Plus",
      receiptNumber: getNextReceipt(),
      status: "Approved",
    })

    // 🔥 FIXED: Use valid payment method
    if (sem === 8) {
      balance -= 249.99
      financeData.push({
        studentId,
        semester: 8,
        type: "Payment",
        description: "Graduation Fee Payment - $249.99 (Test Setup)",
        amount: 249.99,
        balanceAfter: balance, // Should be 0.01
        createdAt: new Date(gradDate.getTime() + 1000), // 1 second after charge
        paymentMethod: "EVC Plus", // 🔥 CHANGED: Use valid enum value
        receiptNumber: `TEST-${Date.now()}`,
        status: "Approved",
      })
    }
  }

  await Finance.insertMany(financeData)
  console.log(`✅ Generated finance records with $${GRADUATION_FEE} graduation fee`)
  console.log(`💡 Student owes $0.01 remaining (perfect for testing!)`)
}
