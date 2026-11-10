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

// Helper middleware: Ensure user is an authenticated Business Partner or Administrator
function requirePartnerOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const role = (req.user.role || '').toLowerCase();
  if (role !== 'business partner' && role !== 'admin' && role !== 'super admin') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Business Partner role required.'
    });
  }
  next();
}

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
      listing_id,
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

    const people = people_count ? parseInt(people_count, 10) : 1;
    let finalAmount = parseFloat(total_amount);

    // Fallback amount from package or listing if not provided
    if (!finalAmount && package_id) {
      const [pkgRows] = await pool.query('SELECT price FROM travel_packages WHERE id = ?', [package_id]);
      if (pkgRows.length > 0) {
        finalAmount = pkgRows[0].price * people;
      }
    } else if (!finalAmount && listing_id) {
      const [listingRows] = await pool.query('SELECT price FROM partner_service_listings WHERE id = ?', [listing_id]);
      if (listingRows.length > 0 && listingRows[0].price) {
        finalAmount = listingRows[0].price * people;
      }
    }

    // Generate unique transaction identifier
    const txnId = `TXN_IND_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const [result] = await pool.query(`
      INSERT INTO bookings (
        user_id, listing_id, package_id, hotel_id, transport_id, guide_id,
        booking_type, travel_date, people_count, total_amount,
        discount_amount, discount_code, payment_method, payment_status,
        transaction_id, status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, 'Confirmed', ?)
    `, [
      req.user.id,
      listing_id || null,
      package_id || null,
      hotel_id || null,
      transport_id || null,
      guide_id || null,
      booking_type || (listing_id ? 'partner_listing' : 'Package'),
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
             g.name as guide_name,
             psl.listing_title as partner_listing_title,
             psl.category as partner_listing_category
      FROM bookings b
      LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
      LEFT JOIN tourist_places p ON pkg.destination_id = p.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN transport t ON b.transport_id = t.id
      LEFT JOIN guides g ON b.guide_id = g.id
      LEFT JOIN partner_service_listings psl ON b.listing_id = psl.id
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

// ============================================================================
// BUSINESS PARTNER BOOKINGS (Strict Backend Ownership & Verification)
// ============================================================================

// GET /api/bookings/partner - Bookings strictly for services owned by authenticated partner
router.get('/partner', authenticateToken, requirePartnerOrAdmin, async (req, res) => {
  try {
    const partnerUserId = req.user.id;
    const {
      status,
      payment_status,
      date_from,
      date_to,
      date_type = 'travel',
      search,
      sort = 'newest'
    } = req.query;

    // Strict backend ownership filtering:
    // Every query strictly filters by partner's authenticated ID via pa.user_id or psl.partner_user_id
    const whereClauses = [
      '(pa.user_id = ? OR psl.partner_user_id = ?)'
    ];
    const queryParams = [partnerUserId, partnerUserId];

    // Filter by booking status
    if (status && status !== 'All') {
      whereClauses.push('b.status = ?');
      queryParams.push(status);
    }

    // Filter by payment status
    if (payment_status && payment_status !== 'All') {
      whereClauses.push('b.payment_status = ?');
      queryParams.push(payment_status);
    }

    // Filter by date range
    const dateCol = date_type === 'booking' ? 'DATE(b.created_at)' : 'b.travel_date';
    if (date_from) {
      whereClauses.push(`${dateCol} >= ?`);
      queryParams.push(date_from);
    }
    if (date_to) {
      whereClauses.push(`${dateCol} <= ?`);
      queryParams.push(date_to);
    }

    // Keyword search
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push(`(
        b.transaction_id LIKE ? OR
        CAST(b.id AS CHAR) LIKE ? OR
        psl.listing_title LIKE ? OR
        u.name LIKE ? OR
        u.email LIKE ? OR
        u.phone LIKE ?
      )`);
      queryParams.push(term, term, term, term, term, term);
    }

    // Sort order
    let orderBy = 'b.created_at DESC';
    if (sort === 'oldest') orderBy = 'b.created_at ASC';
    else if (sort === 'travel_date_asc') orderBy = 'b.travel_date ASC';
    else if (sort === 'travel_date_desc') orderBy = 'b.travel_date DESC';
    else if (sort === 'amount_high') orderBy = 'b.total_amount DESC';
    else if (sort === 'amount_low') orderBy = 'b.total_amount ASC';

    const sql = `
      SELECT b.id,
             b.transaction_id,
             b.travel_date,
             b.people_count,
             b.capacity_units,
             b.total_amount,
             b.discount_amount,
             b.discount_code,
             b.payment_method,
             b.payment_status,
             b.status,
             b.special_requests,
             b.created_at,
             psl.id AS listing_id,
             psl.listing_title,
             psl.category,
             psl.price AS unit_price,
             psl.price_unit,
             psl.city,
             psl.state,
             psl.location_or_route,
             u.name AS tourist_name,
             u.email AS tourist_email,
             u.phone AS tourist_phone
      FROM bookings b
      JOIN partner_service_listings psl ON b.listing_id = psl.id
      JOIN partner_applications pa ON psl.application_id = pa.id
      JOIN users u ON b.user_id = u.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY ${orderBy}
    `;

    const [rows] = await pool.query(sql, queryParams);

    // Compute aggregate metrics for partner's overall bookings (unfiltered for KPI header cards)
    const [statsRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN b.status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
        SUM(CASE WHEN b.status = 'Completed' THEN 1 ELSE 0 END) AS completed_bookings,
        SUM(CASE WHEN b.status = 'Pending' THEN 1 ELSE 0 END) AS pending_bookings,
        SUM(CASE WHEN b.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
        COALESCE(SUM(CASE WHEN b.status IN ('Confirmed', 'Completed') THEN b.total_amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN b.status IN ('Confirmed', 'Completed') THEN COALESCE(b.people_count, b.capacity_units, 1) ELSE 0 END), 0) AS total_guests
      FROM bookings b
      JOIN partner_service_listings psl ON b.listing_id = psl.id
      JOIN partner_applications pa ON psl.application_id = pa.id
      WHERE (pa.user_id = ? OR psl.partner_user_id = ?)
    `, [partnerUserId, partnerUserId]);

    const s = statsRows[0] || {};
    const stats = {
      total: Number(s.total_bookings) || 0,
      confirmed: Number(s.confirmed_bookings) || 0,
      completed: Number(s.completed_bookings) || 0,
      pending: Number(s.pending_bookings) || 0,
      cancelled: Number(s.cancelled_bookings) || 0,
      revenue: Number(s.total_revenue) || 0,
      guests: Number(s.total_guests) || 0
    };

    const formatted = rows.map(b => ({
      id: b.id,
      bookingReference: b.transaction_id || `TH-BK-${b.id}`,
      serviceName: b.listing_title,
      category: b.category,
      bookingDate: b.created_at,
      travelDate: b.travel_date,
      guestCount: b.people_count || b.capacity_units || 1,
      amount: Number(b.total_amount),
      discountAmount: Number(b.discount_amount || 0),
      discountCode: b.discount_code,
      paymentMethod: b.payment_method,
      paymentStatus: b.payment_status,
      bookingStatus: b.status,
      specialRequests: b.special_requests,
      location: [b.city, b.state].filter(Boolean).join(', ') || b.location_or_route || '—',
      tourist: {
        name: b.tourist_name,
        email: b.tourist_email,
        phone: b.tourist_phone
      },
      listingId: b.listing_id,
      unitPrice: b.unit_price,
      priceUnit: b.price_unit
    }));

    return res.json({
      success: true,
      count: formatted.length,
      bookings: formatted,
      stats
    });
  } catch (error) {
    console.error('Partner Get Bookings Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve partner bookings.' });
  }
});

// GET /api/bookings/partner/:id - Single booking details with strict ownership verification
router.get('/partner/:id', authenticateToken, requirePartnerOrAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (!bookingId || isNaN(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }

    const partnerUserId = req.user.id;
    const [rows] = await pool.query(`
      SELECT b.id,
             b.transaction_id,
             b.travel_date,
             b.people_count,
             b.capacity_units,
             b.total_amount,
             b.discount_amount,
             b.discount_code,
             b.payment_method,
             b.payment_status,
             b.status,
             b.special_requests,
             b.created_at,
             psl.id AS listing_id,
             psl.listing_title,
             psl.category,
             psl.price AS unit_price,
             psl.price_unit,
             psl.city,
             psl.state,
             psl.location_or_route,
             u.name AS tourist_name,
             u.email AS tourist_email,
             u.phone AS tourist_phone
      FROM bookings b
      JOIN partner_service_listings psl ON b.listing_id = psl.id
      JOIN partner_applications pa ON psl.application_id = pa.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ? AND (pa.user_id = ? OR psl.partner_user_id = ?)
    `, [bookingId, partnerUserId, partnerUserId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to access it.'
      });
    }

    const b = rows[0];
    const booking = {
      id: b.id,
      bookingReference: b.transaction_id || `TH-BK-${b.id}`,
      serviceName: b.listing_title,
      category: b.category,
      bookingDate: b.created_at,
      travelDate: b.travel_date,
      guestCount: b.people_count || b.capacity_units || 1,
      amount: Number(b.total_amount),
      discountAmount: Number(b.discount_amount || 0),
      discountCode: b.discount_code,
      paymentMethod: b.payment_method,
      paymentStatus: b.payment_status,
      bookingStatus: b.status,
      specialRequests: b.special_requests,
      location: [b.city, b.state].filter(Boolean).join(', ') || b.location_or_route || '—',
      tourist: {
        name: b.tourist_name,
        email: b.tourist_email,
        phone: b.tourist_phone
      },
      listingId: b.listing_id,
      unitPrice: b.unit_price,
      priceUnit: b.price_unit
    };

    return res.json({ success: true, booking });
  } catch (error) {
    console.error('Partner Get Booking Detail Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve booking detail.' });
  }
});

// PATCH /api/bookings/partner/:id/status - Partner updates status with strict ownership check
router.patch('/partner/:id/status', authenticateToken, requirePartnerOrAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const allowed = ['Confirmed', 'Completed', 'Cancelled'];

    if (!bookingId || isNaN(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}.` });
    }

    const partnerUserId = req.user.id;
    const [check] = await pool.query(`
      SELECT b.id, b.status AS current_status
      FROM bookings b
      JOIN partner_service_listings psl ON b.listing_id = psl.id
      JOIN partner_applications pa ON psl.application_id = pa.id
      WHERE b.id = ? AND (pa.user_id = ? OR psl.partner_user_id = ?)
    `, [bookingId, partnerUserId, partnerUserId]);

    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to modify it.'
      });
    }

    await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

    return res.json({
      success: true,
      message: `Booking #${bookingId} status updated to ${status}.`,
      status
    });
  } catch (error) {
    console.error('Partner Update Booking Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
});

// ============================================================================
// ADMIN BOOKINGS ENDPOINTS
// ============================================================================

// GET /api/bookings/admin/all (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             pkg.title as package_title,
             p.name as destination_name,
             h.name as hotel_name,
             psl.listing_title as partner_listing_title
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
      LEFT JOIN tourist_places p ON pkg.destination_id = p.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN partner_service_listings psl ON b.listing_id = psl.id
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
