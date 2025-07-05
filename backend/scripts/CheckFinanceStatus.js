import dotenv from "dotenv"
import Student from "../models/Student.js"
import Finance from "../models/finance.js"
import { connectDB } from "../config/db.js"

dotenv.config()
await connectDB()

const checkFinanceStatus = async () => {
  try {
    console.log("📊 Checking Finance Generation Status...\n")

    const totalStudents = await Student.countDocuments({})
    console.log(`👥 Total Students: ${totalStudents}`)

    const studentsWithFinance = await Finance.distinct("studentId")
    console.log(`💰 Students with Finance Records: ${studentsWithFinance.length}`)

    const graduationFeeCharges = await Finance.countDocuments({
      type: "Charge",
      description: { $regex: /Graduation Fee/i },
    })
    console.log(`🎓 Graduation Fee Charges: ${graduationFeeCharges}`)

    const pendingGradFees = await Finance.countDocuments({
      type: "Charge",
      description: { $regex: /Graduation Fee/i },
      status: "Pending",
    })
    console.log(`⏳ Pending Graduation Fees: ${pendingGradFees}`)

    const paidGradFees = await Finance.countDocuments({
      type: "Payment",
      description: { $regex: /Graduation Fee/i },
      status: "Approved",
    })
    console.log(`✅ Paid Graduation Fees: ${paidGradFees}`)

    const totalFinanceRecords = await Finance.countDocuments({})
    console.log(`📋 Total Finance Records: ${totalFinanceRecords}`)

    console.log("\n📈 Expected vs Actual:")
    console.log(`Expected Records per Student: ~18 (8 semesters × 2 + admission + grad fee)`)
    console.log(`Expected Total Records: ~${totalStudents * 18}`)
    console.log(`Actual Total Records: ${totalFinanceRecords}`)

    // Sample a few students to verify structure
    console.log("\n🔍 Sample Student Finance Records:")
    const sampleStudents = await Student.find({}).limit(3)

    for (const student of sampleStudents) {
      const records = await Finance.find({ studentId: student._id }).sort({ semester: 1, createdAt: 1 })
      console.log(`\n👤 ${student.studentId} - ${student.fullName}:`)
      console.log(`   📊 Total Records: ${records.length}`)

      const gradFee = records.find((r) => r.description?.includes("Graduation Fee"))
      if (gradFee) {
        console.log(`   🎓 Graduation Fee: $${gradFee.amount} (${gradFee.status})`)
      } else {
        console.log(`   ❌ No Graduation Fee found`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error("❌ Error checking finance status:", err.message)
    process.exit(1)
  }
}

checkFinanceStatus()
