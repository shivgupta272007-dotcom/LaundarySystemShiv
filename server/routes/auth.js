const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const store = require('../store/inMemory');
const { getIsConnected } = require('../config/db');

// ───────────────────────────────────────────────────────────
// POST /api/auth/register — Register new user
// ───────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    if (getIsConnected()) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ error: 'Username already exists.' });

      const user = await User.create({ username, password, role: role || 'staff' });

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ message: 'User registered', token, user: { username: user.username, role: user.role } });
    } else {
      const existing = store.findUserByUsername(username);
      if (existing) return res.status(400).json({ error: 'Username already exists.' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = store.createUser({ username, password: hashedPassword, role: role || 'staff' });

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ message: 'User registered', token, user: { username: user.username, role: user.role } });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────
// POST /api/auth/login — Login
// ───────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    let user, isMatch;

    if (getIsConnected()) {
      user = await User.findOne({ username });
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
      isMatch = await user.comparePassword(password);
    } else {
      user = store.findUserByUsername(username);
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
