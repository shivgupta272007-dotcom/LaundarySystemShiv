const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const store = require('../store/inMemory');
const { getIsConnected } = require('../config/db');
const { GARMENT_PRICES, getEstimatedDeliveryDate } = require('../config/garments');

// Helper: generate unique order ID like LD-00042
let orderSeq = 0;
async function generateOrderId() {
  if (getIsConnected()) {
    const count = await Order.countDocuments();
    orderSeq = Math.max(orderSeq, count);
  }
  orderSeq++;
  return `LD-${String(orderSeq).padStart(5, '0')}`;
}

// ───────────────────────────────────────────────────────────
// POST /api/orders — Create a new order
// ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { customerName, phoneNumber, garments, notes } = req.body;

    // Validation
    if (!customerName || !phoneNumber || !garments || !Array.isArray(garments) || garments.length === 0) {
      return res.status(400).json({
        error: 'customerName, phoneNumber, and garments[] are required.',
      });
    }

    // Validate phone number format (basic)
    const phoneClean = phoneNumber.replace(/[^0-9+]/g, '');
    if (phoneClean.length < 10) {
      return res.status(400).json({ error: 'Phone number must be at least 10 digits.' });
    }

    // Build garment items with pricing
    const processedGarments = garments.map(g => {
      const price = g.pricePerItem || GARMENT_PRICES[g.garmentType] || 0;
      if (!g.garmentType) throw new Error('Each garment must have a garmentType.');
      if (!g.quantity || g.quantity < 1) throw new Error(`Invalid quantity for ${g.garmentType}.`);
      if (price === 0) throw new Error(`Unknown garment type: ${g.garmentType}. Available types: ${Object.keys(GARMENT_PRICES).join(', ')}`);

      return {
        garmentType: g.garmentType,
        quantity: g.quantity,
        pricePerItem: price,
        subtotal: price * g.quantity,
      };
    });

    const totalAmount = processedGarments.reduce((sum, g) => sum + g.subtotal, 0);
    const orderId = await generateOrderId();
    const estimatedDelivery = getEstimatedDeliveryDate(processedGarments);

    const orderData = {
      orderId,
      customerName: customerName.trim(),
      phoneNumber: phoneClean,
      garments: processedGarments,
      totalAmount,
      status: 'RECEIVED',
      estimatedDelivery,
      notes: notes || '',
    };

    let order;
    if (getIsConnected()) {
      order = await Order.create(orderData);
    } else {
      order = store.createOrder(orderData);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/orders — List orders with optional filters
// ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, customer, phone, garmentType, page = 1, limit = 50 } = req.query;

    if (getIsConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (customer) filter.customerName = { $regex: customer, $options: 'i' };
      if (phone) filter.phoneNumber = { $regex: phone };
      if (garmentType) filter['garments.garmentType'] = { $regex: garmentType, $options: 'i' };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      const total = await Order.countDocuments(filter);

      res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } else {
      const orders = store.findOrders({
        status,
        customerName: customer,
        phoneNumber: phone,
        garmentType,
      });
      res.json({ orders, total: orders.length, page: 1, totalPages: 1 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/orders/:orderId — Get single order
// ───────────────────────────────────────────────────────────
router.get('/:orderId', async (req, res) => {
  try {
    let order;
    if (getIsConnected()) {
      order = await Order.findOne({ orderId: req.params.orderId });
    } else {
      order = store.findOrderById(req.params.orderId);
    }

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────
// PATCH /api/orders/:orderId/status — Update order status
// ───────────────────────────────────────────────────────────
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let order;
    if (getIsConnected()) {
      order = await Order.findOneAndUpdate(
        { orderId: req.params.orderId },
        { status },
        { new: true }
      );
    } else {
      order = store.updateOrderStatus(req.params.orderId, status);
    }

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ message: 'Status updated', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────
// DELETE /api/orders/:orderId — Delete an order
// ───────────────────────────────────────────────────────────
router.delete('/:orderId', async (req, res) => {
  try {
    let order;
    if (getIsConnected()) {
      order = await Order.findOneAndDelete({ orderId: req.params.orderId });
    } else {
      order = store.deleteOrder(req.params.orderId);
    }

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ message: 'Order deleted', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/orders/prices/list — Get garment price list
// ───────────────────────────────────────────────────────────
router.get('/prices/list', async (req, res) => {
  res.json({ prices: GARMENT_PRICES });
});

module.exports = router;
