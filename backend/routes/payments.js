const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { getListingCapacityUnits, getListingPriceTotal } = require('../services/listingCapacity');
const { calculatePackageCheckoutTotal } = require('../services/packagePricing');
const {
  getHotelNightCount,
  getHotelRoomPrice,
  calculateHotelCheckoutTotal
} = require('../services/hotelPricing');

const router = express.Router();

// Supported promotional coupons for Indian tourism packages
const VALID_COUPONS = {
  NAMASTE10: { type: 'percent', value: 10, description: '10% Festive Tourist Discount' },
  INCREDIBLE2026: { type: 'flat', value: 2000, description: '₹2,000 Off Incredible India Promo' },
  AIPLAN1500: { type: 'flat', value: 1500, description: '₹1,500 AI Itinerary Booking Reward' },
  COUPLEDEAL: { type: 'flat', value: 1200, description: '₹1,200 Couple Special Saver' },
  FIRSTTRIP: { type: 'flat', value: 1000, description: '₹1,000 Welcome Tourist Voucher' }
};

/**
 * Helper: Generate unique demo transaction ID
 * Format: DEMO_TXN_<timestamp>_<random6>
 */
function generateDemoTxnId() {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DEMO_TXN_${timestamp}_${rand}`;
}

/**
 * POST /api/payments/simulate
 * Simulates payment for an existing booking record.
 * 
 * Body: {
 *   booking_id: number,
 *   scenario: 'success' | 'failure' | 'cancel',
 *   payment_method: 'UPI' | 'CARD' | 'NETBANKING',
 *   payment_submethod: 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM UPI' | 'HDFC' | 'Visa' etc.,
 *   amount: number
 * }
 */
router.post('/simulate', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      booking_id,
      scenario = 'success',
      payment_method = 'UPI',
      payment_submethod = 'Google Pay',
      amount
    } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const validScenarios = ['success', 'failure', 'cancel'];
    const chosenScenario = validScenarios.includes(scenario) ? scenario : 'success';

    // 1. Fetch booking and verify ownership
    const [bookings] = await connection.query(
      `SELECT b.*, 
              pkg.title as package_title, 
              p.name as destination_name,
              h.name as hotel_name,
              t.provider as transport_provider,
              u.email as user_email, u.full_name as user_name
       FROM bookings b
       LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
       LEFT JOIN tourist_places p ON pkg.destination_id = p.id
       LEFT JOIN hotels h ON b.hotel_id = h.id
       LEFT JOIN transport t ON b.transport_id = t.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [booking_id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];

    // Ownership check (test scenario: attempt to access another user's booking must be rejected)
    if (booking.user_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to pay for this booking.'
      });
    }

    // 2. Validate amount (test scenario: attempt to submit modified amount must be rejected)
    const bookingTotal = parseFloat(booking.total_amount);
    if (amount !== undefined && amount !== null) {
      const clientAmount = parseFloat(amount);
      if (Math.abs(clientAmount - bookingTotal) > 0.05) {
        return res.status(400).json({
          success: false,
          message: `Amount mismatch: Submitted amount ₹${clientAmount.toLocaleString('en-IN')} does not match verified booking total ₹${bookingTotal.toLocaleString('en-IN')}.`
        });
      }
    }

    // 3. Prevent duplicate successful payments
    if (booking.payment_status === 'Paid') {
      const [existingSuccess] = await connection.query(
        `SELECT * FROM payments WHERE booking_id = ? AND payment_status = 'demo_success' LIMIT 1`,
        [booking_id]
      );
      if (existingSuccess.length > 0) {
        return res.status(409).json({
          success: false,
          already_paid: true,
          message: 'This booking has already been successfully paid for.',
          transaction: existingSuccess[0]
        });
      }
    }

    // 4. Generate unique demo transaction ID
    const demoTxnId = generateDemoTxnId();
    const paymentStatus = chosenScenario === 'success' ? 'demo_success' : chosenScenario === 'failure' ? 'demo_failed' : 'demo_cancelled';
    const errorReason = chosenScenario === 'failure' ? 'Simulation: Payment was declined by simulated bank network.' : (chosenScenario === 'cancel' ? 'Simulation: Transaction cancelled by user.' : null);

    await connection.beginTransaction();

    // 5. Insert record into payments table
    const [payInsert] = await connection.query(
      `INSERT INTO payments (
         booking_id, user_id, demo_transaction_id, payment_method, payment_submethod,
         amount, currency, payment_status, is_demo, error_reason, metadata
       ) VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, 1, ?, ?)`,
      [
        booking.id,
        req.user.id,
        demoTxnId,
        payment_method,
        payment_submethod || null,
        bookingTotal,
        paymentStatus,
        errorReason,
        JSON.stringify({
          client_ip: req.ip || '127.0.0.1',
          simulated_at: new Date().toISOString(),
          scenario: chosenScenario
        })
      ]
    );

    // 6. Update booking status accordingly
    if (chosenScenario === 'success') {
      await connection.query(
        `UPDATE bookings 
         SET payment_status = 'Paid', 
             status = 'Confirmed', 
             payment_method = ?, 
             transaction_id = ? 
         WHERE id = ?`,
        [payment_method, demoTxnId, booking.id]
      );
    } else if (chosenScenario === 'failure') {
      await connection.query(
        `UPDATE bookings 
         SET payment_status = 'Failed', 
             transaction_id = ? 
         WHERE id = ?`,
        [demoTxnId, booking.id]
      );
    } else if (chosenScenario === 'cancel') {
      await connection.query(
        `UPDATE bookings 
         SET payment_status = 'Pending' 
         WHERE id = ?`,
        [booking.id]
      );
    }

    await connection.commit();

    const itemName = booking.package_title || booking.hotel_name || booking.transport_provider || 'Tourist Experience';
    const destination = booking.destination_name || 'India';

    return res.status(chosenScenario === 'success' ? 200 : (chosenScenario === 'failure' ? 402 : 200)).json({
      success: chosenScenario === 'success',
      payment_status: paymentStatus,
      scenario: chosenScenario,
      is_demo: true,
      message: chosenScenario === 'success'
        ? 'Demo payment simulated successfully! Your booking is confirmed.'
        : (chosenScenario === 'failure'
            ? 'Demo payment was declined (simulated failure). Please retry or select another method.'
            : 'Demo payment cancelled by user. Your booking details are preserved.'),
      transaction: {
        payment_record_id: payInsert.insertId,
        demo_transaction_id: demoTxnId,
        booking_id: booking.id,
        booking_reference: `TH-BK-${booking.id}`,
        item_name: itemName,
        destination,
        travel_date: booking.travel_date,
        people_count: booking.people_count,
        amount: bookingTotal,
        currency: 'INR',
        payment_method,
        payment_submethod,
        status: paymentStatus,
        timestamp: new Date().toISOString(),
        disclaimer: 'This is a simulated transaction. No real money was charged.'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Payment Simulation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'We could not confirm your booking. Please try again.',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/payments/checkout-and-simulate
 * Creates the booking and records a clearly marked no-charge demo payment.
 */
router.post('/checkout-and-simulate', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const {
      booking_type = 'package',
      package_id,
      hotel_id,
      transport_id,
      guide_id,
      listing_id,
      travel_date,
      return_date,
      check_in,
      check_out,
      hotel_room_type,
      people_count = 1,
      total_amount,
      discount_amount = 0,
      discount_code = null,
      special_requests,
      payment_method = 'UPI',
      payment_submethod = 'Google Pay',
      scenario = 'success'
    } = req.body;

    const supportedBookingTypes = ['package', 'hotel', 'guide', 'partner_listing', 'transport'];
    const people = Number.parseInt(people_count, 10);
    if (!supportedBookingTypes.includes(booking_type)) {
      return res.status(400).json({ success: false, message: 'Choose a supported booking type.' });
    }
    if (!Number.isSafeInteger(people) || people < 1 || people > 20) {
      return res.status(400).json({ success: false, message: 'Guest count must be between 1 and 20.' });
    }
    let verifiedTotal = 0;
    let appliedDiscount = 0;
    const partnerListingBooking = booking_type === 'partner_listing';
    const cataloguePackageBooking = booking_type === 'package' && Boolean(package_id);
    const customPackageBooking = booking_type === 'package' && !package_id;
    const hotelBooking = booking_type === 'hotel';
    const guideBooking = booking_type === 'guide';
    let cataloguePackagePrice = null;
    let hotelRoomPrice = null;
    let hotelNights = null;
    let listingCapacityUnits = people;

    // 1. Backend validation of catalogue prices
    if (partnerListingBooking) {
      const parsedListingId = Number(listing_id);
      if (!Number.isSafeInteger(parsedListingId) || parsedListingId <= 0 || people < 1) {
        return res.status(400).json({ success: false, message: 'A valid service listing and guest count are required.' });
      }
      await connection.beginTransaction();
      const [[listing]] = await connection.query(
        `SELECT psl.id, psl.price, psl.price_unit, psl.capacity, psl.status, psl.category, psl.listing_title,
                psl.partner_user_id,
                pa.status AS application_status, u.is_active AS partner_active
         FROM partner_service_listings psl
         JOIN partner_applications pa ON pa.id = psl.application_id
         LEFT JOIN users u ON u.id = psl.partner_user_id
         WHERE psl.id = ?
         FOR UPDATE`,
        [parsedListingId]
      );
      if (!listing || listing.status !== 'Published' || listing.application_status !== 'Approved'
        || (listing.partner_user_id !== null && Number(listing.partner_active) !== 1)) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'This service is no longer available.' });
      }
      listingCapacityUnits = getListingCapacityUnits(listing.category, listing.listing_title, people);
      const [[{ booked_units: bookedUnits }]] = await connection.query(
        `SELECT COALESCE(SUM(capacity_units), 0) AS booked_units
         FROM bookings
         WHERE listing_id = ? AND status IN ('Confirmed', 'Completed')`,
        [parsedListingId]
      );
      if (Number(bookedUnits) + listingCapacityUnits > Number(listing.capacity)) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: 'This service no longer has enough availability. Please choose another service.' });
      }
      verifiedTotal = getListingPriceTotal(listing.category, listing.listing_title, listing.price_unit, listing.price, people);
    } else if (cataloguePackageBooking) {
      const [[pkg]] = await connection.query(
        'SELECT id, price FROM travel_packages WHERE id = ?',
        [package_id]
      );
      if (!pkg) {
        return res.status(404).json({ success: false, message: 'This travel package is no longer available.' });
      }
      cataloguePackagePrice = Number(pkg.price);
      verifiedTotal = cataloguePackagePrice * people;
    } else if (customPackageBooking) {
      const customTotal = Number(total_amount);
      if (!Number.isFinite(customTotal) || customTotal <= 0
        || !Number.isFinite(Number(discount_amount)) || Number(discount_amount) < 0
        || Number(discount_amount) > customTotal) {
        return res.status(400).json({ success: false, message: 'A valid custom package total is required.' });
      }
      verifiedTotal = customTotal;
      appliedDiscount = Number(discount_amount) || 0;
    } else if (hotelBooking) {
      const parsedHotelId = Number(hotel_id);
      if (!Number.isSafeInteger(parsedHotelId) || parsedHotelId <= 0 || people < 1) {
        return res.status(400).json({ success: false, message: 'A valid hotel and guest count are required.' });
      }
      hotelNights = getHotelNightCount(check_in || travel_date, check_out || return_date);
      if (!hotelNights) {
        return res.status(400).json({ success: false, message: 'Choose a valid check-in date and a later check-out date.' });
      }
      const [[hotel]] = await connection.query(
        'SELECT id, price_per_night FROM hotels WHERE id = ?',
        [parsedHotelId]
      );
      if (!hotel) {
        return res.status(404).json({ success: false, message: 'This hotel is no longer available.' });
      }
      hotelRoomPrice = getHotelRoomPrice(hotel.price_per_night, hotel_room_type || 'standard');
      if (hotelRoomPrice === null) {
        return res.status(400).json({ success: false, message: 'Choose a valid room type.' });
      }
      verifiedTotal = hotelRoomPrice * hotelNights * people;
    } else if (booking_type === 'transport' && transport_id) {
      const [trans] = await connection.query('SELECT * FROM transport WHERE id = ?', [transport_id]);
      if (trans.length > 0) {
        verifiedTotal = parseFloat(trans[0].price_per_day || 1200) * people;
      }
    } else if (guideBooking) {
      const [[guide]] = await connection.query('SELECT id, price_per_day, price FROM guides WHERE id = ?', [guide_id]);
      if (!guide) {
        return res.status(404).json({ success: false, message: 'This guide is no longer available.' });
      }
      const guidePrice = Number(guide.price_per_day || guide.price);
      if (!Number.isFinite(guidePrice) || guidePrice <= 0) {
        return res.status(400).json({ success: false, message: 'This guide has an invalid price. Please contact support.' });
      }
      verifiedTotal = guidePrice * people;
    }

    if (discount_code != null && typeof discount_code !== 'string') {
      if (partnerListingBooking) await connection.rollback();
      return res.status(400).json({ success: false, message: 'The promo code must be text.' });
    }

    // Apply validated discount if coupon exists
    if (!customPackageBooking && discount_code && VALID_COUPONS[discount_code.toUpperCase().trim()]) {
      const coupon = VALID_COUPONS[discount_code.toUpperCase().trim()];
      if (coupon.type === 'percent') {
        appliedDiscount = Math.round((verifiedTotal * coupon.value) / 100);
      } else {
        appliedDiscount = Math.min(coupon.value, verifiedTotal);
      }
    }

    if (!customPackageBooking) verifiedTotal = Math.max(0, verifiedTotal - appliedDiscount);
    if (partnerListingBooking) {
      verifiedTotal += Math.round(verifiedTotal * 0.05);
    }
    if (cataloguePackageBooking) {
      verifiedTotal = calculatePackageCheckoutTotal(
        cataloguePackagePrice,
        people,
        appliedDiscount
      );
    }
    if (hotelBooking) {
      verifiedTotal = calculateHotelCheckoutTotal(
        hotelRoomPrice,
        hotelNights,
        people,
        appliedDiscount
      );
    }
    if (guideBooking) {
      verifiedTotal += Math.round(verifiedTotal * 0.05);
    }

    // If client supplied total_amount, verify that it doesn't deviate
    if (total_amount !== undefined && total_amount !== null) {
      const submittedTotal = Number(total_amount);
      if (!Number.isFinite(submittedTotal) || submittedTotal <= 0) {
        if (partnerListingBooking) await connection.rollback();
        return res.status(400).json({ success: false, message: 'Enter a valid checkout amount.' });
      }
      if (Math.abs(submittedTotal - verifiedTotal) > 0.05
        && (partnerListingBooking || cataloguePackageBooking || hotelBooking || guideBooking)) {
        if (partnerListingBooking) await connection.rollback();
        return res.status(400).json({
          success: false,
          message: cataloguePackageBooking
            ? 'The submitted amount does not match the package price. Please refresh and try again.'
            : hotelBooking
              ? 'The submitted amount does not match the selected hotel room and dates. Please review your booking.'
            : guideBooking
              ? 'The submitted amount does not match the guide price. Please refresh and try again.'
            : 'The submitted amount does not match the service price.'
        });
      }
    }

    if (!Number.isFinite(verifiedTotal) || verifiedTotal <= 0) {
      if (connection) await connection.rollback();
      return res.status(400).json({ success: false, message: 'The booking total must be greater than zero.' });
    }

    const effectiveDate = travel_date || check_in || new Date().toISOString().split('T')[0];
    const demoTxnId = generateDemoTxnId();
    const chosenScenario = ['success', 'failure', 'cancel'].includes(scenario) ? scenario : 'success';
    const paymentStatus = chosenScenario === 'success' ? 'demo_success' : chosenScenario === 'failure' ? 'demo_failed' : 'demo_cancelled';
    const bookingStatus = chosenScenario === 'success' ? 'Confirmed' : 'Pending';
    const bookingPaymentStatus = chosenScenario === 'success' ? 'Paid' : (chosenScenario === 'failure' ? 'Failed' : 'Pending');
    const errorReason = chosenScenario === 'failure' ? 'Demo payment was declined.' : (chosenScenario === 'cancel' ? 'Demo payment was cancelled.' : null);

    if (!partnerListingBooking) await connection.beginTransaction();

    // 2. Create the booking record with customer choices & reference
    const typeCode = (booking_type || 'BK').toUpperCase().slice(0, 3);
    const bookingReference = `TH-${typeCode}-${Math.floor(100000 + Math.random() * 900000)}`;

    const selectedSeatsList = Array.isArray(req.body.selected_seats)
      ? req.body.selected_seats
      : (typeof req.body.selected_seats === 'string' && req.body.selected_seats.trim() ? req.body.selected_seats.split(',').map(s => s.trim()) : []);

    let detailedBookingData = req.body.booking_details;
    if (typeof detailedBookingData === 'string') {
      try { detailedBookingData = JSON.parse(detailedBookingData); } catch (e) { detailedBookingData = {}; }
    }
    if (!detailedBookingData || typeof detailedBookingData !== 'object') {
      detailedBookingData = {};
    }

    // Capture customer selections into booking_details
    detailedBookingData.service_category = booking_type || 'Package';
    detailedBookingData.travel_date = effectiveDate;
    detailedBookingData.people_count = people;

    if (booking_type === 'transport' || transport_id) {
      detailedBookingData.selected_seats = selectedSeatsList.length > 0 ? selectedSeatsList : (detailedBookingData.selected_seats || []);
      detailedBookingData.seat_numbers = detailedBookingData.selected_seats.join(', ');
      detailedBookingData.from_city = req.body.from_city || detailedBookingData.from_city || '';
      detailedBookingData.to_city = req.body.to_city || detailedBookingData.to_city || '';
      detailedBookingData.departure_time = req.body.departure_time || detailedBookingData.departure_time || '';
    } else if (booking_type === 'hotel' || hotel_id) {
      detailedBookingData.room_type = hotel_room_type || req.body.room_type || detailedBookingData.room_type || 'Standard Room';
      detailedBookingData.nights = hotelNights || detailedBookingData.nights || 1;
      detailedBookingData.check_in = check_in || effectiveDate;
      detailedBookingData.check_out = check_out || return_date;
    }

    const calculatedCapacityUnits = partnerListingBooking
      ? listingCapacityUnits
      : (booking_type === 'transport' ? (selectedSeatsList.length || people) : people);

    const bookingFields = [
      'user_id', 'package_id', 'hotel_id', 'transport_id', 'guide_id',
      'booking_type', 'booking_reference', 'capacity_units', 'booking_details',
      'travel_date', 'return_date', 'people_count', 'total_amount',
      'discount_amount', 'discount_code', 'payment_method', 'payment_status',
      'transaction_id', 'status', 'special_requests'
    ];
    const bookingValues = [
      req.user.id,
      package_id || null,
      hotel_id || null,
      transport_id || null,
      guide_id || null,
      booking_type || 'Package',
      bookingReference,
      calculatedCapacityUnits,
      JSON.stringify(detailedBookingData),
      effectiveDate,
      return_date || check_out || null,
      people,
      verifiedTotal,
      appliedDiscount,
      discount_code || null,
      payment_method,
      bookingPaymentStatus,
      demoTxnId,
      bookingStatus,
      special_requests || null
    ];
    if (partnerListingBooking) {
      bookingFields.splice(5, 0, 'listing_id');
      bookingValues.splice(5, 0, Number(listing_id));
    }

    const placeholders = bookingFields.map(() => '?').join(', ');
    const [bookingRes] = await connection.query(
      `INSERT INTO bookings (${bookingFields.join(', ')}) VALUES (${placeholders})`,
      bookingValues
    );

    const bookingId = bookingRes.insertId;

    // Lock chosen seats in transport_seat_bookings
    if (transport_id && selectedSeatsList.length > 0 && bookingStatus === 'Confirmed') {
      try {
        for (const seatNum of selectedSeatsList) {
          await connection.query(`
            INSERT INTO transport_seat_bookings (
              transport_id, travel_date, seat_number, deck_tier, coach_class,
              booking_id, user_id, status, passenger_name, hold_expires_at
            ) VALUES (?, ?, ?, 'lower', 'standard', ?, ?, 'booked', ?, NULL)
            ON DUPLICATE KEY UPDATE status = 'booked', booking_id = VALUES(booking_id), user_id = VALUES(user_id)
          `, [transport_id, effectiveDate, String(seatNum), bookingId, req.user.id, req.user.name || 'Passenger']);
        }
      } catch (seatErr) {
        console.warn('Seat booking insertion notice:', seatErr.message);
      }
    }

    // Record the demo attempt. This application does not charge real money.
    const [payInsert] = await connection.query(
      `INSERT INTO payments (
         booking_id, user_id, demo_transaction_id, payment_method, payment_submethod,
         amount, currency, payment_status, is_demo, error_reason, metadata
       ) VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, 1, ?, ?)`,
      [
        bookingId,
        req.user.id,
        demoTxnId,
        payment_method,
        payment_submethod || null,
        verifiedTotal,
        paymentStatus,
        errorReason,
        JSON.stringify({
          client_ip: req.ip || '127.0.0.1',
          simulated_at: new Date().toISOString(),
          scenario: chosenScenario
        })
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: chosenScenario === 'success',
      payment_status: paymentStatus,
      scenario: chosenScenario,
      is_demo: true,
      message: chosenScenario === 'success'
        ? 'Demo checkout completed. Your booking is confirmed; no money was charged.'
        : (chosenScenario === 'failure'
            ? 'Demo payment was declined. Your booking is still pending and you can retry.'
            : 'Demo payment was cancelled. Your booking details are preserved.'),
      booking_id: bookingId,
      booking_reference: bookingReference,
      transaction: {
        payment_record_id: payInsert.insertId,
        demo_transaction_id: demoTxnId,
        booking_id: bookingId,
        booking_reference: `TH-BK-${bookingId}`,
        amount: verifiedTotal,
        currency: 'INR',
        payment_method,
        payment_submethod,
        status: paymentStatus,
        timestamp: new Date().toISOString(),
        disclaimer: 'This is a simulated transaction. No real money was charged.'
      }
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Checkout rollback error:', rollbackError);
      }
    }
    console.error('Checkout Simulation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'We could not complete checkout. Please try again.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/payments/booking/:bookingId
 * Returns payments associated with a booking (validates ownership)
 */
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const [bookings] = await pool.query(
      `SELECT b.*, u.full_name as user_name, u.email as user_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];

    // Ownership check
    if (booking.user_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [payments] = await pool.query(
      `SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC`,
      [bookingId]
    );

    return res.json({
      success: true,
      booking,
      payments
    });
  } catch (error) {
    console.error('Get Booking Payments Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment details.' });
  }
});

/**
 * GET /api/payments/receipt/:transactionId
 * Returns receipt data for a captured provider payment or demo transaction.
 */
router.get('/receipt/:demoTransactionId', authenticateToken, async (req, res) => {
  try {
    const txnId = req.params.demoTransactionId;

    const [rows] = await pool.query(
      `SELECT p.*, 
              b.travel_date, b.return_date, b.people_count, b.booking_type,
              u.full_name as user_name, u.email as user_email, u.phone as user_phone,
              pkg.title as package_title,
              dest.name as destination_name,
              h.name as hotel_name,
              t.provider as transport_provider
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
       LEFT JOIN tourist_places dest ON pkg.destination_id = dest.id
       LEFT JOIN hotels h ON b.hotel_id = h.id
       LEFT JOIN transport t ON b.transport_id = t.id
       WHERE p.demo_transaction_id = ?`,
      [txnId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction receipt not found.' });
    }

    const record = rows[0];

    // Ownership check
    if (record.user_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const itemName = record.package_title || record.hotel_name || record.transport_provider || 'Tourist Booking';

    return res.json({
      success: true,
      receipt: {
        receipt_no: `REC-${record.id.toString().padStart(6, '0')}`,
        demo_transaction_id: record.demo_transaction_id,
        booking_id: record.booking_id,
        booking_reference: `TH-BK-${record.booking_id}`,
        item_name: itemName,
        destination: record.destination_name || 'India',
        travel_date: record.travel_date,
        people_count: record.people_count,
        amount: parseFloat(record.amount),
        currency: record.currency,
        payment_method: record.payment_method,
        payment_submethod: record.payment_submethod,
        payment_status: record.payment_status,
        customer_name: record.user_name,
        customer_email: record.user_email,
        customer_phone: record.user_phone,
        date_time: record.created_at,
        is_demo: true,
        disclaimer: 'This is a simulated transaction. No real money was charged.'
      }
    });

  } catch (error) {
    console.error('Receipt Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve receipt.' });
  }
});

module.exports = router;
