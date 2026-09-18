const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { getDBStatus } = require('../config/db');

// In-memory demo user store if MongoDB is offline
const inMemoryUsers = [];

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'ai_prompt_studio_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const emailLower = email.toLowerCase().trim();

    if (getDBStatus()) {
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: emailLower,
        passwordHash,
        role: role === 'admin' ? 'admin' : 'user',
      });

      await Activity.create({
        userId: user._id,
        type: 'USER_REGISTER',
        description: `New user account created (${user.email})`,
      }).catch(() => {});

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } else {
      // In-Memory Fallback
      const existing = inMemoryUsers.find((u) => u.email === emailLower);
      if (existing) {
        return res.status(400).json({ success: false, message: 'User with this email already exists (Demo Store).' });
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUser = {
        _id: 'user_' + Date.now(),
        name,
        email: emailLower,
        passwordHash,
        role: role === 'admin' ? 'admin' : 'user',
        createdAt: new Date(),
      };
      inMemoryUsers.push(newUser);
      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const emailLower = email.toLowerCase().trim();

    if (getDBStatus()) {
      const user = await User.findOne({ email: emailLower });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      await Activity.create({
        userId: user._id,
        type: 'USER_LOGIN',
        description: `User logged in (${user.email})`,
      }).catch(() => {});

      const token = generateToken(user);

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } else {
      // In-Memory Fallback
      let user = inMemoryUsers.find((u) => u.email === emailLower);
      
      // Default demo login fallback if memory store is empty
      if (!user && (emailLower === 'demo@example.com' || emailLower === 'admin@example.com')) {
        const passwordHash = await bcrypt.hash('password123', 10);
        user = {
          _id: emailLower === 'admin@example.com' ? 'admin_demo_id' : 'user_demo_id',
          name: emailLower === 'admin@example.com' ? 'Admin User' : 'Demo Student',
          email: emailLower,
          passwordHash,
          role: emailLower === 'admin@example.com' ? 'admin' : 'user',
          createdAt: new Date(),
        };
        inMemoryUsers.push(user);
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials (Demo mode). Try demo@example.com / password123' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe };
