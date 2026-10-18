const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/:destinationId
router.get('/:destinationId', async (req, res) => {
  try {
    const [reviews] = await pool.query(`
      SELECT r.*, u.name as user_name, u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.destination_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.destinationId]);

    return res.json({ success: true, reviews });
  } catch (error) {
    console.error('Get Reviews Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// POST /api/reviews
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { destination_id, rating, review_text, package_id } = req.body;

    if (!destination_id || !rating || !review_text) {
      return res.status(400).json({ success: false, message: 'Destination, rating, and review text are required.' });
    }

    const numericRating = parseInt(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const [result] = await pool.query(`
      INSERT INTO reviews (user_id, destination_id, package_id, rating, review_text)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, destination_id, package_id || null, numericRating, review_text.trim()]);

    // Recalculate destination rating
    const [avgRows] = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE destination_id = ?',
      [destination_id]
    );

    if (avgRows.length > 0 && avgRows[0].count > 0) {
      await pool.query(
        'UPDATE tourist_places SET rating = ?, reviews_count = ? WHERE id = ?',
        [parseFloat(avgRows[0].avg_rating).toFixed(2), avgRows[0].count, destination_id]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('Post Review Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to post review.' });
  }
});

module.exports = router;
