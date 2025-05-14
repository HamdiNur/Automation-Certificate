import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

// Import Routes
import userRouter from './routes/userRoute.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/faculty.js';
import libraryRoutes from './routes/library.js';
import labRoutes from './routes/lab.js';
import financeRoutes from './routes/finance.js';
import examinationRoutes from './routes/examination.js';
import appointmentRoutes from './routes/appointment.js';
import groupRoutes from './routes/group.js';
import notificationRoutes from './routes/notification.js';
import clearanceRoutes from './routes/clearance.js';
import courseRoutes from './routes/course.js';

dotenv.config();

// Initialize App
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
connectDB();

// API Routes
app.use('/api/users', userRouter);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/examination', examinationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clearance', clearanceRoutes);
app.use('/api/courses', courseRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('✅ API is working.');
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server started on http://localhost:${port}`);
});
