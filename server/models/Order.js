const mongoose = require('mongoose');

const garmentSchema = new mongoose.Schema({
  garmentType: { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  pricePerItem:{ type: Number, required: true },
  subtotal:    { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  garments: {
    type: [garmentSchema],
    validate: [arr => arr.length > 0, 'At least one garment is required'],
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'],
    default: 'RECEIVED',
  },
  estimatedDelivery: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Indexes for search / filter performance
orderSchema.index({ status: 1 });
orderSchema.index({ customerName: 'text' });
orderSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
