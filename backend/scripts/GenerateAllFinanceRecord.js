import dotenv from "dotenv"
import Student from "../models/Student.js"
import Finance from "../models/finance.js"
import { generateFinanceForStudent } from "../utils/financeGenerator.js"
import { connectDB } from "../config/db.js"

dotenv.config()
await connectDB()

const generateAllFinanceRecords = async () => {
  try {
    console.log("🔍 Fetching ALL students...")

    // Get all students (240 students)
    const allStudents = await Student.find({}).select("_id studentId fullName")

    console.log(`📊 Found ${allStudents.length} students`)

    if (allStudents.length === 0) {
      console.log("❌ No students found. Please add students first.")
      process.exit(1)
    }

    let processed = 0
    let skipped = 0

    for (const student of allStudents) {
      try {
        // Check if finance records already exist
        const existingRecords = await Finance.countDocuments({ studentId: student._id })

        if (existingRecords > 0) {
          console.log(`⏭️  Skipping ${student.studentId} - Finance records already exist (${existingRecords} records)`)
          skipped++
          continue
        }

        // Generate 8-semester finance records
        console.log(`💰 Generating finance for: ${student.studentId} - ${student.fullName}`)
        await generateFinanceForStudent(student._id)

        processed++

        // Progress indicator
        if (processed % 10 === 0) {
          console.log(`📈 Progress: ${processed}/${allStudents.length} students processed`)
        }
      } catch (err) {
        console.error(`❌ Error generating finance for ${student.studentId}:`, err.message)
      }
    }

    console.log("\n🎉 Finance Generation Complete!")
    console.log(`✅ Processed: ${processed} students`)
    console.log(`⏭️  Skipped: ${skipped} students (already had records)`)
    console.log(`📊 Total Records Created: ~${processed * 18} finance entries`) // ~18 records per student

    process.exit(0)
  } catch (err) {
    console.error("❌ Failed to generate finance records:", err.message)
    process.exit(1)
  }
}

generateAllFinanceRecords()
