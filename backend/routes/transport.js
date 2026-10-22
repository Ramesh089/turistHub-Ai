const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Supported promotional coupons for transport bookings
const VALID_COUPONS = {
  NAMASTE10: { type: 'percent', value: 10, description: '10% Festive Transit Discount' },
  INCREDIBLE2026: { type: 'flat', value: 2000, description: '₹2,000 Off Incredible India Promo' },
  AIPLAN1500: { type: 'flat', value: 1500, description: '₹1,500 AI Route Booking Voucher' },
  EXPLORE10: { type: 'percent', value: 10, description: '10% Intercity Explorer Discount' },
  FIRSTTRIP: { type: 'flat', value: 500, description: '₹500 Welcome Booking Voucher' }
};

function calculateDiscount(code, amount) {
  if (!code) return 0;
  const normalized = code.toUpperCase().trim();
  const coupon = VALID_COUPONS[normalized];
  if (!coupon) return 0;
  if (coupon.type === 'percent') {
    return Math.round((parseFloat(amount) * coupon.value) / 100);
  }
  return Math.min(coupon.value, parseFloat(amount));
}

// -------------------------------------------------------------
// 1. GET /api/transport - Unified Search & Filter for All Modes
// -------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const {
      transport_type,
      from_city,
      to_city,
      destination_id,
      search,
      sort,
      min_price,
      max_price
    } = req.query;

    let query = `
      SELECT t.*, 
             p.name as destination_name, 
             p.location as destination_location, 
             s.name as state_name
      FROM transport t
      LEFT JOIN tourist_places p ON t.destination_id = p.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // Mode filter
    if (transport_type && transport_type !== 'Any' && transport_type !== 'All') {
      query += ` AND t.transport_type = ?`;
      params.push(transport_type);
    }

    // Source city filter
    if (from_city && from_city.trim() !== '' && from_city !== 'All') {
      query += ` AND (t.from_city LIKE ? OR t.route LIKE ?)`;
      params.push(`%${from_city.trim()}%`, `%${from_city.trim()}%`);
    }

    // Destination city filter
    if (to_city && to_city.trim() !== '' && to_city !== 'All') {
      query += ` AND (t.to_city LIKE ? OR t.route LIKE ? OR p.name LIKE ?)`;
      params.push(`%${to_city.trim()}%`, `%${to_city.trim()}%`, `%${to_city.trim()}%`);
    }

    // Destination ID
    if (destination_id) {
      query += ` AND t.destination_id = ?`;
      params.push(destination_id);
    }

    // Search query
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      query += ` AND (
        t.provider LIKE ? OR 
        t.route LIKE ? OR 
        t.service_number LIKE ? OR 
        t.from_city LIKE ? OR 
        t.to_city LIKE ? OR 
        t.vehicle_model LIKE ?
      )`;
      params.push(q, q, q, q, q, q);
    }

    // Price range
    if (min_price) {
      query += ` AND t.price >= ?`;
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      query += ` AND t.price <= ?`;
      params.push(parseFloat(max_price));
    }

    // Sorting
    if (sort === 'price_asc') {
      query += ` ORDER BY t.price ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY t.price DESC`;
    } else if (sort === 'rating_desc') {
      query += ` ORDER BY t.rating DESC`;
    } else {
      query += ` ORDER BY t.transport_type ASC, t.price ASC`;
    }

    const [rows] = await pool.query(query, params);

    // Safely parse JSON columns
    const transports = rows.map(t => ({
      ...t,
      class_options: typeof t.class_options === 'string' ? JSON.parse(t.class_options || '[]') : (t.class_options || []),
      boarding_points: typeof t.boarding_points === 'string' ? JSON.parse(t.boarding_points || '[]') : (t.boarding_points || []),
      dropping_points: typeof t.dropping_points === 'string' ? JSON.parse(t.dropping_points || '[]') : (t.dropping_points || []),
      amenities: typeof t.amenities === 'string' ? JSON.parse(t.amenities || '[]') : (t.amenities || [])
    }));

    return res.json({ success: true, count: transports.length, transports });
  } catch (error) {
    console.error('Get Transport Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transport options.' });
  }
});

// -------------------------------------------------------------
// 2. GET /api/transport/cities - Unique list of from and to cities
// -------------------------------------------------------------
router.get('/meta/cities', async (req, res) => {
  try {
    const [fromRows] = await pool.query('SELECT DISTINCT from_city FROM transport WHERE from_city IS NOT NULL');
    const [toRows] = await pool.query('SELECT DISTINCT to_city FROM transport WHERE to_city IS NOT NULL');

    const fromCities = fromRows.map(r => r.from_city).filter(Boolean);
    const toCities = toRows.map(r => r.to_city).filter(Boolean);

    return res.json({
      success: true,
      from_cities: fromCities,
      to_cities: toCities
    });
  } catch (error) {
    console.error('Get Cities Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch transport cities.' });
  }
});

// -------------------------------------------------------------
// 3. GET /api/transport/:id - Single transport details
// -------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, p.name as destination_name, s.name as state_name
      FROM transport t
      LEFT JOIN tourist_places p ON t.destination_id = p.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transport option not found.' });
    }

    const t = rows[0];
    const transport = {
      ...t,
      class_options: typeof t.class_options === 'string' ? JSON.parse(t.class_options || '[]') : (t.class_options || []),
      boarding_points: typeof t.boarding_points === 'string' ? JSON.parse(t.boarding_points || '[]') : (t.boarding_points || []),
      dropping_points: typeof t.dropping_points === 'string' ? JSON.parse(t.dropping_points || '[]') : (t.dropping_points || []),
      amenities: typeof t.amenities === 'string' ? JSON.parse(t.amenities || '[]') : (t.amenities || [])
    };

    return res.json({ success: true, transport });
  } catch (error) {
    console.error('Get Transport by ID Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transport option.' });
  }
});

// -------------------------------------------------------------
// 4. GET /api/transport/:id/seats - Real-time seat inventory for travel date
// -------------------------------------------------------------
router.get('/:id/seats', async (req, res) => {
  try {
    const transportId = req.params.id;
    const { travel_date } = req.query;

    if (!travel_date) {
      return res.status(400).json({ success: false, message: 'Travel date is required to inspect seat availability.' });
    }

    // Verify transport exists
    const [tRows] = await pool.query('SELECT * FROM transport WHERE id = ?', [transportId]);
    if (tRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transport service not found.' });
    }
    const transport = tRows[0];

    // Clean up expired temporary holds
    await pool.query(`
      DELETE FROM transport_seat_bookings 
      WHERE status = 'held' AND hold_expires_at IS NOT NULL AND hold_expires_at < NOW()
    `);

    // Fetch confirmed booked & currently active held seats for this date
    const [seatRows] = await pool.query(`
      SELECT seat_number, deck_tier, status, coach_class, hold_expires_at
      FROM transport_seat_bookings
      WHERE transport_id = ? AND travel_date = ? AND status IN ('booked', 'held')
    `, [transportId, travel_date]);

    const bookedSeats = seatRows.filter(s => s.status === 'booked').map(s => s.seat_number);
    const heldSeats = seatRows.filter(s => s.status === 'held').map(s => s.seat_number);

    return res.json({
      success: true,
      transport_id: parseInt(transportId),
      travel_date,
      seats_total: transport.seats_total || 40,
      transport_type: transport.transport_type,
      vehicle_model: transport.vehicle_model,
      booked_seats: bookedSeats, // Turned RED in UI
      held_seats: heldSeats,     // Turned ORANGE in UI
      available_count: Math.max(0, (transport.seats_total || 40) - bookedSeats.length - heldSeats.length)
    });
  } catch (error) {
    console.error('Get Seat Inventory Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch seat inventory.' });
  }
});

// -------------------------------------------------------------
// 5. POST /api/transport/:id/hold-seats - Temporary 10-minute hold
// -------------------------------------------------------------
router.post('/:id/hold-seats', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const transportId = req.params.id;
    const { travel_date, seats = [], deck_tier = 'lower', coach_class = 'standard' } = req.body;

    if (!travel_date || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, message: 'Travel date and at least one seat are required.' });
    }

    await connection.beginTransaction();

    // Clean up expired holds first
    await connection.query(`
      DELETE FROM transport_seat_bookings 
      WHERE status = 'held' AND hold_expires_at IS NOT NULL AND hold_expires_at < NOW()
    `);

    // Check if any seat is already booked or held by another user
    const [conflicts] = await connection.query(`
      SELECT seat_number, status, user_id
      FROM transport_seat_bookings
      WHERE transport_id = ? AND travel_date = ? AND seat_number IN (?)
      FOR UPDATE
    `, [transportId, travel_date, seats]);

    const blocked = conflicts.filter(c => c.status === 'booked' || (c.status === 'held' && c.user_id !== req.user.id));
    if (blocked.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Seats [${blocked.map(b => b.seat_number).join(', ')}] are already booked or held by another traveler. Please choose other seats.`
      });
    }

    // Insert or update temporary holds expiring in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    for (const seat of seats) {
      await connection.query(`
        INSERT INTO transport_seat_bookings (
          transport_id, travel_date, seat_number, deck_tier, coach_class, user_id, status, hold_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'held', ?)
        ON DUPLICATE KEY UPDATE 
          user_id = VALUES(user_id),
          status = 'held',
          coach_class = VALUES(coach_class),
          hold_expires_at = VALUES(hold_expires_at)
      `, [transportId, travel_date, seat, deck_tier, coach_class, req.user.id, expiresAt]);
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `${seats.length} seat(s) held for 10 minutes.`,
      held_seats: seats,
      expires_at: expiresAt
    });
  } catch (error) {
    await connection.rollback();
    console.error('Hold Seats Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to hold seats.' });
  } finally {
    connection.release();
  }
});

// -------------------------------------------------------------
// 6. POST /api/transport/driver/book - Private Driver / Cab Booking
// (Placed before /:id/book so 'driver' is not captured as :id)
// -------------------------------------------------------------
router.post('/driver/book', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      transport_id,
      trip_type = 'one_way',
      pickup_location,
      drop_location,
      pickup_date,
      pickup_time = '09:00 AM',
      return_date = null,
      passengers_count = 1,
      luggage_count = 1,
      vehicle_category = 'SUV',
      lead_passenger,
      contact_phone,
      contact_email,
      discount_code = null,
      payment_method = 'UPI'
    } = req.body;

    if (!transport_id || !pickup_location || !drop_location || !pickup_date) {
      return res.status(400).json({ success: false, message: 'Pickup & drop locations, date, and transport ID are required.' });
    }

    await connection.beginTransaction();

    const [tRows] = await connection.query('SELECT * FROM transport WHERE id = ? FOR UPDATE', [transport_id]);
    if (tRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Vehicle service not found.' });
    }
    const transport = tRows[0];

    // Calculate fare
    let baseFare = parseFloat(transport.price);
    const tolls = 250.00; // standard expressway tolls included
    const subtotal = baseFare;
    const discount = calculateDiscount(discount_code, subtotal);
    const totalAmount = Math.max(0, subtotal + tolls - discount);

    const pnr = `CAB-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
    const txnId = `TXN_CAB_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const driverDetails = {
      pnr,
      transport_type: 'Private Driver',
      service_number: transport.service_number,
      vehicle_model: transport.vehicle_model || vehicle_category,
      provider: transport.provider,
      trip_type,
      pickup_location,
      drop_location,
      pickup_date,
      pickup_time,
      return_date,
      passengers_count: parseInt(passengers_count) || 1,
      luggage_count: parseInt(luggage_count) || 1,
      vehicle_category,
      driver_name: transport.driver_name || 'Assigned Licensed Chauffeur',
      driver_phone: transport.driver_phone || '+91 98450 99887',
      driver_rating: transport.driver_rating || 4.9,
      contact: {
        lead_passenger: lead_passenger || req.user.name,
        phone: contact_phone || req.user.phone || '',
        email: contact_email || req.user.email
      },
      fare_summary: {
        base_fare: baseFare,
        toll_taxes: tolls,
        discount,
        total_paid: totalAmount
      }
    };

    // 1. Insert into bookings
    const [bookingResult] = await connection.query(`
      INSERT INTO bookings (
        user_id, transport_id, booking_type, booking_reference,
        travel_date, people_count, total_amount, discount_amount, discount_code,
        payment_method, payment_status, transaction_id, status,
        booking_details, special_requests
      ) VALUES (?, ?, 'Transport', ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, 'Confirmed', ?, ?)
    `, [
      req.user.id,
      transport.id,
      pnr,
      pickup_date,
      passengers_count,
      totalAmount,
      discount,
      discount_code || null,
      payment_method,
      txnId,
      JSON.stringify(driverDetails),
      `Private Driver (${vehicle_category}) from ${pickup_location} to ${drop_location}`
    ]);

    const bookingId = bookingResult.insertId;

    // 2. Insert into transport_driver_bookings
    await connection.query(`
      INSERT INTO transport_driver_bookings (
        transport_id, booking_id, user_id, trip_type, pickup_location, drop_location,
        pickup_date, pickup_time, return_date, passengers_count, luggage_count,
        vehicle_category, base_fare, toll_taxes, total_amount,
        driver_assigned_name, driver_assigned_phone, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `, [
      transport.id,
      bookingId,
      req.user.id,
      trip_type,
      pickup_location,
      drop_location,
      pickup_date,
      pickup_time,
      return_date || null,
      passengers_count,
      luggage_count,
      vehicle_category,
      baseFare,
      tolls,
      totalAmount,
      transport.driver_name || 'Assigned Licensed Chauffeur',
      transport.driver_phone || '+91 98450 99887'
    ]);

    // 3. Insert payment
    await connection.query(`
      INSERT INTO payments (
        booking_id, user_id, demo_transaction_id, payment_method,
        payment_submethod, amount, currency, payment_status, is_demo, metadata
      ) VALUES (?, ?, ?, ?, 'PRIVATE_CHAUFFEUR', ?, 'INR', 'demo_success', 1, ?)
    `, [
      bookingId,
      req.user.id,
      txnId,
      payment_method,
      totalAmount,
      JSON.stringify({ pnr, mode: 'Private Driver', vehicle: vehicle_category })
    ]);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: `🎉 Chauffeur cab reservation confirmed! Voucher PNR: ${pnr}`,
      booking_id: bookingId,
      booking_reference: pnr,
      pnr,
      transaction_id: txnId,
      total_amount: totalAmount,
      ticket: driverDetails
    });
  } catch (error) {
    await connection.rollback();
    console.error('Private Driver Booking Error:', error);
    return res.status(500).json({ success: false, message: 'Driver booking failed: ' + error.message });
  } finally {
    connection.release();
  }
});

// -------------------------------------------------------------
// 7. POST /api/transport/:id/book - Atomic seat reservation & ticket issuance
// -------------------------------------------------------------
router.post('/:id/book', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const transportId = req.params.id;
    const {
      travel_date,
      passengers = [],
      selected_seats = [],
      seats = [],
      coach_class = 'standard',
      deck_tier = 'lower',
      boarding_point = null,
      dropping_point = null,
      contact_email = null,
      contact_phone = null,
      discount_code = null,
      payment_method = 'UPI'
    } = req.body;

    const seatsToBook = (Array.isArray(selected_seats) && selected_seats.length > 0)
      ? selected_seats
      : (Array.isArray(seats) && seats.length > 0 ? seats : []);

    if (!travel_date) {
      return res.status(400).json({ success: false, message: 'Travel date is required.' });
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one passenger details are required.' });
    }

    if (seatsToBook.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select your seat(s) to proceed.' });
    }

    if (passengers.length !== seatsToBook.length) {
      return res.status(400).json({ success: false, message: 'Passenger count must match selected seats count.' });
    }

    await connection.beginTransaction();

    // 1. Fetch transport details with lock
    const [tRows] = await connection.query('SELECT * FROM transport WHERE id = ? FOR UPDATE', [transportId]);
    if (tRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Transport option not found.' });
    }
    const transport = tRows[0];

    // 2. Prevent Double Booking: Check if any seat is already booked for this departure and date
    const [existingBooked] = await connection.query(`
      SELECT seat_number 
      FROM transport_seat_bookings
      WHERE transport_id = ? AND travel_date = ? AND seat_number IN (?) AND status = 'booked'
      FOR UPDATE
    `, [transportId, travel_date, seatsToBook]);

    if (existingBooked.length > 0) {
      await connection.rollback();
      const bookedList = existingBooked.map(b => b.seat_number).join(', ');
      return res.status(409).json({
        success: false,
        message: `Seat(s) ${bookedList} were just booked by another traveler. Please pick another seat.`
      });
    }

    // 3. Server-side price calculation
    let baseFarePerSeat = parseFloat(transport.price);
    const classOpts = typeof transport.class_options === 'string' ? JSON.parse(transport.class_options || '[]') : (transport.class_options || []);
    if (coach_class && Array.isArray(classOpts) && classOpts.length > 0) {
      const matched = classOpts.find(c => c.code === coach_class || c.name === coach_class);
      if (matched && matched.fare) {
        baseFarePerSeat = parseFloat(matched.fare);
      }
    }

    const subtotal = baseFarePerSeat * seatsToBook.length;
    const gstRate = 0.05; // 5% GST
    const gstTax = Math.round(subtotal * gstRate);
    const convenienceFee = transport.transport_type === 'Flight' ? 50 : transport.transport_type === 'Train' ? 15 : 20;
    const discountAmount = calculateDiscount(discount_code, subtotal);
    const totalAmount = Math.max(0, subtotal + gstTax + convenienceFee - discountAmount);

    // 4. Generate unique PNR / Booking Reference
    const prefixMap = {
      Train: 'TRN',
      Bus: 'BUS',
      Flight: 'FLT',
      'Private Driver': 'CAB'
    };
    const prefix = prefixMap[transport.transport_type] || 'THB';
    const pnr = `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
    const txnId = `TXN_IND_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const bookingDetails = {
      pnr,
      transport_type: transport.transport_type,
      service_number: transport.service_number,
      vehicle_model: transport.vehicle_model,
      provider: transport.provider,
      route: transport.route,
      from_city: transport.from_city,
      to_city: transport.to_city,
      departure_time: transport.departure_time,
      arrival_time: transport.arrival_time,
      duration: transport.duration,
      coach_class,
      deck_tier,
      seats: seatsToBook,
      passengers,
      boarding_point,
      dropping_point,
      contact: {
        email: contact_email || req.user.email,
        phone: contact_phone || req.user.phone || ''
      },
      fare_summary: {
        base_fare: subtotal,
        per_seat: baseFarePerSeat,
        gst_tax: gstTax,
        convenience_fee: convenienceFee,
        discount: discountAmount,
        total_paid: totalAmount
      }
    };

    // 5. Insert main booking record
    const [bookingResult] = await connection.query(`
      INSERT INTO bookings (
        user_id, transport_id, booking_type, booking_reference,
        travel_date, people_count, total_amount, discount_amount, discount_code,
        payment_method, payment_status, transaction_id, status,
        booking_details, special_requests
      ) VALUES (?, ?, 'Transport', ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, 'Confirmed', ?, ?)
    `, [
      req.user.id,
      transport.id,
      pnr,
      travel_date,
      seatsToBook.length,
      totalAmount,
      discountAmount,
      discount_code || null,
      payment_method,
      txnId,
      JSON.stringify(bookingDetails),
      `Seats: ${seatsToBook.join(', ')} (${coach_class})`
    ]);

    const bookingId = bookingResult.insertId;

    // 6. Record each seat booking in transport_seat_bookings (Locking the seats!)
    for (let i = 0; i < seatsToBook.length; i++) {
      const seat = seatsToBook[i];
      const passenger = passengers[i] || {};

      await connection.query(`
        INSERT INTO transport_seat_bookings (
          transport_id, travel_date, seat_number, deck_tier, coach_class,
          booking_id, user_id, status, passenger_name, passenger_age, passenger_gender, hold_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'booked', ?, ?, ?, NULL)
        ON DUPLICATE KEY UPDATE
          booking_id = VALUES(booking_id),
          user_id = VALUES(user_id),
          status = 'booked',
          passenger_name = VALUES(passenger_name),
          passenger_age = VALUES(passenger_age),
          passenger_gender = VALUES(passenger_gender),
          hold_expires_at = NULL
      `, [
        transport.id,
        travel_date,
        seat,
        deck_tier,
        coach_class,
        bookingId,
        req.user.id,
        passenger.name || 'Passenger',
        passenger.age ? parseInt(passenger.age) : 25,
        passenger.gender || 'Other'
      ]);
    }

    // 7. Record payment transaction in payments table
    await connection.query(`
      INSERT INTO payments (
        booking_id, user_id, demo_transaction_id, payment_method,
        payment_submethod, amount, currency, payment_status, is_demo, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, 'INR', 'demo_success', 1, ?)
    `, [
      bookingId,
      req.user.id,
      txnId,
      payment_method,
      'INSTANT_CONFIRMATION',
      totalAmount,
      JSON.stringify({ pnr, seats: selected_seats, mode: transport.transport_type })
    ]);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: `🎉 Transport booking confirmed! Ticket PNR: ${pnr}`,
      booking_id: bookingId,
      booking_reference: pnr,
      pnr,
      transaction_id: txnId,
      total_amount: totalAmount,
      ticket: bookingDetails
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create Transport Booking Error:', error);
    return res.status(500).json({ success: false, message: 'Booking transaction failed: ' + error.message });
  } finally {
    connection.release();
  }
});


// -------------------------------------------------------------
// 8. POST /api/transport/bookings/:id/cancel - Cancellation & Seat Release
// -------------------------------------------------------------
router.post('/bookings/:id/cancel', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const bookingId = req.params.id;
    const { reason = 'Cancelled by passenger' } = req.body;

    await connection.beginTransaction();

    // Check booking exists and belongs to user
    const [bRows] = await connection.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
    if (bRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const b = bRows[0];
    if (b.user_id !== req.user.id && req.user.role !== 'Admin') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this booking.' });
    }

    if (b.status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
    }

    // Calculate refund amount (standard: 80% refund if cancelled before travel date)
    const paidAmount = parseFloat(b.total_amount || 0);
    const refundAmount = Math.round(paidAmount * 0.85); // 85% refunded, 15% cancellation fee

    // Update booking
    await connection.query(`
      UPDATE bookings SET
        status = 'Cancelled',
        cancellation_reason = ?,
        refund_amount = ?,
        refund_status = 'Refunded'
      WHERE id = ?
    `, [reason, refundAmount, bookingId]);

    // Release booked seats in transport_seat_bookings
    await connection.query(`
      DELETE FROM transport_seat_bookings WHERE booking_id = ?
    `, [bookingId]);

    // Update driver bookings
    await connection.query(`
      UPDATE transport_driver_bookings SET status = 'cancelled' WHERE booking_id = ?
    `, [bookingId]);

    await connection.commit();

    return res.json({
      success: true,
      message: `Reservation #${bookingId} has been cancelled. Simulated refund of ₹${refundAmount.toLocaleString('en-IN')} has been initiated.`,
      refund_amount: refundAmount,
      refund_status: 'Refunded'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Cancel Transport Booking Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel reservation.' });
  } finally {
    connection.release();
  }
});

// -------------------------------------------------------------
// Admin Management Routes
// -------------------------------------------------------------
router.post('/admin/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      destination_id,
      transport_type,
      provider,
      from_city,
      to_city,
      route,
      service_number,
      vehicle_model,
      departure_time,
      arrival_time,
      price,
      duration,
      seats_total,
      booking_info,
      class_options,
      amenities
    } = req.body;

    if (!transport_type || !provider || !price) {
      return res.status(400).json({ success: false, message: 'Provider, type, and price are required.' });
    }

    const [result] = await pool.query(`
      INSERT INTO transport (
        destination_id, transport_type, provider, from_city, to_city,
        route, service_number, vehicle_model, departure_time, arrival_time,
        price, duration, seats_total, booking_info, class_options, amenities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      destination_id || null,
      transport_type,
      provider,
      from_city || '',
      to_city || '',
      route || `${from_city || ''} → ${to_city || ''}`,
      service_number || null,
      vehicle_model || null,
      departure_time || '06:00 AM',
      arrival_time || '10:00 AM',
      parseFloat(price),
      duration || '4h 00m',
      seats_total ? parseInt(seats_total) : 40,
      booking_info || null,
      class_options ? JSON.stringify(class_options) : null,
      amenities ? JSON.stringify(amenities) : null
    ]);

    return res.status(201).json({
      success: true,
      message: `${transport_type} service created successfully.`,
      transportId: result.insertId
    });
  } catch (error) {
    console.error('Admin Create Transport Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create transport.' });
  }
});

router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      transport_type,
      provider,
      from_city,
      to_city,
      route,
      service_number,
      vehicle_model,
      departure_time,
      arrival_time,
      price,
      duration,
      seats_total
    } = req.body;

    await pool.query(`
      UPDATE transport SET
        transport_type = COALESCE(?, transport_type),
        provider = COALESCE(?, provider),
        from_city = COALESCE(?, from_city),
        to_city = COALESCE(?, to_city),
        route = COALESCE(?, route),
        service_number = COALESCE(?, service_number),
        vehicle_model = COALESCE(?, vehicle_model),
        departure_time = COALESCE(?, departure_time),
        arrival_time = COALESCE(?, arrival_time),
        price = COALESCE(?, price),
        duration = COALESCE(?, duration),
        seats_total = COALESCE(?, seats_total)
      WHERE id = ?
    `, [
      transport_type,
      provider,
      from_city,
      to_city,
      route,
      service_number,
      vehicle_model,
      departure_time,
      arrival_time,
      price !== undefined ? parseFloat(price) : null,
      duration,
      seats_total !== undefined ? parseInt(seats_total) : null,
      req.params.id
    ]);

    return res.json({ success: true, message: 'Transport option updated successfully.' });
  } catch (error) {
    console.error('Admin Update Transport Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update transport.' });
  }
});

router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM transport WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Transport option deleted successfully.' });
  } catch (error) {
    console.error('Admin Delete Transport Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete transport.' });
  }
});

module.exports = router;
