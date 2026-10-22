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

// GET /api/stats/analytics (Comprehensive Data Analytics Dashboard)
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. High-level KPI aggregations
    const [bookingMetrics] = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'Confirmed' THEN total_amount ELSE 0 END), 0) as confirmed_revenue,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN total_amount ELSE 0 END), 0) as pending_revenue,
        COALESCE(SUM(CASE WHEN status = 'Confirmed' THEN people_count ELSE 0 END), 0) as total_guests_hosted,
        COALESCE(SUM(people_count), 0) as total_passengers,
        COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_count
      FROM bookings
    `);

    const [userMetrics] = await pool.query("SELECT COUNT(*) as total_tourists FROM users WHERE role IN ('Tourist', 'User')");
    const [totalAdmins] = await pool.query("SELECT COUNT(*) as total_admins FROM users WHERE role = 'Admin'");

    // 2. Daily revenue & booking timeline (last 30 days)
    const [dailyTimeline] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        DATE_FORMAT(created_at, '%d %b') as label,
        COUNT(*) as booking_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), DATE_FORMAT(created_at, '%d %b')
      ORDER BY date ASC
    `);

    // 3. Monthly revenue & booking trends (last 12 months)
    const [monthlyTimeline] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        DATE_FORMAT(created_at, '%b %Y') as label,
        COUNT(*) as booking_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
      ORDER BY month ASC
    `);

    // 4. Payment methods breakdown
    const [paymentMethods] = await pool.query(`
      SELECT 
        COALESCE(payment_method, 'UPI') as method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings
      GROUP BY COALESCE(payment_method, 'UPI')
      ORDER BY revenue DESC
    `);

    // 5. Booking status breakdown
    const [statusBreakdown] = await pool.query(`
      SELECT 
        status, 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings
      GROUP BY status
      ORDER BY count DESC
    `);

    // 6. Top performing packages / experiences
    const [topPackages] = await pool.query(`
      SELECT 
        COALESCE(pkg.title, p.name, 'Custom Experience') as name,
        COALESCE(p.name, 'India Experience') as destination,
        COUNT(b.id) as booking_count,
        COALESCE(SUM(b.total_amount), 0) as revenue,
        ROUND(AVG(b.total_amount), 0) as avg_value
      FROM bookings b
      LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
      LEFT JOIN tourist_places p ON pkg.destination_id = p.id
      GROUP BY COALESCE(pkg.title, p.name, 'Custom Experience'), COALESCE(p.name, 'India Experience')
      ORDER BY revenue DESC
      LIMIT 8
    `);

    // 7. Destination category distribution
    const [categories] = await pool.query(`
      SELECT 
        COALESCE(category, 'General') as category,
        COUNT(*) as destination_count,
        ROUND(AVG(estimated_cost_per_day), 0) as avg_daily_cost
      FROM tourist_places
      GROUP BY COALESCE(category, 'General')
      ORDER BY destination_count DESC
    `);

    // 8. Hotels insights
    const [hotelStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_hotels,
        ROUND(AVG(price_per_night), 0) as avg_price_per_night,
        ROUND(AVG(rating), 2) as avg_rating
      FROM hotels
    `);

    // 9. Guides insights
    const [guideStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_guides,
        ROUND(AVG(daily_rate), 0) as avg_daily_rate,
        ROUND(AVG(rating), 2) as avg_rating,
        ROUND(AVG(experience_years), 1) as avg_experience
      FROM guides
    `);

    // 10. Transport breakdown
    const [transportStats] = await pool.query(`
      SELECT 
        COALESCE(type, transport_type, 'Transit') as transport_mode,
        COUNT(*) as count,
        ROUND(AVG(price), 0) as avg_price
      FROM transport
      GROUP BY COALESCE(type, transport_type, 'Transit')
    `);

    // Calculate derived KPI metrics
    const b = bookingMetrics[0] || {};
    const totalBookings = parseInt(b.total_bookings || 0, 10);
    const totalRevenue = parseFloat(b.total_revenue || 0);
    const confirmedCount = parseInt(b.confirmed_count || 0, 10);
    const avgOrderValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
    const conversionRate = totalBookings > 0 ? Math.round((confirmedCount / totalBookings) * 100) : 0;

    return res.json({
      success: true,
      analytics: {
        kpi: {
          total_revenue: totalRevenue,
          confirmed_revenue: parseFloat(b.confirmed_revenue || 0),
          pending_revenue: parseFloat(b.pending_revenue || 0),
          total_bookings: totalBookings,
          confirmed_count: confirmedCount,
          pending_count: parseInt(b.pending_count || 0, 10),
          cancelled_count: parseInt(b.cancelled_count || 0, 10),
          total_guests_hosted: parseInt(b.total_guests_hosted || 0, 10),
          total_passengers: parseInt(b.total_passengers || 0, 10),
          total_tourists: parseInt(userMetrics[0]?.total_tourists || 0, 10),
          total_admins: parseInt(totalAdmins[0]?.total_admins || 0, 10),
          avg_order_value: avgOrderValue,
          conversion_rate: conversionRate
        },
        daily_timeline: dailyTimeline.map(d => ({
          date: d.date,
          label: d.label,
          bookings: parseInt(d.booking_count, 10),
          revenue: parseFloat(d.revenue)
        })),
        monthly_timeline: monthlyTimeline.map(m => ({
          month: m.month,
          label: m.label,
          bookings: parseInt(m.booking_count, 10),
          revenue: parseFloat(m.revenue)
        })),
        payment_methods: paymentMethods.map(p => ({
          method: p.method,
          count: parseInt(p.count, 10),
          revenue: parseFloat(p.revenue),
          share_percent: totalRevenue > 0 ? Math.round((parseFloat(p.revenue) / totalRevenue) * 100) : 0
        })),
        status_breakdown: statusBreakdown.map(s => ({
          status: s.status,
          count: parseInt(s.count, 10),
          revenue: parseFloat(s.revenue),
          percent: totalBookings > 0 ? Math.round((parseInt(s.count, 10) / totalBookings) * 100) : 0
        })),
        top_packages: topPackages.map(tp => ({
          name: tp.name,
          destination: tp.destination,
          bookings: parseInt(tp.booking_count, 10),
          revenue: parseFloat(tp.revenue),
          avg_value: parseFloat(tp.avg_value || 0)
        })),
        categories: categories.map(c => ({
          category: c.category,
          count: parseInt(c.destination_count, 10),
          avg_daily_cost: parseFloat(c.avg_daily_cost || 0)
        })),
        inventory: {
          hotels: {
            total: parseInt(hotelStats[0]?.total_hotels || 0, 10),
            avg_price: parseFloat(hotelStats[0]?.avg_price_per_night || 0),
            avg_rating: parseFloat(hotelStats[0]?.avg_rating || 0)
          },
          guides: {
            total: parseInt(guideStats[0]?.total_guides || 0, 10),
            avg_rate: parseFloat(guideStats[0]?.avg_daily_rate || 0),
            avg_rating: parseFloat(guideStats[0]?.avg_rating || 0),
            avg_experience: parseFloat(guideStats[0]?.avg_experience || 0)
          },
          transport: transportStats.map(t => ({
            mode: t.transport_mode,
            count: parseInt(t.count, 10),
            avg_price: parseFloat(t.avg_price || 0)
          }))
        }
      }
    });
  } catch (error) {
    console.error('Data Analytics API Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve analytics metrics.' });
  }
});

module.exports = router;
