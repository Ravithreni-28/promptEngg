const User = require('../models/User');
const Prompt = require('../models/Prompt');
const Activity = require('../models/Activity');
const { getDBStatus } = require('../config/db');

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    if (getDBStatus()) {
      const totalUsers = await User.countDocuments();
      const totalPrompts = await Prompt.countDocuments();

      const promptsWithResponses = await Prompt.find({ 'responses.0': { $exists: true } });
      const totalAIRequests = promptsWithResponses.reduce((acc, p) => acc + p.responses.length, 0);

      const allPrompts = await Prompt.find().select('promptScores finalScore');
      const scores = allPrompts.map((p) => p.finalScore || p.promptScores?.overall || 0).filter((s) => s > 0);
      const avgPromptScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const recentActivities = await Activity.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email');

      return res.json({
        success: true,
        stats: {
          totalUsers,
          totalPrompts,
          totalAIRequests,
          avgPromptScore,
        },
        recentActivities,
      });
    } else {
      return res.json({
        success: true,
        stats: {
          totalUsers: 5,
          totalPrompts: 24,
          totalAIRequests: 42,
          avgPromptScore: 85,
        },
        recentActivities: [
          { _id: 'act_1', type: 'CREATE_PROMPT', description: 'User generated 5 prompt variations', createdAt: new Date() },
          { _id: 'act_2', type: 'USER_REGISTER', description: 'New student registered (john@example.com)', createdAt: new Date() },
        ],
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    if (getDBStatus()) {
      const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
      return res.json({ success: true, users });
    } else {
      return res.json({
        success: true,
        users: [
          { _id: 'admin_demo_id', name: 'Admin User', email: 'admin@example.com', role: 'admin', createdAt: new Date() },
          { _id: 'user_demo_id', name: 'Demo Student', email: 'demo@example.com', role: 'user', createdAt: new Date() },
        ],
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    if (getDBStatus()) {
      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'User not found.' });
      await Prompt.deleteMany({ userId: id });
      return res.json({ success: true, message: 'User account and associated data removed successfully.' });
    } else {
      return res.json({ success: true, message: 'User removed (Demo mode).' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getUsers,
  deleteUser,
};
