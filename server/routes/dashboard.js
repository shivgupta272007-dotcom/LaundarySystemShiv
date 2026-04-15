const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const store = require('../store/inMemory');
const { getIsConnected } = require('../config/db');

// ───────────────────────────────────────────────────────────
// GET /api/dashboard — Dashboard statistics
// ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    if (getIsConnected()) {
      const [totalOrders, totalRevenueResult, statusCounts, recentOrders] = await Promise.all([
        Order.countDocuments(),
        Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.find().sort({ createdAt: -1 }).limit(5),
      ]);

      const ordersByStatus = {};
      statusCounts.forEach(s => { ordersByStatus[s._id] = s.count; });

      res.json({
        totalOrders,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        ordersByStatus,
        recentOrders,
      });
    } else {
      const dashboard = store.getDashboard();
      const recent = store.findOrders({}).slice(0, 5);
      res.json({
        ...dashboard,
        recentOrders: recent,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
