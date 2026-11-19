const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { getDBStatus } = require('../config/db');
const memoryStore = require('../config/memoryStore');

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
      // Memory Store Fallback
      const existing = memoryStore.users.find((u) => u.email === emailLower);
      if (existing) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUser = {
        _id: 'user_' + Date.now(),
        name,
        email: emailLower,
        passwordHash,
        role: role === 'admin' ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      memoryStore.users.push(newUser);
      memoryStore.logActivity(newUser._id, 'USER_REGISTER', `New user account registered (${newUser.email})`);
      memoryStore.persist();

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
      // Memory Store Fallback
      let user = memoryStore.users.find((u) => u.email === emailLower);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Try demo@example.com / password123 or admin@example.com / password123',
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      memoryStore.logActivity(user._id, 'USER_LOGIN', `User logged in (${user.email})`);

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

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id || req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    if (getDBStatus()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (email && email.toLowerCase().trim() !== user.email) {
        const emailLower = email.toLowerCase().trim();
        const existing = await User.findOne({ email: emailLower, _id: { $ne: userId } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email is already taken by another account.' });
        }
        user.email = emailLower;
      }

      user.name = name.trim();
      await user.save();

      await Activity.create({
        userId: user._id,
        type: 'PROFILE_UPDATE',
        description: `Profile information updated for ${user.email}`,
      }).catch(() => {});

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } else {
      // Memory Store Fallback
      const user = memoryStore.users.find((u) => String(u._id) === String(userId));
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (email && email.toLowerCase().trim() !== user.email) {
        const emailLower = email.toLowerCase().trim();
        const existing = memoryStore.users.find((u) => u.email === emailLower && String(u._id) !== String(userId));
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email is already taken by another account.' });
        }
        user.email = emailLower;
      }

      user.name = name.trim();
      user.updatedAt = new Date().toISOString();

      memoryStore.logActivity(user._id, 'PROFILE_UPDATE', `Profile updated for ${user.email}`);

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
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

// PUT /api/auth/password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    if (getDBStatus()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password.' });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      await Activity.create({
        userId: user._id,
        type: 'PASSWORD_CHANGE',
        description: `Security password changed for ${user.email}`,
      }).catch(() => {});

      return res.json({
        success: true,
        message: 'Password changed successfully.',
      });
    } else {
      // Memory Store Fallback
      const user = memoryStore.users.find((u) => String(u._id) === String(userId));
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password.' });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      user.updatedAt = new Date().toISOString();

      memoryStore.logActivity(user._id, 'PASSWORD_CHANGE', `Password changed for ${user.email}`);

      return res.json({
        success: true,
        message: 'Password changed successfully.',
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, updatePassword };
