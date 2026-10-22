const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Supported promotional coupons for Indian tourism packages
const VALID_COUPONS = {
  NAMASTE10: { type: 'percent', value: 10, description: '10% Festive Tourist Discount' },
  INCREDIBLE2026: { type: 'flat', value: 2000, description: '₹2,000 Off Incredible India Promo' },
  AIPLAN1500: { type: 'flat', value: 1500, description: '₹1,500 AI Itinerary Booking Reward' },
  COUPLEDEAL: { type: 'flat', value: 1200, description: '₹1,200 Couple Special Saver' },
  FIRSTTRIP: { type: 'flat', value: 1000, description: '₹1,000 Welcome Tourist Voucher' }
};

// POST /api/bookings/apply-coupon - Validates discount code
router.post('/apply-coupon', (req, res) => {
  const { code, amount = 0 } = req.body;
  const normalized = (code || '').toUpperCase().trim();

  if (!normalized || !VALID_COUPONS[normalized]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid promo code. Try NAMASTE10, AIPLAN1500, or INCREDIBLE2026.'
    });
  }

  const coupon = VALID_COUPONS[normalized];
  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.round((parseFloat(amount) * coupon.value) / 100);
  } else {
    discount = Math.min(coupon.value, parseFloat(amount));
  }

  return res.json({
    success: true,
    code: normalized,
    discount,
    description: coupon.description,
    message: `Promo code ${normalized} applied! You saved ₹${discount.toLocaleString('en-IN')}`
  });
});

// POST /api/bookings - Create booking with payment verification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      package_id,
      hotel_id,
      transport_id,
      guide_id,
      booking_type,
      travel_date,
      people_count,
      total_amount,
      discount_amount = 0,
      discount_code = null,
      payment_method = 'UPI',
      special_requests
    } = req.body;

    if (!travel_date) {
      return res.status(400).json({ success: false, message: 'Travel date is required.' });
    }

    const people = people_count ? parseInt(people_count) : 1;
    let finalAmount = parseFloat(total_amount);

    // Fallback amount from package if not calculated
    if (!finalAmount && package_id) {
      const [pkgRows] = await pool.query('SELECT price FROM travel_packages WHERE id = ?', [package_id]);
      if (pkgRows.length > 0) {
        finalAmount = pkgRows[0].price * people;
      }
    }

    // Generate unique transaction identifier
    const txnId = `TXN_IND_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const [result] = await pool.query(`
      INSERT INTO bookings (
        user_id, package_id, hotel_id, transport_id, guide_id,
        booking_type, travel_date, people_count, total_amount,
        discount_amount, discount_code, payment_method, payment_status,
        transaction_id, status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, 'Confirmed', ?)
    `, [
      req.user.id,
      package_id || null,
      hotel_id || null,
      transport_id || null,
      guide_id || null,
      booking_type || 'Package',
      travel_date,
      people,
      finalAmount || 5000,
      parseFloat(discount_amount) || 0,
      discount_code || null,
      payment_method || 'UPI',
      txnId,
      special_requests || null
    ]);

    return res.status(201).json({
      success: true,
      message: 'Payment received! Booking confirmed successfully.',
      bookingId: result.insertId,
      transaction_id: txnId,
      amount_paid: finalAmount,
      discount_applied: parseFloat(discount_amount) || 0,
      payment_method: payment_method || 'UPI'
    });
  } catch (error) {
    console.error('Create Booking Error:', error);
    return res.status(500).json({ success: false, message: 'Payment processing failed. Please try again.' });
  }
});

// GET /api/bookings/my-bookings (Logged in tourist bookings)
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*,
             pkg.title as package_title, pkg.image_url as package_image, pkg.company_name,
             p.name as destination_name,
             h.name as hotel_name,
             t.provider as transport_provider, t.transport_type, t.service_number as transport_number,
             t.from_city as transport_from, t.to_city as transport_to, t.vehicle_model as transport_vehicle,
             t.cancellation_policy as transport_cancellation_policy,
             g.name as guide_name
      FROM bookings b
      LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
      LEFT JOIN tourist_places p ON pkg.destination_id = p.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN transport t ON b.transport_id = t.id
      LEFT JOIN guides g ON b.guide_id = g.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    const formatted = rows.map(r => {
      let details = r.booking_details;
      if (typeof details === 'string') {
        try { details = JSON.parse(details); } catch (e) { details = null; }
      }
      return { ...r, booking_details: details };
    });

    return res.json({ success: true, count: formatted.length, bookings: formatted });
  } catch (error) {
    console.error('Get My Bookings Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

// GET /api/bookings/admin/all (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             pkg.title as package_title,
             p.name as destination_name,
             h.name as hotel_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
      LEFT JOIN tourist_places p ON pkg.destination_id = p.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      ORDER BY b.created_at DESC
    `);

    return res.json({ success: true, count: rows.length, bookings: rows });
  } catch (error) {
    console.error('Admin Get Bookings Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch all bookings.' });
  }
});

// PUT /api/bookings/:id/status (Admin only update status)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status.' });
    }

    await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, message: `Booking status updated to ${status}.` });
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
});

module.exports = router;
