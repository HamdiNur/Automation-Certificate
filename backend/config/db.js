import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config()

// export const connectDB=async ()=>{
//     await mongoose.connect('mongodb+srv://fullstack:ham43di21@cluster0.zvonhpt.mongodb.net/automation-certi?retryWrites=true&w=majority&appName=Cluster0').then(()=>console.log("DB Connected"));
// }

export const connectDB = async () => {
    await mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log("DB Connected"))
      .catch((err) => {
        console.error("MongoDB error:", err.message);
        process.exit(1);
      });
  };