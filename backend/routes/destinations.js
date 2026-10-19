const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to safely parse JSON or return original
function safeJsonParse(data) {
  if (!data) return [];
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return [data];
  }
}

// GET /api/destinations
router.get('/', async (req, res) => {
  try {
    const { q, state, category, budget_max, sort } = req.query;

    let query = `
      SELECT p.*, s.name as state_name, s.code as state_code
      FROM tourist_places p
      LEFT JOIN states s ON p.state_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      query += ` AND (p.name LIKE ? OR p.location LIKE ? OR p.description LIKE ? OR s.name LIKE ?)`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (state) {
      query += ` AND (s.code = ? OR s.name = ? OR p.state_id = ?)`;
      params.push(state, state, state);
    }

    if (category) {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (budget_max) {
      query += ` AND p.estimated_cost_per_day <= ?`;
      params.push(parseFloat(budget_max));
    }

    if (sort === 'rating') {
      query += ` ORDER BY p.rating DESC`;
    } else if (sort === 'cost_asc') {
      query += ` ORDER BY p.estimated_cost_per_day ASC`;
    } else if (sort === 'cost_desc') {
      query += ` ORDER BY p.estimated_cost_per_day DESC`;
    } else {
      query += ` ORDER BY p.rating DESC, p.id ASC`;
    }

    const [places] = await pool.query(query, params);

    const formatted = places.map(p => ({
      ...p,
      gallery_urls: safeJsonParse(p.gallery_urls),
      major_attractions: safeJsonParse(p.major_attractions),
      activities: safeJsonParse(p.activities),
      local_food: safeJsonParse(p.local_food),
      local_transport: safeJsonParse(p.local_transport)
    }));

    return res.json({ success: true, count: formatted.length, destinations: formatted });
  } catch (error) {
    console.error('Get Destinations Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch destinations.' });
  }
});

// Forward /api/destinations/nearby
router.use('/nearby', (req, res, next) => {
  req.url = '/places' + (req.url === '/' ? '' : req.url);
  require('./nearby')(req, res, next);
});

// GET /api/destinations/:id
router.get('/:id', async (req, res) => {
  try {
    const [places] = await pool.query(`
      SELECT p.*, s.name as state_name, s.code as state_code, s.capital as state_capital
      FROM tourist_places p
      JOIN states s ON p.state_id = s.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (places.length === 0) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }

    const place = places[0];
    place.gallery_urls = safeJsonParse(place.gallery_urls);
    place.major_attractions = safeJsonParse(place.major_attractions);
    place.activities = safeJsonParse(place.activities);
    place.local_food = safeJsonParse(place.local_food);
    place.local_transport = safeJsonParse(place.local_transport);

    // Fetch related modules
    const [hotels] = await pool.query('SELECT * FROM hotels WHERE destination_id = ?', [place.id]);
    const [transport] = await pool.query('SELECT * FROM transport WHERE destination_id = ?', [place.id]);
    const [guides] = await pool.query('SELECT * FROM guides WHERE destination_id = ?', [place.id]);
    const [emergency] = await pool.query('SELECT * FROM emergency_services WHERE destination_id = ?', [place.id]);
    const [packages] = await pool.query('SELECT * FROM travel_packages WHERE destination_id = ?', [place.id]);
    const [reviews] = await pool.query(`
      SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.destination_id = ?
      ORDER BY r.created_at DESC
    `, [place.id]);

    return res.json({
      success: true,
      destination: {
        ...place,
        hotels: hotels.map(h => ({ ...h, amenities: safeJsonParse(h.amenities) })),
        transport,
        guides,
        emergency_services: emergency,
        packages: packages.map(pkg => ({ ...pkg, activities: safeJsonParse(pkg.activities) })),
        reviews
      }
    });
  } catch (error) {
    console.error('Get Destination Details Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve destination details.' });
  }
});

// POST /api/destinations (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      state_id, name, location, category, image_url, gallery_urls,
      description, history, culture_info, best_time_to_visit,
      major_attractions, activities, local_food, local_transport,
      estimated_cost_per_day, recommended_duration_days
    } = req.body;

    if (!state_id || !name || !location || !category || !image_url) {
      return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    const [result] = await pool.query(`
      INSERT INTO tourist_places (
        state_id, name, location, category, image_url, gallery_urls,
        description, history, culture_info, best_time_to_visit,
        major_attractions, activities, local_food, local_transport,
        estimated_cost_per_day, recommended_duration_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      state_id, name, location, category, image_url,
      JSON.stringify(gallery_urls || [image_url]),
      description || '', history || '', culture_info || '', best_time_to_visit || 'Year-round',
      JSON.stringify(major_attractions || []),
      JSON.stringify(activities || []),
      JSON.stringify(local_food || []),
      JSON.stringify(local_transport || []),
      estimated_cost_per_day || 3000,
      recommended_duration_days || 3
    ]);

    return res.status(201).json({
      success: true,
      message: 'Tourist destination created successfully.',
      destinationId: result.insertId
    });
  } catch (error) {
    console.error('Create Destination Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create destination.' });
  }
});

// PUT /api/destinations/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name, location, category, image_url,
      description, history, culture_info, best_time_to_visit,
      estimated_cost_per_day, recommended_duration_days
    } = req.body;

    await pool.query(`
      UPDATE tourist_places SET
        name = COALESCE(?, name),
        location = COALESCE(?, location),
        category = COALESCE(?, category),
        image_url = COALESCE(?, image_url),
        description = COALESCE(?, description),
        history = COALESCE(?, history),
        culture_info = COALESCE(?, culture_info),
        best_time_to_visit = COALESCE(?, best_time_to_visit),
        estimated_cost_per_day = COALESCE(?, estimated_cost_per_day),
        recommended_duration_days = COALESCE(?, recommended_duration_days)
      WHERE id = ?
    `, [
      name, location, category, image_url,
      description, history, culture_info, best_time_to_visit,
      estimated_cost_per_day, recommended_duration_days,
      req.params.id
    ]);

    return res.json({ success: true, message: 'Destination updated successfully.' });
  } catch (error) {
    console.error('Update Destination Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update destination.' });
  }
});

// DELETE /api/destinations/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM tourist_places WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Destination deleted successfully.' });
  } catch (error) {
    console.error('Delete Destination Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete destination.' });
  }
});

module.exports = router;
