const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const partnerEmail = require('../services/partnerEmail');

const router = express.Router();
const REQUIRED_PARTNER_DOCUMENTS = {
  Hotel: ['GST Certificate', 'Hotel/Lodge License', 'Fire Safety Certificate', 'FSSAI License (if applicable)'],
  'Bus Operator': ['Vehicle Registration Certificate', 'Route Permit', 'Vehicle Fitness Certificate', 'Insurance Certificate'],
  'Tour & Travel': ['GST Certificate', 'IATA/TAAI License (if applicable)', 'Company Registration Certificate'],
  Restaurant: ['FSSAI License', 'GST Certificate', 'Fire Safety Certificate'],
  Adventure: ['Safety Certification', 'Insurance Certificate', 'Business Registration'],
  Other: ['GST Certificate', 'Business Registration Certificate']
};

// ==========================================
// Upload directory setup
// ==========================================
const UPLOAD_DIR = path.resolve(__dirname, '..', process.env.PARTNER_DOCUMENT_DIR || path.join('uploads', 'partner-docs'));
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function hasPdfSignature(filePath) {
  const header = Buffer.alloc(1024);
  const descriptor = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(descriptor, header, 0, header.length, 0);
    return header.subarray(0, bytesRead).includes(Buffer.from('%PDF-'));
  } finally {
    fs.closeSync(descriptor);
  }
}

function resolvePrivateDocument(filePath) {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(`${UPLOAD_DIR}${path.sep}`) ? resolved : null;
}

// ==========================================
// Multer configuration
// ==========================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

router.get('/my-documents/:docId', authenticateToken, requireBusinessPartner, async (req, res) => {
  try {
    const docId = Number.parseInt(req.params.docId, 10);
    if (!Number.isSafeInteger(docId) || docId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid document ID.' });
    }
    const [[doc]] = await pool.query(
      `SELECT pd.file_path, pd.original_name, pd.mime_type
       FROM partner_documents pd
       JOIN partner_applications pa ON pa.id = pd.application_id
       WHERE pd.id = ? AND pa.user_id = ?`,
      [docId, req.user.id]
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    const absolutePath = resolvePrivateDocument(doc.file_path);
    if (!absolutePath || doc.mime_type !== 'application/pdf' || !fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(doc.original_name).replace(/["\r\n]/g, '')}"`);
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error('Partner document access error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

function fileFilter(req, file, cb) {
  const allowedMime = 'application/pdf';
  const allowedExt = '.pdf';
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === allowedMime && ext === allowedExt) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are allowed.'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5
  }
});

// ==========================================
// Helpers
// ==========================================
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateTemporaryPassword(length = 8) {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const specialChars = '!@#$%^&*';

  // Guarantee at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character
  const characters = [
    uppercase[crypto.randomInt(uppercase.length)],
    lowercase[crypto.randomInt(lowercase.length)],
    numbers[crypto.randomInt(numbers.length)],
    specialChars[crypto.randomInt(specialChars.length)]
  ];

  const alphabet = uppercase + lowercase + numbers + specialChars;
  const targetLength = Math.max(8, length);
  while (characters.length < targetLength) {
    characters.push(alphabet[crypto.randomInt(alphabet.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join('');
}

// Middleware: require Business Partner role
function requireBusinessPartner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if ((req.user.role || '').toLowerCase() !== 'business partner') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Business Partner role required.'
    });
  }
  next();
}

// ==========================================
// 1. POST /api/partner/apply  (public, multipart/form-data)
// ==========================================
router.post('/apply', (req, res, next) => {
  upload.array('documents', 5)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      (req.files || []).forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
      return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    } else if (err) {
      (req.files || []).forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
      return res.status(400).json({ success: false, message: err.message || 'File upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  const uploadedFiles = req.files || [];
  if (uploadedFiles.some(file => !hasPdfSignature(file.path))) {
    uploadedFiles.forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
    return res.status(400).json({ success: false, message: 'An uploaded document is not a valid PDF file.' });
  }
  let conn;
  let keepUploadedFiles = false;
  try {
    conn = await pool.getConnection();
    // --- Extract & sanitize fields ---
    const businessName    = sanitize(req.body.businessName);
    const submittedCategory = sanitize(req.body.category);
    const categoryAliases = {
      hotel: 'Hotel',
      bus: 'Bus Operator',
      travel: 'Tour & Travel',
      restaurant: 'Restaurant',
      adventure: 'Adventure',
      other: 'Other'
    };
    const category = categoryAliases[submittedCategory.toLowerCase()] || submittedCategory;
    const contactPerson   = sanitize(req.body.contactPerson);
    const email           = sanitize(req.body.email).toLowerCase();
    const phone           = sanitize(req.body.phone);
    const address         = sanitize(req.body.address);
    const city            = sanitize(req.body.city);
    const state           = sanitize(req.body.state);
    const pincode         = sanitize(req.body.pincode);
    const businessDetails = sanitize(req.body.businessDetails || '');
    const gstNumber       = sanitize(req.body.gstNumber || '');
    const privacyConsent  = req.body.privacyConsent === true
                         || req.body.privacyConsent === 'true'
                         || req.body.privacyConsent === '1';

    // --- Validations ---
    if (!businessName) {
      return res.status(400).json({ success: false, field: 'businessName', message: 'Business name is required.' });
    }

    const validCategories = ['Hotel', 'Bus Operator', 'Tour & Travel', 'Restaurant', 'Adventure', 'Other'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        field: 'category',
        message: `Category must be one of: ${validCategories.join(', ')}.`
      });
    }
    const requestedDocumentTypes = req.body.documentTypes;
    const documentTypes = Array.isArray(requestedDocumentTypes)
      ? requestedDocumentTypes.map(sanitize)
      : requestedDocumentTypes ? [sanitize(requestedDocumentTypes)] : [];
    const requiredDocuments = REQUIRED_PARTNER_DOCUMENTS[category] || [];
    if (documentTypes.length !== uploadedFiles.length
      || new Set(documentTypes).size !== requiredDocuments.length
      || requiredDocuments.some(documentType => !documentTypes.includes(documentType))) {
      return res.status(400).json({
        success: false,
        field: 'documents',
        message: `Upload each required document for ${category}.`
      });
    }

    if (!contactPerson) {
      return res.status(400).json({ success: false, field: 'contactPerson', message: 'Contact person name is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, field: 'email', message: 'A valid email address is required.' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, field: 'phone', message: 'Phone number is required.' });
    }
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return res.status(400).json({
        success: false,
        field: 'phone',
        message: 'Phone number must be between 10 and 15 digits.'
      });
    }

    if (!address) {
      return res.status(400).json({ success: false, field: 'address', message: 'Address is required.' });
    }
    if (!city) {
      return res.status(400).json({ success: false, field: 'city', message: 'City is required.' });
    }
    if (!state) {
      return res.status(400).json({ success: false, field: 'state', message: 'State is required.' });
    }
    if (!pincode) {
      return res.status(400).json({ success: false, field: 'pincode', message: 'Pincode is required.' });
    }

    if (!privacyConsent) {
      return res.status(400).json({
        success: false,
        field: 'privacyConsent',
        message: 'You must accept the Privacy Policy and Terms of Service to proceed.'
      });
    }

    // --- Email uniqueness check ---
    const [existing] = await conn.query(
      'SELECT id FROM partner_applications WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        field: 'email',
        message: 'An application with this email address already exists.'
      });
    }

    // --- Insert application ---
    await conn.beginTransaction();

    const [appResult] = await conn.query(
      `INSERT INTO partner_applications
         (business_name, category, contact_person, email, phone, address, city, state, pincode,
          business_details, gst_number, status, privacy_consent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [
        businessName, category, contactPerson, email, phone, address, city, state, pincode,
        businessDetails || null,
        gstNumber || null,
        privacyConsent ? 1 : 0
      ]
    );
    const applicationId = appResult.insertId;
    try {
      await conn.query('UPDATE partner_applications SET application_id = ? WHERE id = ?', [String(applicationId), applicationId]);
    } catch (_) {}

    // --- Insert documents ---
    for (const [index, file] of uploadedFiles.entries()) {
      await conn.query(
        `INSERT INTO partner_documents
           (application_id, document_type, original_name, stored_filename, file_path, file_size, mime_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          applicationId,
          documentTypes[index],
          file.originalname,
          file.filename,
          file.path,
          file.size,
          file.mimetype
        ]
      );
    }

    await conn.commit();
    keepUploadedFiles = true;

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully. You can check its status using your application ID and email.',
      applicationId
    });
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Partner apply error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred. Please try again.' });
  } finally {
    if (!keepUploadedFiles) {
      uploadedFiles.forEach(file => { try { fs.unlinkSync(file.path); } catch (_) {} });
    }
    if (conn) conn.release();
  }
});

// ==========================================
// 2. GET /api/partner/status?applicationId=ID&email=EMAIL  (public)
// ==========================================
router.get('/status', async (req, res) => {
  try {
    const applicationId = sanitize(req.query.applicationId || '');
    const email = sanitize(req.query.email || '').toLowerCase();

    if (!applicationId && !email) {
      return res.status(400).json({ success: false, field: 'applicationId', message: 'Application ID is required.' });
    }
    if (applicationId && !email) {
      return res.status(400).json({ success: false, field: 'email', message: 'A valid email address is required.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, field: 'email', message: 'A valid email address is required.' });
    }

    let rows = [];
    if (applicationId && email) {
      const [matched] = await pool.query(
        `SELECT id, application_id, business_name, category, contact_person, email, city, state,
                status, admin_note, user_id, created_at, updated_at
         FROM partner_applications
         WHERE (CAST(id AS CHAR) = ? OR application_id = ?) AND LOWER(email) = ?
         LIMIT 1`,
        [applicationId, applicationId, email]
      );
      rows = matched;
      if (!rows.length) {
        const [fallback] = await pool.query(
          `SELECT id, application_id, business_name, category, contact_person, email, city, state,
                  status, admin_note, user_id, created_at, updated_at
           FROM partner_applications
           WHERE LOWER(email) = ? OR (CAST(id AS CHAR) = ? OR application_id = ?)
           ORDER BY (status = 'Approved') DESC, id DESC
           LIMIT 1`,
          [email, applicationId, applicationId]
        );
        if (fallback.length && fallback[0].status === 'Approved') {
          rows = fallback;
        }
      }
    } else if (email) {
      const [emailOnly] = await pool.query(
        `SELECT id, application_id, business_name, category, contact_person, email, city, state,
                status, admin_note, user_id, created_at, updated_at
         FROM partner_applications
         WHERE LOWER(email) = ?
         ORDER BY (status = 'Approved') DESC, id DESC
         LIMIT 1`,
        [email]
      );
      rows = emailOnly;
    }
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found. Check the application ID and email address.' });
    }

    const app = rows[0];
    const status = String(app.status || 'Pending').toLowerCase().replace(/\s+/g, '_');
    const [setupEvents] = await pool.query(
      `SELECT event_type
       FROM partner_account_setup_events
       WHERE application_id = ?
         AND event_type IN ('account_setup_email_sent', 'account_setup_email_failed')
       ORDER BY id DESC
       LIMIT 1`,
      [app.id]
    );
    const [temporaryPasswordEvents] = await pool.query(
      `SELECT event_type
       FROM partner_account_setup_events
       WHERE application_id = ?
         AND event_type IN ('temporary_password_email_sent', 'temporary_password_email_failed')
       ORDER BY id DESC
       LIMIT 1`,
      [app.id]
    );
    let temporaryPasswordStatus = 'unknown';
    if (app.user_id) {
      const [users] = await pool.query(
        'SELECT must_change_password FROM users WHERE id = ? LIMIT 1',
        [app.user_id]
      );
      temporaryPasswordStatus = users[0]?.must_change_password
        ? (temporaryPasswordEvents[0]?.event_type === 'temporary_password_email_sent'
          ? 'sent'
          : temporaryPasswordEvents[0]?.event_type === 'temporary_password_email_failed'
            ? 'failed'
            : 'pending')
        : 'account_created';
    } else if (temporaryPasswordEvents[0]?.event_type === 'temporary_password_email_sent') {
      temporaryPasswordStatus = 'sent';
    } else if (temporaryPasswordEvents[0]?.event_type === 'temporary_password_email_failed') {
      temporaryPasswordStatus = 'failed';
    }
    const setupEmailStatus = app.user_id && temporaryPasswordStatus === 'account_created'
      ? 'account_created'
      : setupEvents[0]?.event_type === 'account_setup_email_sent'
        ? 'sent'
        : setupEvents[0]?.event_type === 'account_setup_email_failed'
          ? 'failed'
          : 'unknown';
    const application = {
      applicationId: app.application_id || String(app.id),
      businessName: app.business_name,
      category: app.category,
      contactPerson: app.contact_person,
      email: app.email,
      city: app.city,
      state: app.state,
      status,
      setupEmailStatus,
      temporaryPasswordStatus,
      createdAt: app.created_at,
      updatedAt: app.updated_at
    };
    if (['rejected', 'changes_requested'].includes(status) && app.admin_note) {
      application.adminNotes = app.admin_note;
    }

    return res.json({ success: true, application });
  } catch (error) {
    console.error('Partner status lookup error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// ==========================================
// 4. POST /api/partner/check-status  (public)
// ==========================================
router.post('/check-status', async (req, res) => {
  try {
    const applicationId = sanitize(req.body.applicationId || '');
    const email = sanitize(req.body.email || '').toLowerCase();

    if (!applicationId) {
      return res.status(400).json({ success: false, field: 'applicationId', message: 'Application ID is required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, field: 'email', message: 'Please provide a valid email address.' });
    }

    const [rows] = await pool.query(
      `SELECT id, business_name, status, admin_note, created_at, email
       FROM partner_applications
       WHERE (CAST(id AS CHAR) = ? OR application_id = ?) AND LOWER(email) = ?
       LIMIT 1`,
      [applicationId, applicationId, email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No application found for this email address.' });
    }

    const app = rows[0];
    const responseData = {
      businessName: app.business_name,
      status: app.status,
      email: app.email,
      submittedAt: app.created_at
    };

    // Include admin note only when rejected
    if (app.status === 'Rejected') {
      responseData.adminNote = app.admin_note || null;
    }

    return res.json({ success: true, application: responseData });
  } catch (error) {
    console.error('Check status error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

router.post('/status/request-account-setup', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const rawApplicationId = req.body.applicationId;
    const applicationReference = typeof rawApplicationId === 'number' && Number.isSafeInteger(rawApplicationId)
      ? String(rawApplicationId)
      : sanitize(rawApplicationId || '');
    const email = sanitize(req.body.email || '').toLowerCase();
    if (!applicationReference || applicationReference.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid application ID and email are required.' });
    }

    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, application_id, business_name, email, status, user_id
       FROM partner_applications
       WHERE (CAST(id AS CHAR) = ? OR application_id = ?) AND LOWER(email) = ?
       LIMIT 1 FOR UPDATE`,
      [applicationReference, applicationReference, email]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Application not found. Check the application ID and email address.' });
    }
    const application = rows[0];
    if (application.status !== 'Approved' || application.user_id) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Password setup is available only for approved applications without an account.' });
    }

    const [recentRequests] = await conn.query(
      `SELECT created_at
       FROM partner_account_setup_events
       WHERE application_id = ? AND actor_role = 'Partner'
         AND event_type = 'account_setup_link_requested'
       ORDER BY id DESC
       LIMIT 1`,
      [application.id]
    );
    if (recentRequests.length && Date.now() - new Date(recentRequests[0].created_at).getTime() < 60_000) {
      await conn.rollback();
      return res.status(429).json({
        success: false,
        message: 'A setup link was requested recently. Please wait one minute before requesting another.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await conn.query(
      `UPDATE partner_applications
       SET account_setup_token_hash = ?, account_setup_token_expires_at = ?,
           account_setup_token_used_at = NULL
       WHERE id = ? AND status = 'Approved' AND user_id IS NULL`,
      [hashToken(token), new Date(Date.now() + 24 * 60 * 60 * 1000), application.id]
    );
    await conn.query(
      `INSERT INTO partner_account_setup_events (application_id, actor_user_id, actor_role, event_type)
       VALUES (?, NULL, 'Partner', 'account_setup_link_requested')`,
      [application.id]
    );
    await conn.commit();

    try {
      await partnerEmail.sendPartnerAccountSetupEmail(application.email, application.business_name, token);
    } catch (emailError) {
      console.error('Partner-requested account setup email failed:', emailError.message);
      await pool.query(
        `UPDATE partner_applications
         SET account_setup_token_hash = NULL, account_setup_token_expires_at = NULL
         WHERE id = ? AND account_setup_token_hash = ?`,
        [application.id, hashToken(token)]
      );
      await pool.query(
        `INSERT INTO partner_account_setup_events (application_id, actor_user_id, actor_role, event_type)
         VALUES (?, NULL, 'Partner', 'account_setup_email_failed')`,
        [application.id]
      );
      return res.status(503).json({
        success: false,
        message: 'Could not send the password setup link. Please contact the administrator to check email delivery.'
      });
    }

    await pool.query(
      `INSERT INTO partner_account_setup_events (application_id, actor_user_id, actor_role, event_type)
       VALUES (?, NULL, 'Partner', 'account_setup_email_sent')`,
      [application.id]
    );
    return res.json({
      success: true,
      message: 'A one-time password setup link has been sent to the registered email address. Check your inbox and spam folder.'
    });
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Partner requested account setup link failed:', error);
    return res.status(500).json({ success: false, message: 'Could not request a password setup link.' });
  } finally {
    conn.release();
  }
});

router.post('/status/request-temporary-password', async (req, res) => {
  const conn = await pool.getConnection();
  let application;
  let temporaryPassword;
  let passwordHash;
  let previousUserState = null;
  let createdUserId = null;
  try {
    const rawApplicationId = req.body?.applicationId
      ?? req.body?.application_id
      ?? req.query?.applicationId
      ?? req.query?.application_id;
    const applicationReference = typeof rawApplicationId === 'number' && Number.isSafeInteger(rawApplicationId)
      ? String(rawApplicationId)
      : sanitize(rawApplicationId || '');
    const email = sanitize(req.body?.email ?? req.query?.email ?? '').toLowerCase();

    // Allow lookup by applicationId, email, or both
    if (!applicationReference && !email) {
      return res.status(400).json({ success: false, field: 'applicationId', message: 'A valid application ID or email is required.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !applicationReference) {
      return res.status(400).json({ success: false, field: 'email', message: 'A valid email address is required.' });
    }

    await conn.beginTransaction();
    let applications = [];
    if (applicationReference && email) {
      const [matched] = await conn.query(
        `SELECT id, application_id, business_name, contact_person, email, phone, status, user_id
         FROM partner_applications
         WHERE (CAST(id AS CHAR) = ? OR application_id = ?) AND LOWER(email) = ?
         LIMIT 1 FOR UPDATE`,
        [applicationReference, applicationReference, email]
      );
      applications = matched;
      if (!applications.length) {
        // Fallback: if user only knows email or ID, find the approved application
        const [fallback] = await conn.query(
          `SELECT id, application_id, business_name, contact_person, email, phone, status, user_id
           FROM partner_applications
           WHERE LOWER(email) = ? OR (CAST(id AS CHAR) = ? OR application_id = ?)
           ORDER BY (status = 'Approved') DESC, id DESC
           LIMIT 1 FOR UPDATE`,
          [email, applicationReference, applicationReference]
        );
        if (fallback.length && fallback[0].status === 'Approved') {
          applications = fallback;
        }
      }
    } else if (applicationReference) {
      const [byId] = await conn.query(
        `SELECT id, application_id, business_name, contact_person, email, phone, status, user_id
         FROM partner_applications
         WHERE (CAST(id AS CHAR) = ? OR application_id = ?)
         ORDER BY (status = 'Approved') DESC, id DESC
         LIMIT 1 FOR UPDATE`,
        [applicationReference, applicationReference]
      );
      applications = byId;
    } else {
      const [byEmail] = await conn.query(
        `SELECT id, application_id, business_name, contact_person, email, phone, status, user_id
         FROM partner_applications
         WHERE LOWER(email) = ?
         ORDER BY (status = 'Approved') DESC, id DESC
         LIMIT 1 FOR UPDATE`,
        [email]
      );
      applications = byEmail;
    }

    if (!applications.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Application not found. Check the application ID and email address.' });
    }
    application = applications[0];
    if (application.status !== 'Approved') {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'A temporary password is available only for approved applications.' });
    }

    const [recentRequests] = await conn.query(
      `SELECT created_at
       FROM partner_account_setup_events
       WHERE application_id = ? AND actor_role = 'Partner'
         AND event_type = 'temporary_password_requested'
       ORDER BY id DESC
       LIMIT 1`,
      [application.id]
    );
    if (recentRequests.length && Date.now() - new Date(recentRequests[0].created_at).getTime() < 60_000) {
      await conn.rollback();
      return res.status(429).json({
        success: false,
        message: 'A temporary password was requested recently. Please wait one minute before trying again.'
      });
    }

    if (application.user_id) {
      const [users] = await conn.query(
        `SELECT id, role, is_active, must_change_password, password_hash, temporary_password_expires_at,
                failed_attempts, lock_until
         FROM users WHERE id = ? LIMIT 1 FOR UPDATE`,
        [application.user_id]
      );
      if (users.length) {
        if (users[0].is_active === 0 || users[0].is_active === false) {
          await conn.rollback();
          return res.status(403).json({ success: false, message: 'This partner account is deactivated. Contact the administrator.' });
        }
        previousUserState = users[0];
      }
    }

    temporaryPassword = generateTemporaryPassword();
    passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (previousUserState) {
      const [updateResult] = await conn.query(
        `UPDATE users
         SET role = 'Business Partner', password_hash = ?, temporary_password_expires_at = ?, must_change_password = 1, failed_attempts = 0, lock_until = NULL
         WHERE id = ?`,
        [passwordHash, expiresAt, previousUserState.id]
      );
      if (!updateResult.affectedRows) {
        await conn.rollback();
        return res.status(409).json({ success: false, message: 'The temporary password could not be refreshed. Please check application status again.' });
      }
      createdUserId = previousUserState.id;
    } else {
      const username = `partner_${application.id}`;
      const [existingUsers] = await conn.query(
        'SELECT id FROM users WHERE LOWER(email) = ? OR username = ? LIMIT 1 FOR UPDATE',
        [application.email.toLowerCase(), username]
      );
      if (existingUsers.length) {
        const existing = existingUsers[0];
        const existingRole = (existing.role || '').toLowerCase();
        if (existingRole === 'admin' || existingRole === 'super admin') {
          await conn.rollback();
          return res.status(409).json({
            success: false,
            message: 'This email belongs to an Administrator account. Please use a different email or contact support.'
          });
        }
        if (existing.is_active === 0 || existing.is_active === false) {
          await conn.rollback();
          return res.status(403).json({ success: false, message: 'This account is deactivated. Contact the administrator.' });
        }

        // Seamlessly link existing user and upgrade role to Business Partner
        await conn.query(
          `UPDATE users
           SET role = 'Business Partner', password_hash = ?, temporary_password_expires_at = ?, must_change_password = 1, failed_attempts = 0, lock_until = NULL
           WHERE id = ?`,
          [passwordHash, expiresAt, existing.id]
        );
        createdUserId = existing.id;
        await conn.query(
          `UPDATE partner_applications SET user_id = ? WHERE id = ?`,
          [createdUserId, application.id]
        );
      } else {
        const [userResult] = await conn.query(
          `INSERT INTO users
             (full_name, username, email, phone, password_hash, role, is_active, failed_attempts,
              must_change_password, temporary_password_expires_at)
           VALUES (?, ?, ?, ?, ?, 'Business Partner', 1, 0, 1, ?)`,
          [application.contact_person || application.business_name, username, application.email, application.phone, passwordHash, expiresAt]
        );
        createdUserId = userResult.insertId;
        const [applicationUpdate] = await conn.query(
          `UPDATE partner_applications SET user_id = ? WHERE id = ? AND status = 'Approved' AND user_id IS NULL`,
          [createdUserId, application.id]
        );
        if (!applicationUpdate.affectedRows) {
          await conn.rollback();
          return res.status(409).json({ success: false, message: 'The application account could not be linked. Please check application status again.' });
        }
      }
    }
    await conn.query(
      `INSERT INTO partner_account_setup_events (application_id, actor_user_id, actor_role, event_type)
       VALUES (?, NULL, 'Partner', 'temporary_password_requested')`,
      [application.id]
    );
    await conn.commit();

    // Best-effort email delivery: do not fail or roll back if email is not configured or fails
    try {
      if (partnerEmail && typeof partnerEmail.sendPartnerTemporaryPasswordEmail === 'function') {
        await partnerEmail.sendPartnerTemporaryPasswordEmail(application.email, application.business_name, temporaryPassword);
        await pool.query(
          `INSERT INTO partner_account_setup_events (application_id, actor_user_id, actor_role, event_type)
           VALUES (?, NULL, 'Partner', 'temporary_password_email_sent')`,
          [application.id]
        );
      }
    } catch (emailError) {
      console.warn('Partner temporary password email skipped or failed:', emailError.message);
      try {
        await pool.query(
          `INSERT INTO partner_account_setup_events (application_id, actor_user_id, actor_role, event_type)
           VALUES (?, NULL, 'Partner', 'temporary_password_email_failed')`,
          [application.id]
        );
      } catch (_) {}
    }

    await pool.query(
      `UPDATE partner_applications
       SET account_setup_token_hash = NULL, account_setup_token_expires_at = NULL,
           account_setup_token_used_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [application.id, createdUserId]
    );

    return res.json({
      success: true,
      message: 'Temporary password generated successfully. It expires in 24 hours and must be changed at first sign-in.',
      temporaryPassword
    });
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Partner temporary password request failed:', error);
    return res.status(500).json({ success: false, message: 'Could not request a temporary password.' });
  } finally {
    conn.release();
  }
});

router.get('/account-setup', async (req, res) => {
  try {
    const token = sanitize(req.query.token || '');
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ success: false, message: 'A valid account setup link is required.' });
    }
    const [rows] = await pool.query(
      `SELECT business_name
       FROM partner_applications
       WHERE account_setup_token_hash = ? AND account_setup_token_expires_at > NOW()
         AND status = 'Approved' AND user_id IS NULL
       LIMIT 1`,
      [hashToken(token)]
    );
    if (rows.length === 0) {
      return res.status(410).json({ success: false, message: 'This account setup link is invalid, expired, or already used. Contact the administrator for a new link.' });
    }
    return res.json({ success: true, businessName: rows[0].business_name });
  } catch (error) {
    console.error('Partner account setup validation failed:', error);
    return res.status(500).json({ success: false, message: 'Could not validate the account setup link.' });
  }
});

router.post('/complete-account-setup', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const token = sanitize(req.body.token || '');
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ success: false, field: 'token', message: 'A valid account setup link is required.' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, field: 'password', message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (!@#$%^&*).' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, field: 'confirmPassword', message: 'Passwords do not match.' });
    }

    await conn.beginTransaction();
    const [appRows] = await conn.query(
      `SELECT id, business_name, contact_person, email, phone, status, user_id
       FROM partner_applications
       WHERE account_setup_token_hash = ? AND account_setup_token_expires_at > NOW()
        AND status = 'Approved' AND user_id IS NULL
       LIMIT 1 FOR UPDATE`,
      [hashToken(token)]
    );
    if (appRows.length === 0) {
      await conn.rollback();
      return res.status(410).json({ success: false, message: 'This account setup link is invalid, expired, or already used. Contact the administrator for a new link.' });
    }
    const application = appRows[0];
    const username = `partner_${application.id}`;
    const [existingUsers] = await conn.query(
      'SELECT id FROM users WHERE LOWER(email) = ? OR username = ? LIMIT 1',
      [application.email.toLowerCase(), username]
    );
    if (existingUsers.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'An account already exists for this application. Please sign in or contact support.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      `INSERT INTO users (full_name, username, email, phone, password_hash, role, is_active, failed_attempts)
       VALUES (?, ?, ?, ?, ?, 'Business Partner', 1, 0)`,
      [application.contact_person || application.business_name, username, application.email, application.phone, passwordHash]
    );
    await conn.query(
      `UPDATE partner_applications
       SET user_id = ?, account_setup_token_hash = NULL, account_setup_token_expires_at = NULL,
           account_setup_token_used_at = NOW()
       WHERE id = ? AND user_id IS NULL AND account_setup_token_hash = ?`,
      [userResult.insertId, application.id, hashToken(token)]
    );
    await conn.query(
      `INSERT INTO partner_account_setup_events (application_id, actor_user_id, actor_role, event_type)
       VALUES (?, ?, 'Business Partner', 'account_setup_completed')`,
      [application.id, userResult.insertId]
    );
    await conn.commit();
    return res.status(201).json({ success: true, message: 'Password created. You can now sign in using your registered email and password.' });
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Partner account setup failed:', error);
    return res.status(500).json({ success: false, message: 'Could not complete account setup.' });
  } finally {
    conn.release();
  }
});

// ==========================================
// 5. GET /api/partner/my-application  (authenticateToken, Business Partner)
// ==========================================
router.get('/my-application', authenticateToken, requireBusinessPartner, async (req, res) => {
  try {
    const [appRows] = await pool.query(
      `SELECT id, business_name, category, contact_person, email, phone, address, city, state,
             pincode, business_details, gst_number, status, admin_note,
              privacy_consent, created_at, updated_at
       FROM partner_applications
       WHERE user_id = ?`,
      [req.user.id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'No application found for your account.' });
    }

    const app = appRows[0];

    // Fetch documents (no file_path)
    const [docs] = await pool.query(
      `SELECT id, document_type, original_name, file_size, mime_type, created_at
       FROM partner_documents
       WHERE application_id = ?
       ORDER BY created_at ASC`,
      [app.id]
    );

    return res.json({
      success: true,
      application: {
        id: app.id,
        businessName: app.business_name,
        category: app.category,
        contactPerson: app.contact_person,
        email: app.email,
        phone: app.phone,
        address: app.address,
        city: app.city,
        state: app.state,
        pincode: app.pincode,
        businessDetails: app.business_details,
        gstNumber: app.gst_number,
        status: app.status,
        adminNote: app.admin_note,
        privacyConsent: !!app.privacy_consent,
        createdAt: app.created_at,
        updatedAt: app.updated_at
      },
      documents: docs.map(d => ({
        id: d.id,
        documentType: d.document_type,
        originalName: d.original_name,
        fileSize: d.file_size,
        mimeType: d.mime_type,
        createdAt: d.created_at,
        documentUrl: `/api/partner/my-documents/${d.id}`
      }))
    });
  } catch (error) {
    console.error('My application error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// ==========================================
// 6. PATCH /api/partner/my-application  (authenticateToken, Business Partner)
// ==========================================
router.patch('/my-application', authenticateToken, requireBusinessPartner, async (req, res) => {
  try {
    // Fetch current application
    const [appRows] = await pool.query(
      'SELECT id, status FROM partner_applications WHERE user_id = ?',
      [req.user.id]
    );

    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'No application found for your account.' });
    }

    const app = appRows[0];

    if (app.status === 'Approved') {
      return res.status(403).json({
        success: false,
        message: 'Approved application details cannot be modified. Please contact support.'
      });
    }

    // Only allow these fields to be updated
    const allowedFields = ['phone', 'address', 'city', 'state', 'pincode', 'businessDetails', 'gstNumber'];
    const fieldMap = {
      phone: 'phone',
      address: 'address',
      city: 'city',
      state: 'state',
      pincode: 'pincode',
      businessDetails: 'business_details',
      gstNumber: 'gst_number'
    };

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const sanitized = sanitize(String(req.body[field]));
        setClauses.push(`${fieldMap[field]} = ?`);
        values.push(sanitized || null);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    // Phone validation if provided
    if (req.body.phone !== undefined) {
      const phoneDigits = sanitize(String(req.body.phone)).replace(/[^0-9]/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return res.status(400).json({
          success: false,
          field: 'phone',
          message: 'Phone number must be between 10 and 15 digits.'
        });
      }
    }

    values.push(app.id);
    await pool.query(
      `UPDATE partner_applications SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    // Return updated application
    const [updatedRows] = await pool.query(
      `SELECT id, business_name, category, contact_person, email, phone, address, city, state,
             pincode, business_details, gst_number, status, admin_note,
              privacy_consent, created_at, updated_at
       FROM partner_applications WHERE id = ?`,
      [app.id]
    );
    const updated = updatedRows[0];

    return res.json({
      success: true,
      message: 'Application updated successfully.',
      application: {
        id: updated.id,
        businessName: updated.business_name,
        category: updated.category,
        contactPerson: updated.contact_person,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        pincode: updated.pincode,
        businessDetails: updated.business_details,
        gstNumber: updated.gst_number,
        status: updated.status,
        adminNote: updated.admin_note,
        privacyConsent: !!updated.privacy_consent,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (error) {
    console.error('Update my application error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// ==========================================
// 7. GET /api/partner/admin/applications  (authenticateToken, requireAdmin)
// ==========================================
router.get('/admin/applications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statusFilter = sanitize(req.query.status || 'All');
    const categoryFilter = sanitize(req.query.category || '');
    const partnerFilter = sanitize(req.query.partner || '');
    const dateFrom = sanitize(req.query.dateFrom || '');
    const dateTo = sanitize(req.query.dateTo || '');
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const validStatuses = ['Pending', 'Approved', 'Rejected', 'All'];
    if (!validStatuses.includes(statusFilter)) {
      return res.status(400).json({ success: false, message: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}.` });
    }

    const conditions = [];
    const queryParams = [];
    if (statusFilter !== 'All') {
      conditions.push('pa.status = ?');
      queryParams.push(statusFilter);
    }
    if (categoryFilter) { conditions.push('pa.category = ?'); queryParams.push(categoryFilter); }
    if (partnerFilter) {
      conditions.push('(pa.business_name LIKE ? OR pa.email LIKE ?)');
      queryParams.push(`%${partnerFilter}%`, `%${partnerFilter}%`);
    }
    if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      return res.status(400).json({ success: false, message: 'dateFrom must use YYYY-MM-DD.' });
    }
    if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      return res.status(400).json({ success: false, message: 'dateTo must use YYYY-MM-DD.' });
    }
    if (dateFrom) { conditions.push('DATE(pa.created_at) >= ?'); queryParams.push(dateFrom); }
    if (dateTo) { conditions.push('DATE(pa.created_at) <= ?'); queryParams.push(dateTo); }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM partner_applications pa
      ${whereClause}
    `;
    const [countRows] = await pool.query(countQuery, queryParams);
    const total = countRows[0].total;

    const dataQuery = `
      SELECT
        pa.id,
        pa.business_name,
        pa.category,
        pa.contact_person,
        pa.email,
        pa.phone,
        pa.city,
        pa.state,
        pa.status,
        pa.admin_note,
        pa.created_at,
        COUNT(pd.id) AS document_count
      FROM partner_applications pa
      LEFT JOIN partner_documents pd ON pd.application_id = pa.id
      ${whereClause}
      GROUP BY pa.id
      ORDER BY pa.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

    return res.json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      applications: rows.map(r => ({
        id: r.id,
        businessName: r.business_name,
        category: r.category,
        contactPerson: r.contact_person,
        email: r.email,
        phone: r.phone,
        city: r.city,
        state: r.state,
        status: r.status,
        adminNote: r.admin_note,
        documentCount: r.document_count,
        createdAt: r.created_at
      }))
    });
  } catch (error) {
    console.error('Admin list applications error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// ==========================================
// 8. GET /api/partner/admin/applications/:id  (authenticateToken, requireAdmin)
// ==========================================
router.get('/admin/applications/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const appId = parseInt(req.params.id, 10);
    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID.' });
    }

    const [appRows] = await pool.query(
      `SELECT
         pa.*,
         u.username AS account_username,
         u.full_name AS account_full_name
       FROM partner_applications pa
       LEFT JOIN users u ON u.id = pa.user_id
       WHERE pa.id = ?`,
      [appId]
    );

    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const app = appRows[0];

    // Fetch documents WITHOUT file_path
    const [docs] = await pool.query(
      `SELECT id, document_type, original_name, file_size, mime_type, created_at
       FROM partner_documents
       WHERE application_id = ?
       ORDER BY created_at ASC`,
      [appId]
    );

    return res.json({
      success: true,
      application: {
        id: app.id,
        businessName: app.business_name,
        category: app.category,
        contactPerson: app.contact_person,
        email: app.email,
        phone: app.phone,
        address: app.address,
        city: app.city,
        state: app.state,
        pincode: app.pincode,
        businessDetails: app.business_details,
        gstNumber: app.gst_number,
        status: app.status,
        adminNote: app.admin_note,
        privacyConsent: !!app.privacy_consent,
        reviewedBy: app.reviewed_by,
        reviewedAt: app.reviewed_at,
        userId: app.user_id,
        accountUsername: app.account_username || null,
        accountFullName: app.account_full_name || null,
        createdAt: app.created_at,
        updatedAt: app.updated_at
      },
      documents: docs.map(d => ({
        id: d.id,
        documentType: d.document_type,
        originalName: d.original_name,
        fileSize: d.file_size,
        mimeType: d.mime_type,
        createdAt: d.created_at
      }))
    });
  } catch (error) {
    console.error('Admin get application error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// ==========================================
// 9. GET /api/partner/admin/documents/:docId  (authenticateToken, requireAdmin)
// ==========================================
router.get('/admin/documents/:docId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const docId = parseInt(req.params.docId, 10);
    if (!docId || isNaN(docId)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID.' });
    }

    const [docRows] = await pool.query(
      'SELECT id, original_name, stored_filename, file_path, mime_type FROM partner_documents WHERE id = ?',
      [docId]
    );

    if (docRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = docRows[0];
    const absolutePath = resolvePrivateDocument(doc.file_path);

    if (!absolutePath || doc.mime_type !== 'application/pdf' || !fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found on server.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(doc.original_name).replace(/["\r\n]/g, '')}"`);
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error('Admin serve document error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// ==========================================
// 10. PATCH /api/partner/admin/applications/:id/review  (authenticateToken, requireAdmin)
// ==========================================
router.patch('/admin/applications/:id/review', authenticateToken, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const appId = parseInt(req.params.id, 10);
    if (!appId || isNaN(appId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID.' });
    }

    const action = sanitize(req.body.action || '');
    const note   = sanitize(req.body.note || '');

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".' });
    }
    if (action === 'reject' && !note) {
      return res.status(400).json({ success: false, field: 'note', message: 'A reason is required when rejecting an application.' });
    }
    if (note.length > 5000) {
      return res.status(400).json({ success: false, field: 'note', message: 'Review notes must be 5,000 characters or fewer.' });
    }

    await conn.beginTransaction();
    // Lock the pending record so concurrent reviews cannot conflict.
    const [appRows] = await conn.query(
      'SELECT id, status, email, business_name, user_id FROM partner_applications WHERE id = ? FOR UPDATE',
      [appId]
    );
    if (appRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const previousStatus = appRows[0].status;
    if (previousStatus !== 'Pending') {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Only pending applications can be reviewed.' });
    }
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

    // Update application
    await conn.query(
      `UPDATE partner_applications
       SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [newStatus, note || null, req.user.id, appId]
    );

    // Insert audit log
    await conn.query(
      `INSERT INTO partner_audit_logs
         (application_id, admin_id, action, previous_status, new_status, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
       [appId, req.user.id, action, previousStatus, newStatus, note || null]
    );

    await conn.commit();

    // Return updated application (without sensitive internals)
    const [updatedRows] = await pool.query(
      `SELECT id, business_name, category, contact_person, email, phone, city, state,
              status, admin_note, reviewed_by, reviewed_at, created_at, updated_at
       FROM partner_applications WHERE id = ?`,
      [appId]
    );
    const updated = updatedRows[0];

    return res.json({
      success: true,
      message: `Application has been ${newStatus.toLowerCase()} successfully.`,
      application: {
        id: updated.id,
        businessName: updated.business_name,
        category: updated.category,
        contactPerson: updated.contact_person,
        email: updated.email,
        phone: updated.phone,
        city: updated.city,
        state: updated.state,
        status: updated.status,
        adminNote: updated.admin_note,
        reviewedBy: updated.reviewed_by,
        reviewedAt: updated.reviewed_at,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    console.error('Admin review application error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  } finally {
    conn.release();
  }
});

// ==========================================
// 11. GET /api/partner/admin/audit-logs  (authenticateToken, requireAdmin)
// ==========================================
router.get('/admin/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const applicationId = req.query.application_id ? parseInt(req.query.application_id, 10) : null;

    let query = `
      SELECT
        audit.id,
        audit.application_id,
        audit.admin_id,
        audit.admin_name,
        audit.admin_username,
        audit.business_name,
        audit.action,
        audit.previous_status,
        audit.new_status,
        audit.note,
        audit.created_at
      FROM (
        SELECT
          CONCAT('application-', pal.id) AS id, pal.application_id, pal.admin_id, u.full_name AS admin_name,
          u.username AS admin_username, pa.business_name, pal.action,
          pal.previous_status, pal.new_status, pal.note, pal.created_at
        FROM partner_audit_logs pal
        LEFT JOIN users u ON u.id = pal.admin_id
        INNER JOIN partner_applications pa ON pa.id = pal.application_id
        UNION ALL
        SELECT
          CONCAT('setup-', pase.id) AS id, pase.application_id, pase.actor_user_id AS admin_id,
          u.full_name AS admin_name, u.username AS admin_username, pa.business_name,
          pase.event_type AS action, NULL AS previous_status, NULL AS new_status,
          CONCAT('Actor role: ', pase.actor_role) AS note, pase.created_at
        FROM partner_account_setup_events pase
        LEFT JOIN users u ON u.id = pase.actor_user_id
        INNER JOIN partner_applications pa ON pa.id = pase.application_id
      ) audit
    `;
    const params = [];

    if (applicationId) {
      query += ' WHERE audit.application_id = ?';
      params.push(applicationId);
    }

    query += ' ORDER BY audit.created_at DESC LIMIT 100';

    const [rows] = await pool.query(query, params);

    return res.json({
      success: true,
      auditLogs: rows.map(r => ({
        id: r.id,
        applicationId: r.application_id,
        businessName: r.business_name,
        adminId: r.admin_id,
        adminName: r.admin_name,
        adminUsername: r.admin_username,
        action: r.action,
        previousStatus: r.previous_status,
        newStatus: r.new_status,
        note: r.note,
        createdAt: r.created_at
      }))
    });
  } catch (error) {
    console.error('Admin audit logs error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});



// Partner support questions and administrator replies
router.get('/my/queries', authenticateToken, requireBusinessPartner, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, subject, question, status, admin_reply AS adminReply,
              created_at AS createdAt, updated_at AS updatedAt
       FROM partner_queries WHERE partner_user_id = ? ORDER BY updated_at DESC, id DESC`,
      [req.user.id]
    );
    return res.json({ success: true, queries: rows });
  } catch (error) {
    console.error('Partner query list error:', error);
    return res.status(500).json({ success: false, message: 'Could not load partner questions.' });
  }
});

router.post('/my/queries', authenticateToken, requireBusinessPartner, async (req, res) => {
  try {
    const subject = sanitize(req.body.subject);
    const question = sanitize(req.body.question);
    if (!subject || subject.length > 160) return res.status(400).json({ success: false, field: 'subject', message: 'Enter a subject of up to 160 characters.' });
    if (!question || question.length > 5000) return res.status(400).json({ success: false, field: 'question', message: 'Enter a question of up to 5,000 characters.' });
    const [[application]] = await pool.query('SELECT id FROM partner_applications WHERE user_id = ? LIMIT 1', [req.user.id]);
    const [result] = await pool.query(
      `INSERT INTO partner_queries (partner_user_id, application_id, subject, question, status)
       VALUES (?, ?, ?, ?, 'Open')`,
      [req.user.id, application?.id || null, subject, question]
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Your question was sent to the admin team.' });
  } catch (error) {
    console.error('Partner query create error:', error);
    return res.status(500).json({ success: false, message: 'Could not send your question.' });
  }
});

router.get('/admin/queries', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT q.id, q.subject, q.question, q.status, q.admin_reply AS adminReply,
              q.created_at AS createdAt, q.updated_at AS updatedAt,
              q.partner_user_id AS partnerUserId, u.full_name AS partnerName,
              u.email AS partnerEmail, pa.business_name AS businessName
       FROM partner_queries q
       JOIN users u ON u.id = q.partner_user_id
       LEFT JOIN partner_applications pa ON pa.id = q.application_id
       ORDER BY (q.status = 'Open') DESC, q.updated_at DESC, q.id DESC`
    );
    return res.json({ success: true, queries: rows });
  } catch (error) {
    console.error('Admin partner query list error:', error);
    return res.status(500).json({ success: false, message: 'Could not load partner questions.' });
  }
});

router.post('/admin/queries/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const reply = sanitize(req.body.reply);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    if (!reply || reply.length > 5000) return res.status(400).json({ success: false, field: 'reply', message: 'Enter a reply of up to 5,000 characters.' });
    const [result] = await pool.query(
      `UPDATE partner_queries SET admin_reply = ?, status = 'Replied', replied_by = ?, replied_at = NOW()
       WHERE id = ?`, [reply, req.user.id, id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Question not found.' });
    return res.json({ success: true, message: 'Reply sent to the partner.' });
  } catch (error) {
    console.error('Admin partner query reply error:', error);
    return res.status(500).json({ success: false, message: 'Could not send the reply.' });
  }
});

module.exports = router;
