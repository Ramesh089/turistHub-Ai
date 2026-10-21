const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function safeJson(val) {
  if (!val) return [];
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return [val]; }
}

// GET /api/packages
router.get('/', async (req, res) => {
  try {
    const { destination_id, max_price, duration } = req.query;

    let query = `
      SELECT pkg.*, p.name as destination_name, p.location as destination_location, s.name as state_name
      FROM travel_packages pkg
      LEFT JOIN tourist_places p ON pkg.destination_id = p.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (destination_id) {
      query += ` AND pkg.destination_id = ?`;
      params.push(destination_id);
    }
    if (max_price) {
      query += ` AND pkg.price <= ?`;
      params.push(parseFloat(max_price));
    }
    if (duration) {
      query += ` AND pkg.duration_days = ?`;
      params.push(parseInt(duration));
    }

    query += ` ORDER BY pkg.rating DESC, pkg.price ASC`;

    const [rows] = await pool.query(query, params);
    const packages = rows.map(r => ({
      ...r,
      activities: safeJson(r.activities)
    }));

    return res.json({ success: true, count: packages.length, packages });
  } catch (error) {
    console.error('Get Packages Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch travel packages.' });
  }
});

// GET /api/packages/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pkg.*, p.name as destination_name, p.location as destination_location, p.description as destination_desc, s.name as state_name
      FROM travel_packages pkg
      LEFT JOIN tourist_places p ON pkg.destination_id = p.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE pkg.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const pkg = rows[0];
    pkg.activities = safeJson(pkg.activities);

    return res.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Get Package by ID Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve package.' });
  }
});

// POST /api/packages (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      destination_id, title, company_name, duration_days, duration_nights,
      price, transport_type, hotel_type, food_included, guide_included,
      activities, description, image_url
    } = req.body;

    if (!destination_id || !title || !price || !duration_days) {
      return res.status(400).json({ success: false, message: 'Required package details missing.' });
    }

    const actsArray = Array.isArray(activities)
      ? activities
      : (typeof activities === 'string' && activities.trim() ? activities.split(',').map(s => s.trim()) : []);

    const [result] = await pool.query(`
      INSERT INTO travel_packages (
        destination_id, title, company_name, duration_days, duration_nights,
        price, transport_type, hotel_type, food_included, guide_included,
        activities, description, image_url, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.9)
    `, [
      destination_id, title, company_name || 'Incredible Tours',
      duration_days, duration_nights || (duration_days - 1), price,
      transport_type || 'AC Transport', hotel_type || 'Comfort Heritage Hotel',
      food_included !== false, guide_included !== false,
      JSON.stringify(actsArray), description || '', image_url || ''
    ]);

    return res.status(201).json({ success: true, message: 'Package created successfully.', packageId: result.insertId });
  } catch (error) {
    console.error('Create Package Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create tour package.' });
  }
});

// PUT /api/packages/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      destination_id, title, company_name, duration_days, duration_nights,
      price, transport_type, hotel_type, food_included, guide_included,
      activities, description, image_url
    } = req.body;

    await pool.query(`
      UPDATE travel_packages SET
        destination_id = COALESCE(?, destination_id),
        title = COALESCE(?, title),
        company_name = COALESCE(?, company_name),
        duration_days = COALESCE(?, duration_days),
        duration_nights = COALESCE(?, duration_nights),
        price = COALESCE(?, price),
        transport_type = COALESCE(?, transport_type),
        hotel_type = COALESCE(?, hotel_type),
        food_included = COALESCE(?, food_included),
        guide_included = COALESCE(?, guide_included),
        activities = COALESCE(?, activities),
        description = COALESCE(?, description),
        image_url = COALESCE(?, image_url)
      WHERE id = ?
    `, [
      destination_id,
      title,
      company_name,
      duration_days !== undefined ? parseInt(duration_days) : null,
      duration_nights !== undefined ? parseInt(duration_nights) : null,
      price !== undefined ? parseFloat(price) : null,
      transport_type,
      hotel_type,
      food_included !== undefined ? Boolean(food_included) : null,
      guide_included !== undefined ? Boolean(guide_included) : null,
      activities ? JSON.stringify(activities) : null,
      description,
      image_url,
      req.params.id
    ]);

    return res.json({ success: true, message: 'Package updated successfully.' });
  } catch (error) {
    console.error('Update Package Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update package.' });
  }
});

// DELETE /api/packages/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM travel_packages WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Package deleted successfully.' });
  } catch (error) {
    console.error('Delete Package Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete package.' });
  }
});

module.exports = router;
