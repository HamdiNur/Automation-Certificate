import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoute.js';
import studentRoutes from './routes/studentRoutes.js';


dotenv.config(); // 

// app config 

const app =express()
const port =4003;

// middleware 

app.use(express.json())
app.use(cors())

//db connection 
connectDB();
//API endpoint
app.use("/api/users",userRouter);
app.use('/api/students', studentRoutes);

app.get("/",(req,res)=>{
    res.send("API WORKING")
})

app.listen(port,()=>{
    console.log(`Server started on http://localhost:${port}`)
})





















