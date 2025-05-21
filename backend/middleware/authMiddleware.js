import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🟨 Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log("🟦 Token:", token);
    console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded Token:", decoded);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ error: 'User not found in DB' });

    next();
  } catch (err) {
    console.error('❌ Auth Middleware Error:', err.message);
    res.status(401).json({ error: `Not authorized, token failed: ${err.message}` });
  }
};

export default auth;

// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import dotenv from 'dotenv';

// dotenv.config();

// const auth = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ error: 'No token provided' });
//     }

//     const token = authHeader.split(' ')[1];
//     console.log("🟨 Authorization Header:", authHeader);
//     console.log("🟦 Token:", token);
//     console.log("🕓 Current Server Time (ms):", Date.now());
//     console.log("🕓 Current Server Time (UTC):", new Date().toISOString());

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("📦 Decoded Token:", decoded);
//     console.log("⏳ Token Expiration (ms):", decoded.exp * 1000);
//     console.log("⏳ Token Expiration (UTC):", new Date(decoded.exp * 1000).toISOString());

//     req.user = await User.findById(decoded.id).select('-password');
//     next();
//   } catch (err) {
//     console.error('❌ Auth Middleware Error:', err.message);
//     res.status(401).json({ error: `Not authorized, token failed: ${err.message}` });
//   }
// };

// export default auth;

