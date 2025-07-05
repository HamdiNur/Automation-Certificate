import dotenv from "dotenv"
import Finance from "../models/finance.js"
import { connectDB } from "../config/db.js"

dotenv.config()
await connectDB()

const cleanupFinanceRecords = async () => {
  try {
    console.log("🧹 Cleaning up ALL finance records...")

    const totalRecords = await Finance.countDocuments({})
    console.log(`📊 Found ${totalRecords} finance records to delete`)

    if (totalRecords === 0) {
      console.log("✅ No finance records to clean up")
      process.exit(0)
    }

    // Ask for confirmation (in production, you might want to add a prompt)
    console.log("⚠️  This will DELETE ALL finance records!")
    console.log("⚠️  Make sure this is what you want to do!")

    const result = await Finance.deleteMany({})
    console.log(`✅ Deleted ${result.deletedCount} finance records`)

    console.log("🎉 Cleanup complete! You can now run the generation script.")
    process.exit(0)
  } catch (err) {
    console.error("❌ Error during cleanup:", err.message)
    process.exit(1)
  }
}

cleanupFinanceRecords()
