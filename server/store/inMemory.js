/**
 * In-memory storage fallback when MongoDB is unavailable.
 * Implements the same interface as Mongoose models for seamless switching.
 */

const { v4: uuidv4 } = require('crypto');

class InMemoryStore {
  constructor() {
    this.orders = [];
    this.users = [];
    this.orderCounter = 0;
  }

  // ─── Orders ───────────────────────────────────────────────

  createOrder(data) {
    const order = {
      _id: this._generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.push(order);
    return { ...order };
  }

  findOrders(filter = {}) {
    let results = [...this.orders];

    if (filter.status) {
      results = results.filter(o => o.status === filter.status);
    }
    if (filter.customerName) {
      const regex = new RegExp(filter.customerName, 'i');
      results = results.filter(o => regex.test(o.customerName));
    }
    if (filter.phoneNumber) {
      results = results.filter(o => o.phoneNumber.includes(filter.phoneNumber));
    }
    if (filter.garmentType) {
      const regex = new RegExp(filter.garmentType, 'i');
      results = results.filter(o =>
        o.garments.some(g => regex.test(g.garmentType))
      );
    }

    // Sort by newest first
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return results;
  }

  findOrderById(orderId) {
    return this.orders.find(o => o.orderId === orderId) || null;
  }

  updateOrderStatus(orderId, status) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date();
    return { ...order };
  }

  deleteOrder(orderId) {
    const idx = this.orders.findIndex(o => o.orderId === orderId);
    if (idx === -1) return null;
    const [removed] = this.orders.splice(idx, 1);
    return removed;
  }

  getDashboard() {
    const total = this.orders.length;
    const revenue = this.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const statusCounts = {};
    for (const o of this.orders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    }
    return { totalOrders: total, totalRevenue: revenue, ordersByStatus: statusCounts };
  }

  // ─── Users ────────────────────────────────────────────────

  createUser(data) {
    const user = {
      _id: this._generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return { ...user };
  }

  findUserByUsername(username) {
    return this.users.find(u => u.username === username) || null;
  }

  // ─── Helpers ──────────────────────────────────────────────

  _generateId() {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  getNextOrderNumber() {
    this.orderCounter++;
    return this.orderCounter;
  }
}

// Singleton instance
module.exports = new InMemoryStore();
