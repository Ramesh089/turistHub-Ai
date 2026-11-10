const express = require('express');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const multer  = require('multer');
const pool    = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getListingRemainingCapacity } = require('../services/listingCapacity');

const router = express.Router();

// ─────────────────────────────────────────────
// Storage directories
// ─────────────────────────────────────────────
const IMG_DIR = path.resolve(__dirname, '..', process.env.LISTING_IMAGE_DIR || path.join('uploads', 'listing-images'));
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

// ─────────────────────────────────────────────
// Multer — listing images
// ─────────────────────────────────────────────
const ALLOWED_IMG_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMG_EXTS  = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_IMG_SIZE      = 8 * 1024 * 1024; // 8 MB

const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMG_DIR),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, unique);
  }
});

// GET /api/listings/admin/images/:filename — protected image preview for unpublished listings
router.get('/admin/images/:filename', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const filename = path.basename(sanitize(req.params.filename || ''));
    if (!filename || filename !== req.params.filename) {
      return res.status(400).json({ success: false, message: 'Invalid filename.' });
    }
    const [[image]] = await pool.query(
      'SELECT id FROM listing_images WHERE stored_filename = ? LIMIT 1',
      [filename]
    );
    const filePath = path.join(IMG_DIR, filename);
    if (!image || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }
    return res.sendFile(filePath);
  } catch (err) {
    console.error('Admin listing image preview error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

function imgFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_IMG_MIMES.includes(file.mimetype) && ALLOWED_IMG_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG, and WebP images are allowed.'));
  }
}

const uploadImages = multer({ storage: imgStorage, fileFilter: imgFileFilter, limits: { fileSize: MAX_IMG_SIZE, files: 10 } });

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

const VALID_CATEGORIES = ['Hotel', 'Bus Operator', 'Tour & Travel', 'Restaurant', 'Adventure', 'Guide', 'Other'];
const VALID_PRICE_UNITS = ['per night', 'per day', 'per person', 'per trip', 'fixed'];
const VALID_STATUSES    = ['Submitted', 'Changes Requested', 'Rejected', 'Draft', 'Published', 'Unpublished', 'Archived'];

function imageUrl(filename) {
  return `/api/listings/images/${filename}`;
}

function formatImage(img) {
  return {
    id:          img.id,
    listingId:   img.listing_id,
    filename:    img.stored_filename,
    originalName: img.original_name,
    fileSize:    img.file_size,
    mimeType:    img.mime_type,
    altText:     img.alt_text  || null,
    caption:     img.caption   || null,
    isPrimary:   !!img.is_primary,
    displayOrder: img.display_order,
    imageUrl:    imageUrl(img.stored_filename),
    adminImageUrl: `/api/listings/admin/images/${encodeURIComponent(img.stored_filename)}`,
    createdAt:   img.created_at
  };
}

function formatListing(row, images = []) {
  return {
    id:                row.id,
    applicationId:     row.application_id,
    partnerUserId:     row.partner_user_id,
    businessName:      row.business_name || null,
    partnerEmail:      row.partner_email || null,
    listingTitle:      row.listing_title,
    listingDescription: row.listing_description,
    category:          row.category,
    locationOrRoute:   row.location_or_route,
    city:              row.city,
    state:             row.state,
    price:             row.price != null ? parseFloat(row.price) : null,
    capacity:          Number(row.capacity || (row.category === 'Bus Operator' ? 40 : row.category === 'Hotel' ? 15 : row.category === 'Guide' ? 10 : 20)),
    priceUnit:         row.price_unit,
    availability:      row.availability,
    terms:             row.terms,
    extraInfo:         row.extra_info || null,
    primaryImageId:    row.primary_image_id,
    status:            row.status,
    adminNote:         row.admin_note || null,
    createdByAdminId:  row.created_by_admin_id,
    publishedAt:       row.published_at,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
    images
  };
}

async function writeListingAudit(conn, listingId, adminId, action, prevStatus, newStatus, note, changedFields) {
  await conn.query(
    `INSERT INTO listing_audit_logs
       (listing_id, admin_id, actor_user_id, actor_role, action, previous_status, new_status, note, changed_fields)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [listingId, adminId, adminId, 'Admin', action, prevStatus || null, newStatus || null, note || null,
     changedFields ? JSON.stringify(changedFields) : null]
  );
}

async function writePartnerListingAudit(conn, listingId, userId, action, prevStatus, newStatus, note, changedFields) {
  await conn.query(
    `INSERT INTO listing_audit_logs
       (listing_id, admin_id, actor_user_id, actor_role, action, previous_status, new_status, note, changed_fields)
     VALUES (?, NULL, ?, 'Business Partner', ?, ?, ?, ?, ?)`,
    [listingId, userId, action, prevStatus || null, newStatus || null, note || null,
     changedFields ? JSON.stringify(changedFields) : null]
  );
}

function hasValidImageSignature(filePath, mimeType) {
  const header = Buffer.alloc(12);
  const descriptor = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(descriptor, header, 0, header.length, 0);
    if (mimeType === 'image/jpeg') return bytesRead >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    if (mimeType === 'image/png') return bytesRead >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimeType === 'image/webp') return bytesRead >= 12 && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
    return false;
  } finally {
    fs.closeSync(descriptor);
  }
}

async function getListingImages(listingId) {
  const [rows] = await pool.query(
    'SELECT * FROM listing_images WHERE listing_id = ? ORDER BY display_order ASC, id ASC',
    [listingId]
  );
  return rows.map(formatImage);
}

// ─────────────────────────────────────────────
// Middleware: Business Partner role
// ─────────────────────────────────────────────
function requireBusinessPartner(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
  if ((req.user.role || '').toLowerCase() !== 'business partner') {
    return res.status(403).json({ success: false, message: 'Business Partner role required.' });
  }
  next();
}

function normalizePartnerListingChanges(input, listing) {
  const values = {
    listingTitle: input.listingTitle === undefined ? listing.listing_title : sanitize(input.listingTitle),
    listingDescription: input.listingDescription === undefined ? listing.listing_description || '' : sanitize(input.listingDescription),
    category: input.category === undefined ? listing.category : sanitize(input.category),
    locationOrRoute: input.locationOrRoute === undefined ? listing.location_or_route || '' : sanitize(input.locationOrRoute),
    city: input.city === undefined ? listing.city || '' : sanitize(input.city),
    state: input.state === undefined ? listing.state || '' : sanitize(input.state),
    price: input.price === undefined ? (listing.price == null ? null : Number(listing.price)) : (input.price === '' || input.price == null ? null : Number(input.price)),
    capacity: input.capacity === undefined ? Number(listing.capacity || 1) : Number(input.capacity),
    priceUnit: input.priceUnit === undefined ? listing.price_unit || '' : sanitize(input.priceUnit),
    availability: input.availability === undefined ? listing.availability || '' : sanitize(input.availability),
    terms: input.terms === undefined ? listing.terms || '' : sanitize(input.terms)
  };
  if (!values.listingTitle || values.listingTitle.length > 255) {
    return { error: { field: 'listingTitle', message: 'A listing title of at most 255 characters is required.' } };
  }
  if (!VALID_CATEGORIES.includes(values.category)) {
    return { error: { field: 'category', message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.` } };
  }
  if (values.listingDescription.length > 10000 || values.locationOrRoute.length > 255
    || values.city.length > 100 || values.state.length > 100
    || values.availability.length > 5000 || values.terms.length > 5000) {
    return { error: { message: 'One or more listing fields exceed the allowed length.' } };
  }
  if (values.price !== null && (!Number.isFinite(values.price) || values.price < 0 || values.price > 99999999.99)) {
    return { error: { field: 'price', message: 'Price must be a valid non-negative amount.' } };
  }
  if (!Number.isSafeInteger(values.capacity) || values.capacity < 1 || values.capacity > 1000000) {
    return { error: { field: 'capacity', message: 'Capacity must be a whole number between 1 and 1,000,000.' } };
  }
  if (values.priceUnit && !VALID_PRICE_UNITS.includes(values.priceUnit)) {
    return { error: { field: 'priceUnit', message: `Price unit must be one of: ${VALID_PRICE_UNITS.join(', ')}.` } };
  }
  return { values };
}

function parseChangeRequestData(value) {
  if (typeof value === 'string') return JSON.parse(value);
  return value;
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS  (tourist-visible)
// ═══════════════════════════════════════════════════════════════

// GET /api/listings/images/:filename  — serve public listing image
router.get('/images/:filename', (req, res) => {
  const filename = path.basename(sanitize(req.params.filename || ''));
  if (!filename || filename !== req.params.filename) {
    return res.status(400).json({ success: false, message: 'Invalid filename.' });
  }
  const filePath = path.join(IMG_DIR, filename);
  pool.query(
    `SELECT li.id
     FROM listing_images li
     JOIN partner_service_listings psl ON psl.id = li.listing_id
     JOIN partner_applications pa ON pa.id = psl.application_id
     LEFT JOIN users u ON u.id = psl.partner_user_id
     WHERE li.stored_filename = ? AND psl.status = 'Published' AND pa.status = 'Approved'
       AND (psl.partner_user_id IS NULL OR u.is_active = 1)
     LIMIT 1`,
    [filename]
  ).then(([rows]) => {
    if (!rows.length || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }
    res.sendFile(filePath);
  }).catch((err) => {
    console.error('Public listing image lookup error:', err);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  });
});

// GET /api/listings  — list published listings
router.get('/', async (req, res) => {
  try {
    const category = sanitize(req.query.category || '');
    const city     = sanitize(req.query.city     || '');
    const state    = sanitize(req.query.state    || '');
    const search   = sanitize(req.query.search   || '');
    const page     = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset   = (page - 1) * limit;

    const wheres = [
      "psl.status = 'Published'",
      "pa.status = 'Approved'",
      '(psl.partner_user_id IS NULL OR u.is_active = 1)'
    ];
    const params = [];

    if (category) { wheres.push('psl.category = ?'); params.push(category); }
    if (city)     { wheres.push('psl.city = ?');     params.push(city); }
    if (state)    { wheres.push('psl.state = ?');    params.push(state); }
    if (search)   {
      wheres.push('(psl.listing_title LIKE ? OR psl.listing_description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereStr = wheres.join(' AND ');

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM partner_service_listings psl
       JOIN partner_applications pa ON pa.id = psl.application_id
       LEFT JOIN users u ON u.id = psl.partner_user_id
       WHERE ${whereStr}`, params
    );

    const [rows] = await pool.query(
      `SELECT psl.*, pa.business_name,
              (SELECT COALESCE(SUM(b.capacity_units), 0) FROM bookings b
               WHERE b.listing_id = psl.id AND b.status IN ('Confirmed', 'Completed')) AS booked_units
       FROM partner_service_listings psl
       JOIN partner_applications pa ON pa.id = psl.application_id
       LEFT JOIN users u ON u.id = psl.partner_user_id
       WHERE ${whereStr}
       ORDER BY psl.published_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Attach primary image for each listing
    const listings = await Promise.all(rows.map(async (row) => {
      let primaryImg = null;
      if (row.primary_image_id) {
        const [[img]] = await pool.query('SELECT * FROM listing_images WHERE id = ?', [row.primary_image_id]);
        if (img) primaryImg = formatImage(img);
      }
      return {
        id:               row.id,
        businessName:     row.business_name,
        listingTitle:     row.listing_title,
        category:         row.category,
        locationOrRoute:  row.location_or_route,
        city:             row.city,
        state:            row.state,
        price:            row.price != null ? parseFloat(row.price) : null,
        priceUnit:        row.price_unit,
        capacity:         Number(row.capacity || (row.category === 'Bus Operator' ? 40 : row.category === 'Hotel' ? 15 : row.category === 'Guide' ? 10 : 20)),
        bookedUnits:      Number(row.booked_units || 0),
        remainingCapacity: getListingRemainingCapacity(row.capacity, row.booked_units),
        listingDescription: row.listing_description,
        extraInfo:        row.extra_info || null,
        availability:     row.availability,
        publishedAt:      row.published_at,
        primaryImage:     primaryImg
      };
    }));

    return res.json({ success: true, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, listings });
  } catch (err) {
    console.error('Public listings list error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// GET /api/listings/:id  — single published listing (tourist view)
router.get('/:id(\\d+)', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    const [[row]] = await pool.query(
      `SELECT psl.*, pa.business_name,
              (SELECT COALESCE(SUM(b.capacity_units), 0) FROM bookings b
               WHERE b.listing_id = psl.id AND b.status IN ('Confirmed', 'Completed')) AS booked_units
       FROM partner_service_listings psl
       JOIN partner_applications pa ON pa.id = psl.application_id
       LEFT JOIN users u ON u.id = psl.partner_user_id
       WHERE psl.id = ? AND psl.status = 'Published' AND pa.status = 'Approved'
         AND (psl.partner_user_id IS NULL OR u.is_active = 1)`, [id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Listing not found.' });

    const images = await getListingImages(id);
    return res.json({
      success: true,
      listing: {
        id: row.id,
        businessName: row.business_name,
        listingTitle: row.listing_title,
        listingDescription: row.listing_description,
        category: row.category,
        locationOrRoute: row.location_or_route,
        city: row.city,
        state: row.state,
        price: row.price != null ? parseFloat(row.price) : null,
        priceUnit: row.price_unit,
        capacity: Number(row.capacity || (row.category === 'Bus Operator' ? 40 : row.category === 'Hotel' ? 15 : row.category === 'Guide' ? 10 : 20)),
        bookedUnits: Number(row.booked_units || 0),
        remainingCapacity: getListingRemainingCapacity(row.capacity, row.booked_units),
        availability: row.availability,
        terms: row.terms,
        extraInfo: row.extra_info || null,
        publishedAt: row.published_at,
        primaryImage: images.find(image => image.id === row.primary_image_id) || null,
        images: images.map(({ id: imageId, imageUrl: publicImageUrl, altText, caption, isPrimary, displayOrder }) => ({
          id: imageId, imageUrl: publicImageUrl, altText, caption, isPrimary, displayOrder
        }))
      }
    });
  } catch (err) {
    console.error('Public listing detail error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PARTNER ENDPOINTS  (authenticated Business Partner)
// ═══════════════════════════════════════════════════════════════

// GET /api/listings/my  — partner's own listing(s)
router.get('/my', authenticateToken, requireBusinessPartner, async (req, res) => {
  try {
    const [[app]] = await pool.query(
      'SELECT id FROM partner_applications WHERE user_id = ?', [req.user.id]
    );
    if (!app) return res.status(404).json({ success: false, message: 'No application found for your account.' });

    const [rows] = await pool.query(
      `SELECT id, listing_title, listing_description, category, location_or_route, city, state,
              price, capacity, price_unit, availability, terms, primary_image_id, status, admin_note, published_at,
              created_at, updated_at
       FROM partner_service_listings
       WHERE application_id = ? AND partner_user_id = ?
       ORDER BY created_at DESC`,
      [app.id, req.user.id]
    );

    const listings = await Promise.all(rows.map(async (row) => {
      let primaryImg = null;
      if (row.primary_image_id) {
        const [[img]] = await pool.query('SELECT stored_filename, alt_text FROM listing_images WHERE id = ?', [row.primary_image_id]);
        if (img) primaryImg = { imageUrl: imageUrl(img.stored_filename), altText: img.alt_text };
      }
      return {
        id: row.id, listingTitle: row.listing_title, category: row.category,
        locationOrRoute: row.location_or_route, city: row.city, state: row.state,
        price: row.price != null ? parseFloat(row.price) : null,
        capacity: Number(row.capacity || 1),
        priceUnit: row.price_unit, status: row.status,
        adminNote: row.admin_note,
        listingDescription: row.listing_description,
        availability: row.availability,
        terms: row.terms,
        terms: row.terms,
        publishedAt: row.published_at, createdAt: row.created_at, primaryImage: primaryImg
      };
    }));

    return res.json({ success: true, listings });
  } catch (err) {
    console.error('Partner my listings error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

router.get('/my/change-requests', authenticateToken, requireBusinessPartner, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.listing_id AS listingId, r.proposed_data AS proposedData,
              r.status, r.admin_note AS adminNote, r.created_at AS createdAt,
              r.reviewed_at AS reviewedAt, psl.listing_title AS listingTitle,
              psl.status AS listingStatus
       FROM partner_service_change_requests r
       JOIN partner_service_listings psl ON psl.id = r.listing_id
       WHERE r.partner_user_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
      [req.user.id]
    );
    return res.json({
      success: true,
      changeRequests: rows.map(row => ({
        ...row,
        proposedData: parseChangeRequestData(row.proposedData)
      }))
    });
  } catch (err) {
    console.error('Partner service change request list error:', err);
    return res.status(500).json({ success: false, message: 'Could not load service change requests.' });
  }
});

// POST /api/listings/my — submit a service listing for administrator review
router.post('/my', authenticateToken, requireBusinessPartner, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const listingTitle = sanitize(req.body.listingTitle || '');
    const listingDescription = sanitize(req.body.listingDescription || '');
    const category = sanitize(req.body.category || '');
    const locationOrRoute = sanitize(req.body.locationOrRoute || '');
    const city = sanitize(req.body.city || '');
    const state = sanitize(req.body.state || '');
    const price = req.body.price === '' || req.body.price == null ? null : Number(req.body.price);
    const capacity = Number(req.body.capacity);
    const priceUnit = sanitize(req.body.priceUnit || '');
    const availability = sanitize(req.body.availability || '');
    const terms = sanitize(req.body.terms || '');

    if (!listingTitle || listingTitle.length > 255) {
      return res.status(400).json({ success: false, field: 'listingTitle', message: 'A listing title of at most 255 characters is required.' });
    }
    if (listingDescription.length > 10000 || availability.length > 5000 || terms.length > 5000) {
      return res.status(400).json({ success: false, message: 'Description, availability, or terms exceed the allowed length.' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, field: 'category', message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.` });
    }
    if (price !== null && (!Number.isFinite(price) || price < 0 || price > 99999999.99)) {
      return res.status(400).json({ success: false, field: 'price', message: 'Price must be a valid non-negative amount.' });
    }
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 1000000) {
      return res.status(400).json({ success: false, field: 'capacity', message: 'Capacity must be a whole number between 1 and 1,000,000.' });
    }
    if (priceUnit && !VALID_PRICE_UNITS.includes(priceUnit)) {
      return res.status(400).json({ success: false, field: 'priceUnit', message: `Price unit must be one of: ${VALID_PRICE_UNITS.join(', ')}.` });
    }

    const [[app]] = await conn.query(
      `SELECT id, status FROM partner_applications WHERE user_id = ?`,
      [req.user.id]
    );
    if (!app) return res.status(404).json({ success: false, message: 'No application found for your account.' });
    if (app.status !== 'Approved') {
      return res.status(403).json({ success: false, message: 'Your partner application must be approved before submitting a service listing.' });
    }

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO partner_service_listings
         (application_id, partner_user_id, listing_title, listing_description, category,
          location_or_route, city, state, price, capacity, price_unit, availability, terms, status, created_by_admin_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', NULL)`,
      [app.id, req.user.id, listingTitle, listingDescription || null, category,
       locationOrRoute || null, city || null, state || null, price,
       capacity, priceUnit || null, availability || null, terms || null]
    );
    const listingId = result.insertId;
    const submissionData = {
      listingTitle, listingDescription, category, locationOrRoute, city, state,
      price, capacity, priceUnit, availability, terms
    };
    await conn.query(
      `INSERT INTO partner_listing_submissions (listing_id, partner_user_id, submission_data)
       VALUES (?, ?, ?)`,
      [listingId, req.user.id, JSON.stringify(submissionData)]
    );
    await writePartnerListingAudit(conn, listingId, req.user.id, 'submit', null, 'Submitted', null, submissionData);
    await conn.commit();

    const [[listing]] = await pool.query('SELECT * FROM partner_service_listings WHERE id = ?', [listingId]);
    return res.status(201).json({ success: true, message: 'Service submitted for administrator review.', listing: formatListing(listing) });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Partner listing submission error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

router.post('/my/:id/change-requests', authenticateToken, requireBusinessPartner, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });
    }
    await conn.beginTransaction();
    const [[listing]] = await conn.query(
      `SELECT psl.*, pa.status AS application_status
       FROM partner_service_listings psl
       JOIN partner_applications pa ON pa.id = psl.application_id
       WHERE psl.id = ? AND psl.partner_user_id = ?
       FOR UPDATE`,
      [id, req.user.id]
    );
    if (!listing) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }
    if (listing.application_status !== 'Approved') {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Your partner application must remain approved to request listing updates.' });
    }
    if (!['Published', 'Unpublished'].includes(listing.status)) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Only approved listings can receive service update requests.' });
    }

    const normalized = normalizePartnerListingChanges(req.body, listing);
    if (normalized.error) {
      await conn.rollback();
      return res.status(400).json({ success: false, ...normalized.error });
    }
    const proposedData = normalized.values;

    const [[pendingRequest]] = await conn.query(
      `SELECT id FROM partner_service_change_requests
       WHERE listing_id = ? AND partner_user_id = ? AND status = 'Pending'
       LIMIT 1 FOR UPDATE`,
      [id, req.user.id]
    );
    if (pendingRequest) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'A service update request is already awaiting administrator review.' });
    }
    const [result] = await conn.query(
      `INSERT INTO partner_service_change_requests (listing_id, partner_user_id, proposed_data)
       VALUES (?, ?, ?)`,
      [id, req.user.id, JSON.stringify(proposedData)]
    );
    await writePartnerListingAudit(
      conn, id, req.user.id, 'service_change_request', listing.status, listing.status, null, proposedData
    );
    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Service update request sent for administrator approval.',
      changeRequest: { id: result.insertId, listingId: id, status: 'Pending', proposedData }
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Partner service change request error:', err);
    return res.status(500).json({ success: false, message: 'Could not submit service update request.' });
  } finally {
    conn.release();
  }
});

// PUT /api/listings/my/:id — correct a listing after administrator feedback
router.put('/my/:id', authenticateToken, requireBusinessPartner, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    const [[existing]] = await conn.query(
      `SELECT * FROM partner_service_listings WHERE id = ? AND partner_user_id = ?`,
      [id, req.user.id]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (existing.status !== 'Changes Requested') {
      return res.status(403).json({ success: false, message: 'Only listings returned for corrections can be edited.' });
    }

    const values = {
      listingTitle: req.body.listingTitle === undefined ? existing.listing_title : sanitize(req.body.listingTitle),
      listingDescription: req.body.listingDescription === undefined ? existing.listing_description : sanitize(req.body.listingDescription),
      category: req.body.category === undefined ? existing.category : sanitize(req.body.category),
      locationOrRoute: req.body.locationOrRoute === undefined ? existing.location_or_route : sanitize(req.body.locationOrRoute),
      city: req.body.city === undefined ? existing.city : sanitize(req.body.city),
      state: req.body.state === undefined ? existing.state : sanitize(req.body.state),
      price: req.body.price === undefined ? (existing.price == null ? null : Number(existing.price)) : (req.body.price === '' || req.body.price == null ? null : Number(req.body.price)),
      capacity: req.body.capacity === undefined ? Number(existing.capacity || 1) : Number(req.body.capacity),
      priceUnit: req.body.priceUnit === undefined ? existing.price_unit : sanitize(req.body.priceUnit),
      availability: req.body.availability === undefined ? existing.availability : sanitize(req.body.availability),
      terms: req.body.terms === undefined ? existing.terms : sanitize(req.body.terms)
    };
    if (!values.listingTitle || values.listingTitle.length > 255 || !VALID_CATEGORIES.includes(values.category)) {
      return res.status(400).json({ success: false, message: 'Provide a valid title and service category.' });
    }
    if (!Number.isSafeInteger(values.capacity) || values.capacity < 1 || values.capacity > 1000000) {
      return res.status(400).json({ success: false, field: 'capacity', message: 'Capacity must be a whole number between 1 and 1,000,000.' });
    }
    if (String(values.listingDescription || '').length > 10000
      || String(values.locationOrRoute || '').length > 255
      || String(values.city || '').length > 100
      || String(values.state || '').length > 100
      || String(values.availability || '').length > 5000
      || String(values.terms || '').length > 5000) {
      return res.status(400).json({ success: false, message: 'One or more listing fields exceed the allowed length.' });
    }
    if (values.price !== null && (!Number.isFinite(values.price) || values.price < 0 || values.price > 99999999.99)) {
      return res.status(400).json({ success: false, field: 'price', message: 'Price must be a valid non-negative amount.' });
    }
    if (values.priceUnit && !VALID_PRICE_UNITS.includes(values.priceUnit)) {
      return res.status(400).json({ success: false, field: 'priceUnit', message: 'Invalid price unit.' });
    }

    const snapshot = {
      listingTitle: values.listingTitle, listingDescription: values.listingDescription || '',
      category: values.category, locationOrRoute: values.locationOrRoute || '',
      city: values.city || '', state: values.state || '', price: values.price, capacity: values.capacity,
      priceUnit: values.priceUnit || '', availability: values.availability || '', terms: values.terms || ''
    };
    await conn.beginTransaction();
    await conn.query(
      `UPDATE partner_service_listings
       SET listing_title = ?, listing_description = ?, category = ?, location_or_route = ?,
           city = ?, state = ?, price = ?, capacity = ?, price_unit = ?, availability = ?, terms = ?, status = 'Submitted'
       WHERE id = ? AND partner_user_id = ?`,
      [values.listingTitle, values.listingDescription || null, values.category,
       values.locationOrRoute || null, values.city || null, values.state || null,
       values.price, values.capacity, values.priceUnit || null, values.availability || null, values.terms || null,
       id, req.user.id]
    );
    await conn.query(
      `INSERT INTO partner_listing_submissions (listing_id, partner_user_id, submission_data)
       VALUES (?, ?, ?)`,
      [id, req.user.id, JSON.stringify(snapshot)]
    );
    await writePartnerListingAudit(conn, id, req.user.id, 'resubmit', 'Changes Requested', 'Submitted', null, snapshot);
    await conn.commit();

    const [[listing]] = await pool.query('SELECT * FROM partner_service_listings WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Corrections submitted for administrator review.', listing: formatListing(listing) });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Partner listing correction error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /api/listings/admin  — list all listings (admin view)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statusFilter = sanitize(req.query.status || 'All');
    const appIdFilter  = req.query.applicationId ? parseInt(req.query.applicationId, 10) : null;
    const categoryFilter = sanitize(req.query.category || '');
    const partnerFilter = sanitize(req.query.partner || '');
    const dateFrom = sanitize(req.query.dateFrom || '');
    const dateTo = sanitize(req.query.dateTo || '');
    const page         = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit        = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset       = (page - 1) * limit;

    const wheres = [];
    const params = [];

    if (statusFilter !== 'All' && !VALID_STATUSES.includes(statusFilter)) {
      return res.status(400).json({ success: false, message: 'Invalid listing status filter.' });
    }
    if (statusFilter !== 'All') {
      wheres.push('psl.status = ?'); params.push(statusFilter);
    }
    if (req.query.applicationId && (!Number.isInteger(appIdFilter) || appIdFilter <= 0)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID filter.' });
    }
    if (appIdFilter) { wheres.push('psl.application_id = ?'); params.push(appIdFilter); }
    if (categoryFilter) { wheres.push('psl.category = ?'); params.push(categoryFilter); }
    if (partnerFilter) { wheres.push('pa.business_name LIKE ?'); params.push(`%${partnerFilter}%`); }
    if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      return res.status(400).json({ success: false, message: 'dateFrom must use YYYY-MM-DD.' });
    }
    if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      return res.status(400).json({ success: false, message: 'dateTo must use YYYY-MM-DD.' });
    }
    if (dateFrom) { wheres.push('DATE(psl.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { wheres.push('DATE(psl.created_at) <= ?'); params.push(dateTo); }

    const whereStr = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM partner_service_listings psl
       JOIN partner_applications pa ON pa.id = psl.application_id
       ${whereStr}`, params
    );

    const [rows] = await pool.query(
      `SELECT psl.*, pa.business_name, pa.category AS app_category,
              (SELECT COUNT(*) FROM listing_images li WHERE li.listing_id = psl.id) AS image_count,
              (SELECT COALESCE(SUM(b.capacity_units), 0) FROM bookings b
               WHERE b.listing_id = psl.id AND b.status IN ('Confirmed', 'Completed')) AS booked_units
       FROM partner_service_listings psl
       LEFT JOIN partner_applications pa ON pa.id = psl.application_id
       ${whereStr}
       ORDER BY psl.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const listings = rows.map(r => ({
      id: r.id, applicationId: r.application_id, businessName: r.business_name,
      listingTitle: r.listing_title, category: r.category, city: r.city, state: r.state,
      price: r.price != null ? parseFloat(r.price) : null, priceUnit: r.price_unit,
      capacity: Number(r.capacity || 1), bookedUnits: Number(r.booked_units || 0),
      status: r.status, imageCount: r.image_count,
      publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at
    }));

    return res.json({ success: true, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, listings });
  } catch (err) {
    console.error('Admin list listings error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

router.get('/admin/change-requests', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.listing_id AS listingId, r.partner_user_id AS partnerUserId,
              r.proposed_data AS proposedData, r.status, r.admin_note AS adminNote,
              r.created_at AS createdAt, r.reviewed_at AS reviewedAt,
              psl.listing_title AS listingTitle, psl.listing_description AS listingDescription,
              psl.category, psl.location_or_route AS locationOrRoute, psl.city, psl.state,
              psl.price, psl.capacity, psl.price_unit AS priceUnit, psl.availability, psl.terms,
              psl.status AS listingStatus,
              pa.business_name AS businessName, pa.email AS partnerEmail
       FROM partner_service_change_requests r
       JOIN partner_service_listings psl ON psl.id = r.listing_id
       JOIN partner_applications pa ON pa.id = psl.application_id
       ORDER BY (r.status = 'Pending') DESC, r.created_at DESC, r.id DESC`
    );
    return res.json({
      success: true,
      changeRequests: rows.map(row => ({
        ...row,
        currentData: {
          listingTitle: row.listingTitle,
          listingDescription: row.listingDescription,
          category: row.category,
          locationOrRoute: row.locationOrRoute,
          city: row.city,
          state: row.state,
          price: row.price == null ? null : Number(row.price),
          capacity: Number(row.capacity || 1),
          bookedUnits:       row.booked_units == null ? null : Number(row.booked_units),
          priceUnit: row.priceUnit,
          availability: row.availability,
          terms: row.terms
        },
        proposedData: parseChangeRequestData(row.proposedData)
      }))
    });
  } catch (err) {
    console.error('Admin service change request list error:', err);
    return res.status(500).json({ success: false, message: 'Could not load service update requests.' });
  }
});

// GET /api/listings/admin/:id  — full listing detail (admin)
router.get('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    const [[row]] = await pool.query(
      `SELECT psl.*, pa.business_name, pa.email AS partner_email,
              pa.category AS app_category, pa.contact_person,
              (SELECT COALESCE(SUM(b.capacity_units), 0) FROM bookings b
               WHERE b.listing_id = psl.id AND b.status IN ('Confirmed', 'Completed')) AS booked_units
       FROM partner_service_listings psl
       LEFT JOIN partner_applications pa ON pa.id = psl.application_id
       WHERE psl.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Listing not found.' });

    const images = await getListingImages(id);

    const [submissionRows] = await pool.query(
      `SELECT submission_data, submitted_at
       FROM partner_listing_submissions
       WHERE listing_id = ?
       ORDER BY submitted_at DESC`,
      [id]
    );
    const [auditRows] = await pool.query(
      `SELECT lal.*, u.full_name AS admin_name
       FROM listing_audit_logs lal
       LEFT JOIN users u ON u.id = lal.actor_user_id
       WHERE lal.listing_id = ?
       ORDER BY lal.created_at DESC
       LIMIT 50`,
      [id]
    );

    return res.json({
      success: true,
      listing: formatListing(row, images),
      submissionHistory: submissionRows.map(submission => ({
        submittedAt: submission.submitted_at,
        data: typeof submission.submission_data === 'string'
          ? JSON.parse(submission.submission_data)
          : submission.submission_data
      })),
      auditLogs: auditRows.map(l => ({
        id: l.id, action: l.action, actorId: l.actor_user_id,
        actorRole: l.actor_role, actorName: l.admin_name,
        previousStatus: l.previous_status, newStatus: l.new_status,
        note: l.note, changedFields: l.changed_fields, createdAt: l.created_at
      }))
    });
  } catch (err) {
    console.error('Admin listing detail error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

router.patch('/admin/change-requests/:id/review', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number.parseInt(req.params.id, 10);
    const action = sanitize(req.body.action || '');
    const note = sanitize(req.body.note || '');
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid change request ID.' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject.' });
    }
    if (action === 'reject' && !note) {
      return res.status(400).json({ success: false, field: 'note', message: 'Provide feedback when rejecting an update request.' });
    }
    if (note.length > 5000) {
      return res.status(400).json({ success: false, field: 'note', message: 'Review notes must be 5,000 characters or fewer.' });
    }

    await conn.beginTransaction();
    const [[request]] = await conn.query(
      `SELECT r.id, r.listing_id, r.partner_user_id, r.proposed_data, r.status,
              psl.status AS listing_status, psl.listing_title, psl.listing_description,
              psl.category, psl.location_or_route, psl.city, psl.state, psl.price, psl.capacity,
              psl.price_unit, psl.availability, psl.terms
       FROM partner_service_change_requests r
       JOIN partner_service_listings psl ON psl.id = r.listing_id
       WHERE r.id = ?
       FOR UPDATE`,
      [id]
    );
    if (!request) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Service update request not found.' });
    }
    if (request.status !== 'Pending') {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'This service update request has already been reviewed.' });
    }
    if (!['Published', 'Unpublished'].includes(request.listing_status)) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'The listing is no longer eligible for a service update request.' });
    }

    const changedFields = parseChangeRequestData(request.proposed_data);
    if (!changedFields || typeof changedFields !== 'object' || Array.isArray(changedFields)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'The proposed listing changes are invalid.' });
    }
    if (action === 'approve') {
      const normalized = normalizePartnerListingChanges(changedFields, request);
      if (normalized.error) {
        await conn.rollback();
        return res.status(400).json({ success: false, ...normalized.error });
      }
      const values = normalized.values;
      await conn.query(
        `UPDATE partner_service_listings
         SET listing_title = ?, listing_description = ?, category = ?, location_or_route = ?,
             city = ?, state = ?, price = ?, capacity = ?, price_unit = ?, availability = ?, terms = ?
         WHERE id = ?`,
        [values.listingTitle, values.listingDescription || null, values.category,
          values.locationOrRoute || null, values.city || null, values.state || null,
          values.price, values.capacity, values.priceUnit || null, values.availability || null,
          values.terms || null, request.listing_id]
      );
    }

    const requestStatus = action === 'approve' ? 'Approved' : 'Rejected';
    await conn.query(
      `UPDATE partner_service_change_requests
       SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ? AND status = 'Pending'`,
      [requestStatus, note || null, req.user.id, id]
    );
    await writeListingAudit(
      conn, request.listing_id, req.user.id,
      action === 'approve' ? 'service_change_approved' : 'service_change_rejected',
      request.listing_status, request.listing_status, note || null,
      action === 'approve' ? changedFields : null
    );
    await conn.commit();

    return res.json({
      success: true,
      message: action === 'approve'
        ? 'Service update approved and applied.'
        : 'Service update rejected; the published listing is unchanged.',
      status: requestStatus
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Admin service change review error:', err);
    return res.status(500).json({ success: false, message: 'Could not review the service update request.' });
  } finally {
    conn.release();
  }
});

// PATCH /api/listings/admin/:id/review — approve, reject, or return a partner submission
router.patch('/admin/:id/review', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number.parseInt(req.params.id, 10);
    const action = sanitize(req.body.action || '');
    const note = sanitize(req.body.note || '');
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });
    }
    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve, reject, or request_changes.' });
    }
    if (['reject', 'request_changes'].includes(action) && !note) {
      return res.status(400).json({ success: false, field: 'note', message: 'Provide a reason for this decision.' });
    }
    if (note.length > 5000) {
      return res.status(400).json({ success: false, field: 'note', message: 'Decision notes must be 5,000 characters or fewer.' });
    }

    const [[listing]] = await conn.query(
      'SELECT id, status FROM partner_service_listings WHERE id = ?',
      [id]
    );
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (listing.status !== 'Submitted') {
      return res.status(409).json({ success: false, message: 'Only submitted listings can be reviewed.' });
    }
    const status = action === 'approve' ? 'Draft' : action === 'reject' ? 'Rejected' : 'Changes Requested';

    await conn.beginTransaction();
    await conn.query(
      'UPDATE partner_service_listings SET status = ?, admin_note = ? WHERE id = ?',
      [status, note || null, id]
    );
    await writeListingAudit(conn, id, req.user.id, action, listing.status, status, note || null, null);
    await conn.commit();

    const [[updated]] = await pool.query('SELECT * FROM partner_service_listings WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: action === 'request_changes' ? 'Corrections requested from the partner.' : `Listing ${status.toLowerCase()}.`,
      listing: formatListing(updated, await getListingImages(id))
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Admin listing review error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// POST /api/listings/admin  — create listing from approved application
router.post('/admin', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const applicationId      = parseInt(req.body.applicationId, 10);
    const listingTitle       = sanitize(req.body.listingTitle || '');
    const listingDescription = sanitize(req.body.listingDescription || '');
    const category           = sanitize(req.body.category || '');
    const locationOrRoute    = sanitize(req.body.locationOrRoute || '');
    const city               = sanitize(req.body.city  || '');
    const state              = sanitize(req.body.state || '');
    const price              = req.body.price != null ? parseFloat(req.body.price) : null;
    const capacity           = Number(req.body.capacity);
    const priceUnit          = sanitize(req.body.priceUnit || '');
    const availability       = sanitize(req.body.availability || '');
    const terms              = sanitize(req.body.terms || '');
    const extraInfo          = req.body.extraInfo || null;

    if (!applicationId || isNaN(applicationId)) {
      return res.status(400).json({ success: false, field: 'applicationId', message: 'Valid applicationId is required.' });
    }
    if (!listingTitle) {
      return res.status(400).json({ success: false, field: 'listingTitle', message: 'Listing title is required.' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, field: 'category', message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.` });
    }
    if (price !== null && (isNaN(price) || price < 0)) {
      return res.status(400).json({ success: false, field: 'price', message: 'Price must be a non-negative number.' });
    }
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 1000000) {
      return res.status(400).json({ success: false, field: 'capacity', message: 'Capacity must be a whole number between 1 and 1,000,000.' });
    }
    if (listingDescription.length > 10000 || locationOrRoute.length > 255 || city.length > 100 || state.length > 100 || availability.length > 5000 || terms.length > 5000) {
      return res.status(400).json({ success: false, message: 'One or more listing fields exceed the allowed length.' });
    }
    if (priceUnit && !VALID_PRICE_UNITS.includes(priceUnit)) {
      return res.status(400).json({ success: false, field: 'priceUnit', message: `Price unit must be one of: ${VALID_PRICE_UNITS.join(', ')}.` });
    }

    // Verify application exists and is Approved
    const [[app]] = await conn.query(
      'SELECT id, status, user_id FROM partner_applications WHERE id = ?', [applicationId]
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (app.status !== 'Approved') {
      return res.status(400).json({ success: false, message: `Application must be Approved before creating a listing (current: ${app.status}).` });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO partner_service_listings
         (application_id, partner_user_id, listing_title, listing_description, category,
          location_or_route, city, state, price, capacity, price_unit, availability, terms,
          extra_info, status, created_by_admin_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)`,
      [applicationId, app.user_id || null, listingTitle, listingDescription || null, category,
       locationOrRoute || null, city || null, state || null,
       price, capacity, priceUnit || null, availability || null, terms || null,
       extraInfo ? JSON.stringify(extraInfo) : null, req.user.id]
    );
    const listingId = result.insertId;

    await writeListingAudit(conn, listingId, req.user.id, 'create', null, 'Draft', null, null);

    await conn.commit();

    const [[newRow]] = await pool.query('SELECT * FROM partner_service_listings WHERE id = ?', [listingId]);
    return res.status(201).json({ success: true, message: 'Listing created as Draft.', listing: formatListing(newRow, []) });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Admin create listing error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// PUT /api/listings/admin/:id  — edit listing
router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    const [[existing]] = await conn.query('SELECT * FROM partner_service_listings WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (existing.status === 'Archived') {
      return res.status(400).json({ success: false, message: 'Archived listings cannot be edited.' });
    }

    const allowedFields = {
      listingTitle:       'listing_title',
      listingDescription: 'listing_description',
      category:           'category',
      locationOrRoute:    'location_or_route',
      city:               'city',
      state:              'state',
      price:              'price',
      capacity:           'capacity',
      priceUnit:          'price_unit',
      availability:       'availability',
      terms:              'terms',
      extraInfo:          'extra_info'
    };

    const setClauses = [];
    const values = [];
    const changedFields = {};

    for (const [jsKey, dbCol] of Object.entries(allowedFields)) {
      if (req.body[jsKey] === undefined) continue;
      let val = req.body[jsKey];

      if (jsKey === 'price') {
        val = val !== null && val !== '' ? Number(val) : null;
        if (val !== null && (!Number.isFinite(val) || val < 0 || val > 99999999.99)) {
          return res.status(400).json({ success: false, field: 'price', message: 'Price must be a non-negative number.' });
        }
      } else if (jsKey === 'capacity') {
        val = Number(val);
        if (!Number.isSafeInteger(val) || val < 1 || val > 1000000) {
          return res.status(400).json({ success: false, field: 'capacity', message: 'Capacity must be a whole number between 1 and 1,000,000.' });
        }
      } else if (jsKey === 'extraInfo') {
        if (val !== null && typeof val !== 'object' && typeof val !== 'string') {
          return res.status(400).json({ success: false, field: 'extraInfo', message: 'Category-specific details must be an object or JSON text.' });
        }
        if (typeof val === 'string' && val.trim()) {
          try {
            val = JSON.parse(val);
          } catch (_) {
            return res.status(400).json({ success: false, field: 'extraInfo', message: 'Category-specific details must be valid JSON.' });
          }
        }
        if (val !== null && typeof val !== 'object') {
          return res.status(400).json({ success: false, field: 'extraInfo', message: 'Category-specific details must be a JSON object.' });
        }
        val = val ? JSON.stringify(val) : null;
      } else {
        val = sanitize(String(val));
        if (jsKey === 'category' && val && !VALID_CATEGORIES.includes(val)) {
          return res.status(400).json({ success: false, field: 'category', message: `Invalid category.` });
        }
        if (jsKey === 'priceUnit' && val && !VALID_PRICE_UNITS.includes(val)) {
          return res.status(400).json({ success: false, field: 'priceUnit', message: `Invalid priceUnit.` });
        }
        const maxLengths = { listingTitle: 255, listingDescription: 10000, category: 100, locationOrRoute: 255, city: 100, state: 100, priceUnit: 50, availability: 5000, terms: 5000 };
        if (maxLengths[jsKey] && val && val.length > maxLengths[jsKey]) {
          return res.status(400).json({ success: false, field: jsKey, message: `${jsKey} exceeds the allowed length.` });
        }
        val = val || null;
      }

      setClauses.push(`${dbCol} = ?`);
      values.push(val);
      changedFields[jsKey] = val;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    await conn.beginTransaction();
    values.push(id);
    await conn.query(`UPDATE partner_service_listings SET ${setClauses.join(', ')} WHERE id = ?`, values);
    await writeListingAudit(conn, id, req.user.id, 'edit', existing.status, existing.status, null, changedFields);
    await conn.commit();

    const [[updated]] = await pool.query('SELECT * FROM partner_service_listings WHERE id = ?', [id]);
    const images = await getListingImages(id);
    return res.json({ success: true, message: 'Listing updated.', listing: formatListing(updated, images) });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Admin edit listing error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// POST /api/listings/admin/:id/images  — upload listing image(s)
router.post('/admin/:id/images', authenticateToken, requireAdmin, (req, res, next) => {
  uploadImages.array('images', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      (req.files || []).forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
      return res.status(400).json({ success: false, message: `Image upload error: ${err.message}` });
    } else if (err) {
      (req.files || []).forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
      return res.status(400).json({ success: false, message: err.message || 'Image upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ success: false, message: 'No image files provided.' });
  }
  if (files.some(file => !hasValidImageSignature(file.path, file.mimetype))) {
    files.forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
    return res.status(400).json({ success: false, message: 'An uploaded file does not match its declared image type.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID.' });
    }

    const [[listing]] = await conn.query('SELECT id, primary_image_id FROM partner_service_listings WHERE id = ?', [id]);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const altText     = sanitize(req.body.altText   || '');
    const caption     = sanitize(req.body.caption   || '');
    const primaryInput = req.body.isPrimary;
    const isPrimary   = primaryInput === 'true' || primaryInput === true || primaryInput === '1';
    const displayOrder = req.body.displayOrder == null || req.body.displayOrder === ''
      ? 0
      : Number(req.body.displayOrder);
    if (altText.length > 255 || caption.length > 255 || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 100000) {
      files.forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
      return res.status(400).json({ success: false, message: 'Invalid image alt text, caption, or display order.' });
    }
    if (primaryInput !== undefined && ![true, false, 'true', 'false', '1', '0', 1, 0].includes(primaryInput)) {
      files.forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
      return res.status(400).json({ success: false, message: 'isPrimary must be a boolean value.' });
    }

    await conn.beginTransaction();

    // If new image is primary, unset previous
    if (isPrimary) {
      await conn.query('UPDATE listing_images SET is_primary = 0 WHERE listing_id = ?', [id]);
    }

    const inserted = [];
    for (const file of files) {
      const setAsPrimary = isPrimary && files.indexOf(file) === 0; // only first file becomes primary
      const [result] = await conn.query(
        `INSERT INTO listing_images
           (listing_id, stored_filename, original_name, file_path, file_size, mime_type,
            alt_text, caption, is_primary, display_order, uploaded_by_admin_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, file.filename, file.originalname, file.path, file.size, file.mimetype,
         altText || null, caption || null, setAsPrimary ? 1 : 0, displayOrder, req.user.id]
      );
      inserted.push(result.insertId);

      if (setAsPrimary) {
        await conn.query('UPDATE partner_service_listings SET primary_image_id = ? WHERE id = ?', [result.insertId, id]);
      }
    }

    await writeListingAudit(conn, id, req.user.id, 'image_add', null, null,
      `Uploaded ${files.length} image(s)`, { imageIds: inserted });

    await conn.commit();

    const [[updatedListing]] = await pool.query('SELECT * FROM partner_service_listings WHERE id = ?', [id]);
    const images = await getListingImages(id);
    return res.status(201).json({ success: true, message: `${files.length} image(s) uploaded.`, listing: formatListing(updatedListing, images) });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    files.forEach(f => { try { fs.unlinkSync(f.path); } catch (_) {} });
    console.error('Admin upload images error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    if (conn) conn.release();
  }
});

// PATCH /api/listings/admin/:id/images/:imgId  — update image metadata
router.patch('/admin/:id/images/:imgId', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id    = parseInt(req.params.id,    10);
    const imgId = parseInt(req.params.imgId, 10);
    if (!id || !imgId) return res.status(400).json({ success: false, message: 'Invalid IDs.' });

    const [[img]] = await conn.query(
      'SELECT * FROM listing_images WHERE id = ? AND listing_id = ?', [imgId, id]
    );
    if (!img) return res.status(404).json({ success: false, message: 'Image not found.' });

    const altText     = req.body.altText     !== undefined ? sanitize(req.body.altText)   : img.alt_text;
    const caption     = req.body.caption     !== undefined ? sanitize(req.body.caption)   : img.caption;
    const primaryInput = req.body.isPrimary;
    const isPrimary   = primaryInput !== undefined
      ? (primaryInput === true || primaryInput === 'true' || primaryInput === 1 || primaryInput === '1')
      : !!img.is_primary;
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : img.display_order;
    if (primaryInput !== undefined && ![true, false, 'true', 'false', 1, 0, '1', '0'].includes(primaryInput)) {
      return res.status(400).json({ success: false, message: 'isPrimary must be a boolean value.' });
    }
    if (altText.length > 255 || caption.length > 255 || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 100000) {
      return res.status(400).json({ success: false, message: 'Invalid image alt text, caption, or display order.' });
    }

    await conn.beginTransaction();
    if (isPrimary) {
      await conn.query('UPDATE listing_images SET is_primary = 0 WHERE listing_id = ?', [id]);
      await conn.query('UPDATE partner_service_listings SET primary_image_id = ? WHERE id = ?', [imgId, id]);
    }
    await conn.query(
      'UPDATE listing_images SET alt_text = ?, caption = ?, is_primary = ?, display_order = ? WHERE id = ?',
      [altText || null, caption || null, isPrimary ? 1 : 0, displayOrder, imgId]
    );
    if (!isPrimary && img.is_primary) {
      const [[nextImg]] = await conn.query(
        'SELECT id FROM listing_images WHERE listing_id = ? AND id <> ? ORDER BY display_order ASC, id ASC LIMIT 1',
        [id, imgId]
      );
      const nextPrimary = nextImg ? nextImg.id : null;
      await conn.query('UPDATE partner_service_listings SET primary_image_id = ? WHERE id = ?', [nextPrimary, id]);
      if (nextPrimary) await conn.query('UPDATE listing_images SET is_primary = 1 WHERE id = ?', [nextPrimary]);
    }
    await writeListingAudit(conn, id, req.user.id, 'image_update', null, null, null, { imgId, isPrimary, altText, caption, displayOrder });
    await conn.commit();

    const images = await getListingImages(id);
    return res.json({ success: true, message: 'Image metadata updated.', images });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Admin update image error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// DELETE /api/listings/admin/:id/images/:imgId  — remove image
router.delete('/admin/:id/images/:imgId', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id    = parseInt(req.params.id,    10);
    const imgId = parseInt(req.params.imgId, 10);
    if (!id || !imgId) return res.status(400).json({ success: false, message: 'Invalid IDs.' });

    const [[img]] = await conn.query(
      'SELECT * FROM listing_images WHERE id = ? AND listing_id = ?', [imgId, id]
    );
    if (!img) return res.status(404).json({ success: false, message: 'Image not found.' });

    await conn.beginTransaction();
    await conn.query('DELETE FROM listing_images WHERE id = ?', [imgId]);

    // If it was the primary image, clear primary_image_id
    const [[listing]] = await conn.query('SELECT primary_image_id FROM partner_service_listings WHERE id = ?', [id]);
    if (listing && listing.primary_image_id === imgId) {
      // Assign the next available image as primary, if any
      const [[nextImg]] = await conn.query(
        'SELECT id FROM listing_images WHERE listing_id = ? ORDER BY display_order ASC, id ASC LIMIT 1', [id]
      );
      const newPrimary = nextImg ? nextImg.id : null;
      await conn.query('UPDATE partner_service_listings SET primary_image_id = ? WHERE id = ?', [newPrimary, id]);
      if (newPrimary) {
        await conn.query('UPDATE listing_images SET is_primary = 1 WHERE id = ?', [newPrimary]);
      }
    }

    await writeListingAudit(conn, id, req.user.id, 'image_remove', null, null,
      `Removed image: ${img.original_name}`, { imgId });

    await conn.commit();

    // Delete physical file
    try { fs.unlinkSync(path.resolve(img.file_path)); } catch (_) {}

    const images = await getListingImages(id);
    return res.json({ success: true, message: 'Image removed.', images });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Admin delete image error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// PATCH /api/listings/admin/:id/publish  — publish listing
router.patch('/admin/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    const [[listing]] = await conn.query(
      `SELECT psl.*, pa.status AS application_status, u.is_active AS partner_active
       FROM partner_service_listings psl
       JOIN partner_applications pa ON pa.id = psl.application_id
       LEFT JOIN users u ON u.id = psl.partner_user_id
       WHERE psl.id = ?`,
      [id]
    );
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (!['Draft', 'Unpublished'].includes(listing.status)) {
      return res.status(400).json({ success: false, message: `Cannot publish a listing with status "${listing.status}".` });
    }
    if (listing.application_status !== 'Approved' || (listing.partner_user_id && !listing.partner_active)) {
      return res.status(403).json({ success: false, message: 'The partner application is not approved or the partner account is inactive.' });
    }

    await conn.beginTransaction();
    await conn.query(
      `UPDATE partner_service_listings
       SET status = 'Published', published_at = NOW(), published_by_admin_id = ?
       WHERE id = ?`,
      [req.user.id, id]
    );
    await writeListingAudit(conn, id, req.user.id, 'publish', listing.status, 'Published', null, null);
    await conn.commit();

    const [[updated]] = await pool.query('SELECT * FROM partner_service_listings WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Listing published successfully.', listing: formatListing(updated, await getListingImages(id)) });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Publish listing error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// PATCH /api/listings/admin/:id/unpublish  — unpublish listing
router.patch('/admin/:id/unpublish', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    const [[listing]] = await conn.query('SELECT * FROM partner_service_listings WHERE id = ?', [id]);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (listing.status !== 'Published') {
      return res.status(400).json({ success: false, message: `Only Published listings can be unpublished (current: ${listing.status}).` });
    }

    await conn.beginTransaction();
    await conn.query('UPDATE partner_service_listings SET status = ? WHERE id = ?', ['Unpublished', id]);
    await writeListingAudit(conn, id, req.user.id, 'unpublish', 'Published', 'Unpublished', null, null);
    await conn.commit();

    const [[updated]] = await pool.query('SELECT * FROM partner_service_listings WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Listing unpublished.', listing: formatListing(updated, await getListingImages(id)) });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Unpublish listing error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// GET /api/listings/admin/:id/audit  — listing audit log (admin)
router.get('/admin/:id/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid listing ID.' });

    const [rows] = await pool.query(
      `SELECT lal.*, u.full_name AS admin_name, u.username AS admin_username
       FROM listing_audit_logs lal
       JOIN users u ON u.id = lal.admin_id
       WHERE lal.listing_id = ?
       ORDER BY lal.created_at DESC
       LIMIT 100`,
      [id]
    );

    return res.json({
      success: true,
      auditLogs: rows.map(l => ({
        id: l.id, action: l.action,
        adminId: l.admin_id, adminName: l.admin_name, adminUsername: l.admin_username,
        previousStatus: l.previous_status, newStatus: l.new_status,
        note: l.note, changedFields: l.changed_fields, createdAt: l.created_at
      }))
    });
  } catch (err) {
    console.error('Listing audit log error:', err);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

module.exports = router;
