import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected to MongoDB');

try {
  const result = await mongoose.connection.db
    .collection('groups')
    .dropIndex('studentId_1');
  console.log('🗑️ Index "studentId_1" dropped successfully:', result);
} catch (error) {
  console.error('❌ Failed to drop index:', error.message);
}

process.exit();
