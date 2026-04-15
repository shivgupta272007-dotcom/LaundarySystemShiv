require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./server/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/orders', require('./server/routes/orders'));
app.use('/api/dashboard', require('./server/routes/dashboard'));
app.use('/api/auth', require('./server/routes/auth'));

// ─── Garment prices endpoint ────────────────────────────────
const { GARMENT_PRICES } = require('./server/config/garments');
app.get('/api/prices', (req, res) => {
  res.json({ prices: GARMENT_PRICES });
});

// ─── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve frontend for any non-API route ───────────────────
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ───────────────────────────────────────────
async function start() {
  // Try MongoDB — fall back to in-memory if unavailable
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🧺 Laundry Order System running at http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api\n`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
