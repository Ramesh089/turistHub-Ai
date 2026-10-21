const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/dashboard (Admin only)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [userCount] = await pool.query("SELECT COUNT(*) as total FROM users WHERE role IN ('Tourist', 'User')");
    const [destCount] = await pool.query('SELECT COUNT(*) as total FROM tourist_places');
    const [pkgCount] = await pool.query('SELECT COUNT(*) as total FROM travel_packages');
    const [hotelCount] = await pool.query('SELECT COUNT(*) as total FROM hotels');
    const [guideCount] = await pool.query('SELECT COUNT(*) as total FROM guides');
    const [transportCount] = await pool.query('SELECT COUNT(*) as total FROM transport');
    const [bookingCount] = await pool.query('SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as total_revenue FROM bookings');
    const [reviewCount] = await pool.query('SELECT COUNT(*) as total FROM reviews');

    const [statusBreakdown] = await pool.query(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
      FROM bookings
      GROUP BY status
    `);

    const [categoryBreakdown] = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM tourist_places
      GROUP BY category
    `);

    const [recentBookings] = await pool.query(`
      SELECT b.id, b.travel_date, b.people_count, b.total_amount, b.status, b.created_at,
             u.name as user_name, u.email as user_email,
             pkg.title as package_title, p.name as destination_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
      LEFT JOIN tourist_places p ON pkg.destination_id = p.id
      ORDER BY b.created_at DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      stats: {
        total_tourists: userCount[0].total,
        total_destinations: destCount[0].total,
        total_packages: pkgCount[0].total,
        total_hotels: hotelCount[0].total,
        total_guides: guideCount[0].total,
        total_transport: transportCount[0].total,
        total_bookings: bookingCount[0].total,
        total_revenue: parseFloat(bookingCount[0].total_revenue),
        total_reviews: reviewCount[0].total,
        status_breakdown: statusBreakdown,
        category_breakdown: categoryBreakdown,
        recent_bookings: recentBookings
      }
    });
  } catch (error) {
    console.error('Stats Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics.' });
  }
});

module.exports = router;
