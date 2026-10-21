const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [userRows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const rawUser = userRows[0];
    const user = {
      id: rawUser.id,
      name: rawUser.name || rawUser.full_name || '',
      full_name: rawUser.full_name || rawUser.name || '',
      email: rawUser.email,
      phone: rawUser.phone,
      role: rawUser.role,
      avatar_url: rawUser.avatar_url || rawUser.profile_image_url || null,
      profile_image_url: rawUser.profile_image_url || rawUser.avatar_url || null,
      created_at: rawUser.created_at
    };

    const [prefRows] = await pool.query(
      'SELECT travel_type, budget_range, preferred_transport, interests, food_preference, preferred_duration FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    let preferences = prefRows[0] || {
      travel_type: 'Couple',
      budget_range: 'Moderate',
      preferred_transport: 'Any',
      interests: ['Heritage', 'Nature', 'Culture'],
      food_preference: 'No Preference',
      preferred_duration: 3
    };

    if (preferences && typeof preferences.interests === 'string') {
      try {
        preferences.interests = JSON.parse(preferences.interests);
      } catch (e) {
        preferences.interests = preferences.interests.split(',').map(s => s.trim());
      }
    }

    return res.json({
      success: true,
      user,
      preferences
    });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving user profile.' });
  }
});

// PUT /api/users/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    // Check writable columns to avoid attempting to write to VIRTUAL GENERATED columns like `name` or `avatar_url`
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
    ).catch(() => [[]]);
    const writableCols = new Set(
      cols
        .filter(c => !c.EXTRA || !c.EXTRA.toUpperCase().includes('GENERATED'))
        .map(c => c.COLUMN_NAME)
    );

    const updates = [];
    const params = [];

    // full_name is the real column, name is virtual generated
    if (writableCols.has('full_name')) {
      updates.push('full_name = ?');
      params.push(name.trim());
    } else if (writableCols.has('name')) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (writableCols.has('phone')) {
      updates.push('phone = ?');
      params.push(phone ? phone.trim() : null);
    }

    if (avatar_url !== undefined) {
      if (writableCols.has('profile_image_url')) {
        updates.push('profile_image_url = ?');
        params.push(avatar_url ? avatar_url.trim() : null);
      } else if (writableCols.has('avatar_url')) {
        updates.push('avatar_url = ?');
        params.push(avatar_url ? avatar_url.trim() : null);
      }
    }

    if (updates.length > 0) {
      params.push(req.user.id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Retrieve fresh user record to return to frontend
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const rawUser = userRows[0] || {};
    const updatedUser = {
      id: rawUser.id,
      name: rawUser.name || rawUser.full_name || name.trim(),
      full_name: rawUser.full_name || rawUser.name || name.trim(),
      email: rawUser.email,
      phone: rawUser.phone,
      role: rawUser.role,
      avatar_url: rawUser.avatar_url || rawUser.profile_image_url || null,
      profile_image_url: rawUser.profile_image_url || rawUser.avatar_url || null,
      created_at: rawUser.created_at
    };

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, message: error.sqlMessage || 'Error updating user profile.' });
  }
});

// GET /api/users/preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const [prefRows] = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    let prefs = prefRows[0] || null;
    if (prefs && typeof prefs.interests === 'string') {
      try {
        prefs.interests = JSON.parse(prefs.interests);
      } catch (e) {
        prefs.interests = prefs.interests.split(',').map(s => s.trim());
      }
    }

    return res.json({
      success: true,
      preferences: prefs
    });
  } catch (error) {
    console.error('Get Preferences Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching preferences.' });
  }
});

// PUT /api/users/preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { travel_type, budget_range, preferred_transport, interests, food_preference, preferred_duration } = req.body;

    const formattedInterests = Array.isArray(interests) 
      ? JSON.stringify(interests) 
      : JSON.stringify((interests || '').split(',').map(s => s.trim()).filter(Boolean));

    await pool.query(
      `INSERT INTO user_preferences (user_id, travel_type, budget_range, preferred_transport, interests, food_preference, preferred_duration)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         travel_type = VALUES(travel_type),
         budget_range = VALUES(budget_range),
         preferred_transport = VALUES(preferred_transport),
         interests = VALUES(interests),
         food_preference = VALUES(food_preference),
         preferred_duration = VALUES(preferred_duration)`,
      [
        req.user.id,
        travel_type || 'Couple',
        budget_range || 'Moderate',
        preferred_transport || 'Any',
        formattedInterests,
        food_preference || 'No Preference',
        preferred_duration ? parseInt(preferred_duration) : 3
      ]
    );

    return res.json({
      success: true,
      message: 'Travel preferences updated successfully.'
    });
  } catch (error) {
    console.error('Update Preferences Error:', error);
    return res.status(500).json({ success: false, message: error.sqlMessage || 'Error saving preferences.' });
  }
});

// GET /api/users/all (Admin only)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin' && userRole !== 'super admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.full_name as name, u.username, u.email, u.phone, u.role, u.is_active, u.created_at, 
              (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as bookings_count,
              (SELECT COUNT(*) FROM travel_plans WHERE user_id = u.id) as plans_count
       FROM users u ORDER BY u.created_at DESC`
    );

    return res.json({ success: true, users: rows });
  } catch (error) {
    console.error('Get All Users Error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving user accounts.' });
  }
});

// PUT /api/users/:id/role (Admin / Super Admin only toggle role)
router.put('/:id/role', authenticateToken, async (req, res) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin' && userRole !== 'super admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const { role } = req.body;
    if (!['User', 'Tourist', 'Admin', 'Super Admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role value.' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    return res.json({ success: true, message: `User role updated to ${role}.` });
  } catch (error) {
    console.error('Update Role Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating user role.' });
  }
});

module.exports = router;
