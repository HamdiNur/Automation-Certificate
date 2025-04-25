import express from 'express';
import { loginUser, registerUser } from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';

const userRouter = express.Router();

// Register
userRouter.post('/register', registerUser);

// Login
userRouter.post('/login', loginUser);

userRouter.get('/profile', auth, (req, res) => {
    res.status(200).json({
      message: 'Profile fetched successfully',
      user: req.user
    });
  });
  

export default userRouter;
