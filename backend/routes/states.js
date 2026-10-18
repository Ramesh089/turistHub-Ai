const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/states
router.get('/', async (req, res) => {
  try {
    const [states] = await pool.query(`
      SELECT s.*, COUNT(p.id) as places_count
      FROM states s
      LEFT JOIN tourist_places p ON s.id = p.state_id
      GROUP BY s.id
      ORDER BY s.name ASC
    `);

    return res.json({ success: true, states });
  } catch (error) {
    console.error('Get States Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch states.' });
  }
});

// GET /api/states/cultures/all
router.get('/cultures/all', async (req, res) => {
  try {
    const [cultures] = await pool.query(`
      SELECT c.*, s.name as state_name
      FROM cultures c
      JOIN states s ON c.state_id = s.id
      ORDER BY c.id ASC
    `);
    return res.json({ success: true, cultures });
  } catch (error) {
    console.error('Get Cultures Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch culture data.' });
  }
});

// GET /api/states/festivals/all
router.get('/festivals/all', async (req, res) => {
  try {
    const [festivals] = await pool.query(`
      SELECT f.*, s.name as state_name
      FROM festivals f
      JOIN states s ON f.state_id = s.id
      ORDER BY f.id ASC
    `);
    return res.json({ success: true, festivals });
  } catch (error) {
    console.error('Get Festivals Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch festival data.' });
  }
});

// GET /api/states/:id
router.get('/:id', async (req, res) => {
  try {
    const [states] = await pool.query('SELECT * FROM states WHERE id = ?', [req.params.id]);
    if (states.length === 0) {
      return res.status(404).json({ success: false, message: 'State not found.' });
    }

    const state = states[0];
    const [places] = await pool.query('SELECT * FROM tourist_places WHERE state_id = ?', [state.id]);
    const [cultures] = await pool.query('SELECT * FROM cultures WHERE state_id = ?', [state.id]);
    const [festivals] = await pool.query('SELECT * FROM festivals WHERE state_id = ?', [state.id]);

    return res.json({
      success: true,
      state: {
        ...state,
        places,
        cultures,
        festivals
      }
    });
  } catch (error) {
    console.error('Get State by ID Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch state details.' });
  }
});

module.exports = router;
