const User = require('../models/User');
const Prompt = require('../models/Prompt');
const Activity = require('../models/Activity');
const { getDBStatus } = require('../config/db');
const memoryStore = require('../config/memoryStore');

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    if (getDBStatus()) {
      const totalUsers = await User.countDocuments();
      const totalPrompts = await Prompt.countDocuments();

      const promptsWithResponses = await Prompt.find({ 'responses.0': { $exists: true } });
      const totalAIRequests = promptsWithResponses.reduce((acc, p) => acc + (p.responses?.length || 0), 0);

      const allPrompts = await Prompt.find().select('promptScores finalScore');
      const scores = allPrompts.map((p) => p.finalScore || p.promptScores?.overall || 0).filter((s) => s > 0);
      const avgPromptScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const recentActivities = await Activity.find()
        .sort({ createdAt: -1 })
        .limit(15)
        .populate('userId', 'name email');

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
      // Memory Store Fallback
      const totalUsers = memoryStore.users.length;
      const totalPrompts = memoryStore.prompts.length;

      const totalAIRequests = memoryStore.prompts.reduce(
        (acc, p) => acc + (p.responses ? p.responses.length : 0),
        0
      );

      const scores = memoryStore.prompts
        .map((p) => p.finalScore || p.promptScores?.overall || 0)
        .filter((s) => s > 0);
      const avgPromptScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const recentActivities = memoryStore.activities.slice(0, 15).map((act) => {
        const u = memoryStore.users.find((user) => String(user._id) === String(act.userId));
        return {
          ...act,
          userId: u ? { _id: u._id, name: u.name, email: u.email } : { name: 'User', email: 'user@example.com' },
        };
      });

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
      // Memory Store Fallback
      const users = memoryStore.users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      }));
      return res.json({ success: true, users });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req.user._id || req.user.id || '').toString();

    if (id === currentUserId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    if (getDBStatus()) {
      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'User not found.' });
      await Prompt.deleteMany({ userId: id });

      await Activity.create({
        userId: req.user._id,
        type: 'ADMIN_DELETE_USER',
        description: `Admin removed user ${deleted.email}`,
      }).catch(() => {});

      return res.json({ success: true, message: 'User account and associated data removed successfully.' });
    } else {
      // Memory Store Fallback
      const idx = memoryStore.users.findIndex((u) => String(u._id) === String(id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });

      const removed = memoryStore.users.splice(idx, 1)[0];
      memoryStore.prompts = memoryStore.prompts.filter((p) => String(p.userId) !== String(id));
      memoryStore.logActivity(currentUserId, 'ADMIN_DELETE_USER', `Admin removed user ${removed.email}`);

      return res.json({ success: true, message: 'User account and associated data removed successfully.' });
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
