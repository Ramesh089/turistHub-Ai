const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/guides
router.get('/', async (req, res) => {
  try {
    const { destination_id, specialization } = req.query;

    let query = `
      SELECT g.*, p.name as destination_name, s.name as state_name,
             COALESCE(g.capacity, 10) AS capacity,
             COALESCE((
               SELECT COUNT(*)
               FROM bookings b
               WHERE b.guide_id = g.id AND b.status IN ('Confirmed', 'Completed', 'Paid')
             ), 0) AS booked_count
      FROM guides g
      LEFT JOIN tourist_places p ON g.destination_id = p.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (destination_id) {
      query += ` AND g.destination_id = ?`;
      params.push(destination_id);
    }

    if (specialization) {
      query += ` AND g.specialization LIKE ?`;
      params.push(`%${specialization}%`);
    }

    query += ` ORDER BY g.rating DESC, g.experience_years DESC`;

    const [rows] = await pool.query(query, params);
    const guides = rows.map(g => {
      const capacity = Number(g.capacity || 10);
      const bookedCount = Number(g.booked_count || 0);
      const remainingCapacity = Math.max(0, capacity - bookedCount);
      return {
        ...g,
        capacity,
        booked_count: bookedCount,
        remaining_capacity: remainingCapacity,
        is_available: remainingCapacity > 0,
        availability_status: remainingCapacity <= 0 ? 'Fully booked' : 'Available'
      };
    });

    return res.json({ success: true, count: guides.length, guides });
  } catch (error) {
    console.error('Get Guides Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve guides.' });
  }
});

// GET /api/guides/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT g.*, p.name as destination_name, s.name as state_name,
             COALESCE(g.capacity, 10) AS capacity,
             COALESCE((
               SELECT COUNT(*)
               FROM bookings b
               WHERE b.guide_id = g.id AND b.status IN ('Confirmed', 'Completed', 'Paid')
             ), 0) AS booked_count
      FROM guides g
      LEFT JOIN tourist_places p ON g.destination_id = p.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE g.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Guide not found.' });
    }

    const guide = rows[0];
    const capacity = Number(guide.capacity || 10);
    const bookedCount = Number(guide.booked_count || 0);
    const remainingCapacity = Math.max(0, capacity - bookedCount);
    guide.capacity = capacity;
    guide.booked_count = bookedCount;
    guide.remaining_capacity = remainingCapacity;
    guide.is_available = remainingCapacity > 0;
    guide.availability_status = remainingCapacity <= 0 ? 'Fully booked' : 'Available';

    return res.json({ success: true, guide });
  } catch (error) {
    console.error('Get Guide Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve guide.' });
  }
});

// POST /api/guides (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      destination_id,
      name,
      languages,
      experience_years,
      specialization,
      price_per_day,
      rating,
      contact,
      image_url,
      capacity
    } = req.body;

    if (!destination_id || !name || !languages || !specialization || !price_per_day) {
      return res.status(400).json({ success: false, message: 'Required guide details are missing.' });
    }

    const guideCapacity = capacity && parseInt(capacity, 10) > 0 ? parseInt(capacity, 10) : 10;

    const [result] = await pool.query(`
      INSERT INTO guides (
        destination_id, name, languages, experience_years,
        specialization, price_per_day, rating, contact, image_url, capacity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      destination_id,
      name,
      languages,
      parseInt(experience_years) || 1,
      specialization,
      parseFloat(price_per_day),
      parseFloat(rating) || 4.8,
      contact || 'N/A',
      image_url || '',
      guideCapacity
    ]);

    return res.status(201).json({
      success: true,
      message: 'Guide added successfully.',
      guideId: result.insertId,
      capacity: guideCapacity,
      remaining_capacity: guideCapacity,
      availability_status: 'Available'
    });
  } catch (error) {
    console.error('Create Guide Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create guide.' });
  }
});

// PUT /api/guides/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      languages,
      experience_years,
      specialization,
      price_per_day,
      rating,
      contact,
      image_url,
      capacity
    } = req.body;

    await pool.query(`
      UPDATE guides SET
        name = COALESCE(?, name),
        languages = COALESCE(?, languages),
        experience_years = COALESCE(?, experience_years),
        specialization = COALESCE(?, specialization),
        price_per_day = COALESCE(?, price_per_day),
        rating = COALESCE(?, rating),
        contact = COALESCE(?, contact),
        image_url = COALESCE(?, image_url),
        capacity = COALESCE(?, capacity)
      WHERE id = ?
    `, [
      name,
      languages,
      experience_years !== undefined ? parseInt(experience_years) : null,
      specialization,
      price_per_day !== undefined ? parseFloat(price_per_day) : null,
      rating !== undefined ? parseFloat(rating) : null,
      contact,
      image_url,
      capacity !== undefined && capacity !== null ? parseInt(capacity, 10) : null,
      req.params.id
    ]);

    return res.json({ success: true, message: 'Guide updated successfully.' });
  } catch (error) {
    console.error('Update Guide Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update guide.' });
  }
});

// DELETE /api/guides/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM guides WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Guide deleted successfully.' });
  } catch (error) {
    console.error('Delete Guide Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete guide.' });
  }
});

module.exports = router;
