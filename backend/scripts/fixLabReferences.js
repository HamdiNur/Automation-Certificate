import mongoose from "mongoose";
import dotenv from "dotenv";
import Lab from "../models/lab.js"; // ✅ adjust if your path is different

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // ✅ from your .env
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

const fixLabReferences = async () => {
  try {
    const labs = await Lab.find();

    for (let lab of labs) {
      let needsUpdate = false;
      let groupId = lab.groupId;
      let members = lab.members;

      // Convert string groupId to ObjectId if needed
      if (typeof groupId === "string") {
        groupId = mongoose.Types.ObjectId(groupId);
        needsUpdate = true;
      }

      // Convert member strings to ObjectIds if needed
      const newMembers = members.map((m) =>
        typeof m === "string" ? mongoose.Types.ObjectId(m) : m
      );

      if (JSON.stringify(newMembers) !== JSON.stringify(members)) {
        members = newMembers;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Lab.updateOne(
          { _id: lab._id },
          {
            $set: {
              groupId,
              members,
            },
          }
        );
        console.log(`🔄 Updated: ${lab._id}`);
      }
    }

    console.log("🎉 All lab records fixed.");
    process.exit();
  } catch (err) {
    console.error("❌ Error during fix:", err.message);
    process.exit(1);
  }
};

await connectDB();
await fixLabReferences();
