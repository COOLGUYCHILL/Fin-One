const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// POST /api/conversions - save a conversion
router.post('/', async (req, res) => {
  try {
    const { from_currency, to_currency, amount, converted_amount, rate } = req.body;

    if (!from_currency || !to_currency || amount == null || converted_amount == null || rate == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      `INSERT INTO conversions (user_id, from_currency, to_currency, amount, converted_amount, rate)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, from_currency, to_currency, amount, converted_amount, rate]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Save conversion error:', err);
    res.status(500).json({ error: 'Could not save conversion' });
  }
});

// GET /api/conversions - list this user's history (most recent first)
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const [rows] = await pool.query(
      `SELECT id, from_currency, to_currency, amount, converted_amount, rate, created_at
       FROM conversions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [req.user.id, limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch conversions error:', err);
    res.status(500).json({ error: 'Could not fetch history' });
  }
});

// DELETE /api/conversions - clear this user's history
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM conversions WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Clear conversions error:', err);
    res.status(500).json({ error: 'Could not clear history' });
  }
});

module.exports = router;
