const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// POST /api/tax - save a tax calculation
router.post('/', async (req, res) => {
  try {
    const {
      gross_income, hra = 0, deduction_80c = 0, deduction_80d = 0, nps = 0,
      tax_old_regime, tax_new_regime, recommended_regime
    } = req.body;

    if (gross_income == null || tax_old_regime == null || tax_new_regime == null || !recommended_regime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      `INSERT INTO tax_calculations
       (user_id, gross_income, hra, deduction_80c, deduction_80d, nps, tax_old_regime, tax_new_regime, recommended_regime)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, gross_income, hra, deduction_80c, deduction_80d, nps, tax_old_regime, tax_new_regime, recommended_regime]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Save tax calc error:', err);
    res.status(500).json({ error: 'Could not save calculation' });
  }
});

// GET /api/tax - list this user's tax calculation history
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const [rows] = await pool.query(
      `SELECT * FROM tax_calculations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [req.user.id, limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch tax history error:', err);
    res.status(500).json({ error: 'Could not fetch history' });
  }
});

module.exports = router;
