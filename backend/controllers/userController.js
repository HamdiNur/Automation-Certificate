import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
    const { fullName, email, password, role, userId } = req.body;
  
    const existingUser = await User.findOne({ userId });
    if (existingUser) return res.status(400).json({ error: 'User ID already exists' });
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'student',
      userId
    });
  
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        userId: user.userId,
        role: user.role
      }
    });
  };
  

  //login
  export const loginUser = async (req, res) => {
    const { userId, password } = req.body;
  
    try {
      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ success:false, message: 'User not found' });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({success:false, message: 'Invalid credentials' });
  
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1d'
      });
  
      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          userId: user.userId,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  