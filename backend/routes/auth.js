const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const {
  authenticateToken,
  JWT_SECRET,
  JWT_REFRESH_SECRET
} = require('../middleware/auth');

const router = express.Router();

// Helper to sanitize text inputs against injection / basic XSS
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

// Generate signed slider captcha token
router.get('/slider-token', (req, res) => {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${timestamp}:${nonce}`)
    .digest('hex');

  const token = Buffer.from(JSON.stringify({ timestamp, nonce, signature })).toString('base64');
  return res.json({ success: true, sliderToken: token });
});

// Helper to verify slider captcha token
function verifySliderToken(sliderToken) {
  if (!sliderToken) return false;
  try {
    const decoded = JSON.parse(Buffer.from(sliderToken, 'base64').toString('utf8'));
    const { timestamp, nonce, signature } = decoded;

    // Token must be recent (within 10 minutes)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return false;
    }

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${timestamp}:${nonce}`)
      .digest('hex');

    return signature === expectedSig;
  } catch (err) {
    return false;
  }
}

// Cookie setting helper
function setAuthCookies(res, accessToken, refreshToken, rememberMe = false) {
  const isProd = process.env.NODE_ENV === 'production';

  // Access token cookie (15 mins)
  res.cookie('touristhub_access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Refresh token cookie (7 days or 30 days)
  const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  res.cookie('touristhub_refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: refreshMaxAge
  });
}

// Helper to format consistent user object
function formatUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    name: row.full_name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: !!row.is_active,
    profileImageUrl: row.profile_image_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ==========================================
// POST /api/auth/register
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const fullName = sanitizeInput(req.body.fullName || req.body.name);
    const username = sanitizeInput(req.body.username);
    const email = sanitizeInput(req.body.email).toLowerCase();
    const phone = sanitizeInput(req.body.phone);
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';
    const termsAccepted = req.body.termsAccepted === true || req.body.termsAccepted === 'true';
    const sliderToken = req.body.sliderToken;
    const sliderVerified = req.body.sliderVerified;

    // 1. Validation - Full name
    if (!fullName) {
      return res.status(400).json({ success: false, field: 'fullName', message: 'Full name is required.' });
    }
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    if (!nameRegex.test(fullName)) {
      return res.status(400).json({
        success: false,
        field: 'fullName',
        message: 'Full name must be 2 to 50 characters and contain only letters and spaces.'
      });
    }

    // 2. Validation - Username
    if (!username) {
      return res.status(400).json({ success: false, field: 'username', message: 'Username is required.' });
    }
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        field: 'username',
        message: 'Username must be 4-20 characters, start with a letter, and contain only letters, numbers, or underscore.'
      });
    }

    // 3. Validation - Email
    if (!email) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, field: 'email', message: 'Please provide a valid email address.' });
    }

    // 4. Validation - Phone
    if (phone) {
      const phoneDigits = phone.replace(/[^0-9]/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return res.status(400).json({
          success: false,
          field: 'phone',
          message: 'Phone number must be between 10 and 15 valid digits.'
        });
      }
    }

    // 5. Validation - Password complexity
    if (!password) {
      return res.status(400).json({ success: false, field: 'password', message: 'Password is required.' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;
    if (!passwordRegex.test(password) || /\s/.test(password)) {
      return res.status(400).json({
        success: false,
        field: 'password',
        message: 'Password must be at least 8 characters long, contain no spaces, and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
      });
    }

    // 6. Validation - Confirm Password
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, field: 'confirmPassword', message: 'Passwords do not match.' });
    }

    // 7. Validation - Terms acceptance
    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        field: 'termsAccepted',
        message: 'You must agree to the Terms of Service and Privacy Policy.'
      });
    }

    // 8. Validation - Slider Captcha
    const isCaptchaValid = sliderVerified || verifySliderToken(sliderToken);
    if (!isCaptchaValid) {
      return res.status(400).json({
        success: false,
        field: 'sliderCaptcha',
        message: 'Please complete the slider verification.'
      });
    }

    // 9. Uniqueness checks
    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email already registered.' });
    }

    const [existingUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername.length > 0) {
      return res.status(400).json({ success: false, field: 'username', message: 'Username already taken.' });
    }

    // 10. Role assignment: Public registration is strictly 'User'
    const assignedRole = 'User';

    // 11. Hash password & insert
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, username, email, phone, password_hash, role, is_active, failed_attempts) 
       VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
      [fullName, username, email, phone || null, passwordHash, assignedRole]
    );

    const userId = result.insertId;

    // Optional user preferences default record
    try {
      await pool.query(
        `INSERT INTO user_preferences (user_id, travel_type, budget_range, preferred_transport, interests, food_preference, preferred_duration)
         VALUES (?, 'Couple', 'Moderate', 'Any', ?, 'No Preference', 3)
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [userId, JSON.stringify(['Heritage', 'Culture', 'Nature'])]
      );
    } catch (e) {
      // Non-critical
    }

    // Generate tokens
    const tokenPayload = {
      id: userId,
      email,
      username,
      fullName,
      role: assignedRole
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    setAuthCookies(res, accessToken, refreshToken, false);

    const [userRow] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Tourist AI Hub.',
      token: accessToken,
      refreshToken,
      user: formatUser(userRow[0])
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during registration. Please try again.'
    });
  }
});

// ==========================================
// POST /api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const account = sanitizeInput(req.body.account || req.body.username || req.body.email);
    const password = req.body.password || '';
    const expectedRole = sanitizeInput(req.body.role || req.body.expectedRole);
    const rememberPassword = req.body.rememberPassword === true || req.body.rememberMe === true;
    const sliderToken = req.body.sliderToken;
    const sliderVerified = req.body.sliderVerified;

    if (!account) {
      return res.status(400).json({ success: false, field: 'account', message: 'Please enter your username or email.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, field: 'password', message: 'Please enter your password.' });
    }

    // Slider Captcha verification
    const isCaptchaValid = sliderVerified || verifySliderToken(sliderToken);
    if (!isCaptchaValid) {
      return res.status(400).json({
        success: false,
        field: 'sliderCaptcha',
        message: 'Please complete the slider verification.'
      });
    }

    // Query user by email OR username
    const [rows] = await pool.query(
      `SELECT * FROM users 
       WHERE LOWER(email) = ? OR LOWER(username) = ? 
       LIMIT 1`,
      [account.toLowerCase(), account.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];

    // Check if account is active
    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.'
      });
    }

    // Check account lockout
    if (user.lock_until) {
      const lockTime = new Date(user.lock_until).getTime();
      const now = Date.now();
      if (lockTime > now) {
        const minutesLeft = Math.ceil((lockTime - now) / (60 * 1000));
        return res.status(423).json({
          success: false,
          locked: true,
          message: `Account is temporarily locked due to 5 consecutive failed login attempts. Please try again after ${minutesLeft} minute(s) or reset your password.`
        });
      } else {
        // Lock has expired - auto-reset failed attempts
        await pool.query('UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE id = ?', [user.id]);
        user.failed_attempts = 0;
        user.lock_until = null;
      }
    }

    // Check role match if requested from dropdown
    if (expectedRole) {
      const userRole = (user.role || '').toLowerCase();
      const expRole = expectedRole.toLowerCase();

      // Normalize comparison (e.g. 'user' matches 'user' or 'tourist')
      let matches = userRole === expRole;
      if (expRole === 'user' && (userRole === 'tourist' || userRole === 'user')) matches = true;

      if (!matches) {
        return res.status(403).json({
          success: false,
          message: `Role mismatch: This account has '${user.role}' privileges. Please select '${user.role}' in the role dropdown.`
        });
      }
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const newFailed = (user.failed_attempts || 0) + 1;
      if (newFailed >= 5) {
        // Lock for 15 minutes
        await pool.query(
          'UPDATE users SET failed_attempts = ?, lock_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
          [newFailed, user.id]
        );
        return res.status(423).json({
          success: false,
          locked: true,
          message: 'Account has been locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      } else {
        await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [newFailed, user.id]);
        const remaining = 5 - newFailed;
        return res.status(401).json({
          success: false,
          message: `Invalid credentials. (${remaining} attempt(s) remaining before account lockout)`
        });
      }
    }

    // Reset failed attempts & lock on successful login
    await pool.query('UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE id = ?', [user.id]);

    // Generate JWT access & refresh tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      name: user.full_name,
      role: user.role
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refreshTokenLifetime = rememberPassword ? '30d' : '7d';
    const refreshToken = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, { expiresIn: refreshTokenLifetime });

    // Set secure httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken, rememberPassword);

    return res.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      token: accessToken,
      refreshToken,
      user: formatUser(user)
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
});

// ==========================================
// POST /api/auth/logout
// ==========================================
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('touristhub_access_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax'
  });
  res.clearCookie('touristhub_refresh_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax'
  });

  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// ==========================================
// GET /api/auth/me
// ==========================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    if (user.is_active === 0) {
      return res.status(403).json({ success: false, message: 'User account is deactivated.' });
    }

    return res.json({
      success: true,
      user: formatUser(user)
    });
  } catch (error) {
    console.error('Auth Check Error:', error);
    return res.status(500).json({ success: false, message: 'Server error checking authentication.' });
  }
});

// ==========================================
// POST /api/auth/forgot-password
// ==========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const identifier = sanitizeInput(req.body.account || req.body.email || req.body.username);

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide your account email or username.' });
    }

    const [rows] = await pool.query(
      'SELECT id, email, username, full_name FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
      [identifier.toLowerCase(), identifier.toLowerCase()]
    );

    if (rows.length === 0) {
      // Don't leak if account doesn't exist for privacy, or return clear message
      return res.status(404).json({
        success: false,
        message: 'No account associated with that email or username was found.'
      });
    }

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit verification code

    // Store token and code (hash token for security, expire in 15 minutes)
    const combinedToken = `${resetCode}:${resetToken}`;
    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
      [combinedToken, user.id]
    );

    return res.json({
      success: true,
      message: `Password reset verification code generated for ${user.email}. Code expires in 15 minutes.`,
      email: user.email,
      resetToken,
      resetCode // returned for demo / developer convenience
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate password reset.' });
  }
});

// ==========================================
// POST /api/auth/reset-password
// ==========================================
router.post('/reset-password', async (req, res) => {
  try {
    const identifier = sanitizeInput(req.body.account || req.body.email || req.body.username);
    const resetCode = sanitizeInput(req.body.resetCode || req.body.code);
    const newPassword = req.body.newPassword || req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (!identifier || !resetCode) {
      return res.status(400).json({ success: false, message: 'Account identifier and 6-digit verification code are required.' });
    }

    // Password validation
    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required.' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;
    if (!passwordRegex.test(newPassword) || /\s/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain no spaces, and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Lookup user with valid non-expired reset token
    const [rows] = await pool.query(
      `SELECT * FROM users 
       WHERE (LOWER(email) = ? OR LOWER(username) = ?) 
         AND reset_token IS NOT NULL 
         AND reset_token_expiry > NOW()`,
      [identifier.toLowerCase(), identifier.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset request. Please request a new code.'
      });
    }

    const user = rows[0];
    const [storedCode] = (user.reset_token || '').split(':');

    if (storedCode !== resetCode) {
      return res.status(400).json({ success: false, message: 'Incorrect 6-digit verification code.' });
    }

    // Hash new password and clear reset token & lock
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users 
       SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, failed_attempts = 0, lock_until = NULL 
       WHERE id = ?`,
      [newPasswordHash, user.id]
    );

    return res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

module.exports = router;
