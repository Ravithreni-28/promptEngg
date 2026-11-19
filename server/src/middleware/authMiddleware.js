const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ai_prompt_studio_super_secret_jwt_key_2026');
    
    // Check if user exists in MongoDB or mock payload
    if (decoded.id) {
      try {
        const user = await User.findById(decoded.id).select('-passwordHash');
        if (user) {
          req.user = user;
          return next();
        }
      } catch (err) {
        // Fallback to token payload if db offline
      }
    }

    req.user = {
      _id: decoded.id || 'user_demo_id',
      name: decoded.name || 'Demo Student',
      email: decoded.email || 'demo@example.com',
      role: decoded.role || 'user',
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
};

module.exports = { protect, adminOnly };
