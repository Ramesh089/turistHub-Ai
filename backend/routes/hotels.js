const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function safeJson(val) {
  if (!val) return [];
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return [val]; }
}

// GET /api/hotels
router.get('/', async (req, res) => {
  try {
    const { destination_id, budget_tier, min_rating, max_price } = req.query;

    let query = `
      SELECT h.*, p.name as destination_name, p.location as destination_location, s.name as state_name
      FROM hotels h
      LEFT JOIN tourist_places p ON h.destination_id = p.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (destination_id) {
      query += ` AND h.destination_id = ?`;
      params.push(destination_id);
    }

    if (max_price) {
      query += ` AND h.price_per_night <= ?`;
      params.push(parseFloat(max_price));
    }

    if (min_rating) {
      query += ` AND h.rating >= ?`;
      params.push(parseFloat(min_rating));
    }

    if (budget_tier === 'Budget') {
      query += ` AND h.price_per_night < 3000`;
    } else if (budget_tier === 'Moderate') {
      query += ` AND h.price_per_night BETWEEN 3000 AND 6000`;
    } else if (budget_tier === 'Luxury') {
      query += ` AND h.price_per_night > 6000`;
    }

    query += ` ORDER BY h.rating DESC, h.price_per_night ASC`;

    const [rows] = await pool.query(query, params);
    const hotels = rows.map(h => ({
      ...h,
      amenities: safeJson(h.amenities)
    }));

    return res.json({ success: true, count: hotels.length, hotels });
  } catch (error) {
    console.error('Get Hotels Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve hotels.' });
  }
});

// GET /api/hotels/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, p.name as destination_name, s.name as state_name
      FROM hotels h
      JOIN tourist_places p ON h.destination_id = p.id
      JOIN states s ON p.state_id = s.id
      WHERE h.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    const hotel = rows[0];
    hotel.amenities = safeJson(hotel.amenities);
    return res.json({ success: true, hotel });
  } catch (error) {
    console.error('Get Hotel Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve hotel.' });
  }
});

// POST /api/hotels (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      destination_id,
      name,
      location,
      price_per_night,
      rating,
      room_type,
      amenities,
      contact,
      image_url,
      address
    } = req.body;

    if (!destination_id || !name || !location || !price_per_night || !room_type) {
      return res.status(400).json({ success: false, message: 'Required hotel details are missing.' });
    }

    const amenArray = Array.isArray(amenities)
      ? amenities
      : (typeof amenities === 'string' && amenities.trim() ? amenities.split(',').map(s => s.trim()) : []);

    const [result] = await pool.query(`
      INSERT INTO hotels (
        destination_id, name, location, price_per_night, rating,
        room_type, amenities, contact, image_url, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      destination_id,
      name,
      location,
      parseFloat(price_per_night),
      parseFloat(rating) || 4.5,
      room_type,
      JSON.stringify(amenArray),
      contact || 'N/A',
      image_url || '',
      address || location
    ]);

    return res.status(201).json({
      success: true,
      message: 'Hotel added successfully.',
      hotelId: result.insertId
    });
  } catch (error) {
    console.error('Create Hotel Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create hotel.' });
  }
});

// PUT /api/hotels/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      location,
      price_per_night,
      rating,
      room_type,
      amenities,
      contact,
      image_url,
      address
    } = req.body;

    await pool.query(`
      UPDATE hotels SET
        name = COALESCE(?, name),
        location = COALESCE(?, location),
        price_per_night = COALESCE(?, price_per_night),
        rating = COALESCE(?, rating),
        room_type = COALESCE(?, room_type),
        amenities = COALESCE(?, amenities),
        contact = COALESCE(?, contact),
        image_url = COALESCE(?, image_url),
        address = COALESCE(?, address)
      WHERE id = ?
    `, [
      name,
      location,
      price_per_night !== undefined ? parseFloat(price_per_night) : null,
      rating !== undefined ? parseFloat(rating) : null,
      room_type,
      amenities ? JSON.stringify(amenities) : null,
      contact,
      image_url,
      address,
      req.params.id
    ]);

    return res.json({ success: true, message: 'Hotel updated successfully.' });
  } catch (error) {
    console.error('Update Hotel Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update hotel.' });
  }
});

// DELETE /api/hotels/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM hotels WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Hotel deleted successfully.' });
  } catch (error) {
    console.error('Delete Hotel Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete hotel.' });
  }
});

module.exports = router;
