const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/transport
router.get('/', async (req, res) => {
  try {
    const { destination_id, transport_type } = req.query;

    let query = `
      SELECT t.*, p.name as destination_name, p.location as destination_location, s.name as state_name
      FROM transport t
      JOIN tourist_places p ON t.destination_id = p.id
      JOIN states s ON p.state_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (destination_id) {
      query += ` AND t.destination_id = ?`;
      params.push(destination_id);
    }
    if (transport_type && transport_type !== 'Any') {
      query += ` AND t.transport_type = ?`;
      params.push(transport_type);
    }

    query += ` ORDER BY t.transport_type ASC, t.price ASC`;

    const [transports] = await pool.query(query, params);
    return res.json({ success: true, count: transports.length, transports });
  } catch (error) {
    console.error('Get Transport Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transport options.' });
  }
});

// GET /api/transport/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, p.name as destination_name, s.name as state_name
      FROM transport t
      JOIN tourist_places p ON t.destination_id = p.id
      JOIN states s ON p.state_id = s.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transport option not found.' });
    }

    return res.json({ success: true, transport: rows[0] });
  } catch (error) {
    console.error('Get Transport by ID Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transport option.' });
  }
});

// POST /api/transport (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      destination_id,
      transport_type,
      provider,
      route,
      departure_time,
      arrival_time,
      price,
      duration,
      booking_info
    } = req.body;

    if (!destination_id || !transport_type || !provider || !price) {
      return res.status(400).json({ success: false, message: 'Required transport details are missing.' });
    }

    const [result] = await pool.query(`
      INSERT INTO transport (
        destination_id, transport_type, provider, route,
        departure_time, arrival_time, price, duration, booking_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      destination_id,
      transport_type,
      provider,
      route || 'Local route',
      departure_time || '09:00',
      arrival_time || '12:00',
      parseFloat(price),
      duration || 'N/A',
      booking_info || null
    ]);

    return res.status(201).json({
      success: true,
      message: 'Transport option added successfully.',
      transportId: result.insertId
    });
  } catch (error) {
    console.error('Create Transport Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create transport option.' });
  }
});

// PUT /api/transport/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      transport_type,
      provider,
      route,
      departure_time,
      arrival_time,
      price,
      duration,
      booking_info
    } = req.body;

    await pool.query(`
      UPDATE transport SET
        transport_type = COALESCE(?, transport_type),
        provider = COALESCE(?, provider),
        route = COALESCE(?, route),
        departure_time = COALESCE(?, departure_time),
        arrival_time = COALESCE(?, arrival_time),
        price = COALESCE(?, price),
        duration = COALESCE(?, duration),
        booking_info = COALESCE(?, booking_info)
      WHERE id = ?
    `, [
      transport_type,
      provider,
      route,
      departure_time,
      arrival_time,
      price !== undefined ? parseFloat(price) : null,
      duration,
      booking_info,
      req.params.id
    ]);

    return res.json({ success: true, message: 'Transport option updated successfully.' });
  } catch (error) {
    console.error('Update Transport Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update transport option.' });
  }
});

// DELETE /api/transport/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM transport WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Transport option deleted successfully.' });
  } catch (error) {
    console.error('Delete Transport Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete transport option.' });
  }
});

module.exports = router;
