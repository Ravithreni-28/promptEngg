const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAdminStats, getUsers, deleteUser } = require('../controllers/adminController');

router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
