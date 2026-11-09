/**
 * fix_users_schema.js
 * One-time migration: brings the live `users` table (old schema) in line
 * with the current schema.sql, then re-seeds the test accounts.
 *
 * Safe to re-run — every ALTER is guarded by a column-existence check.
 */

const bcrypt = require('bcryptjs');
const pool = require('./db');

async function fixUsersSchema() {
  console.log('🔧 Fixing users table schema...\n');
  const conn = await pool.getConnection();

  try {
    // ── 0. Snapshot existing columns ────────────────────────────────────────
    const [colRows] = await conn.query('SHOW COLUMNS FROM users');
    const cols = colRows.map(c => c.Field);
    console.log('Current columns:', cols.join(', '), '\n');

    // ── 1. Rename `name` → `full_name` (if needed) ──────────────────────────
    if (cols.includes('name') && !cols.includes('full_name')) {
      await conn.query('ALTER TABLE users CHANGE COLUMN `name` `full_name` VARCHAR(150) NOT NULL');
      console.log('✅ Renamed `name` → `full_name`');
    } else if (cols.includes('full_name')) {
      console.log('⏭️  `full_name` already exists, skipping rename');
    }

    // ── 2. Add `username` column ─────────────────────────────────────────────
    if (!cols.includes('username')) {
      await conn.query(
        'ALTER TABLE users ADD COLUMN `username` VARCHAR(100) NULL AFTER `full_name`'
      );
      console.log('✅ Added `username` column');

      // Auto-derive usernames from email prefixes for any existing rows
      const [existingUsers] = await conn.query(
        'SELECT id, email FROM users WHERE username IS NULL'
      );
      for (const u of existingUsers) {
        let base = u.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        if (!base || !/^[a-zA-Z]/.test(base)) base = 'user_' + u.id;
        let candidate = base;
        let suffix = 1;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const [match] = await conn.query(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [candidate, u.id]
          );
          if (match.length === 0) break;
          candidate = `${base}_${suffix++}`;
        }
        await conn.query('UPDATE users SET username = ? WHERE id = ?', [candidate, u.id]);
        console.log(`   ↳ Assigned username '${candidate}' to user id=${u.id}`);
      }

      // Make username NOT NULL + UNIQUE now that all rows have a value
      await conn.query(
        'ALTER TABLE users MODIFY COLUMN `username` VARCHAR(100) NOT NULL'
      );
      // Add unique index only if it doesn't exist yet
      const [idxRows] = await conn.query('SHOW INDEX FROM users WHERE Key_name = ?', ['idx_users_username']);
      if (idxRows.length === 0) {
        await conn.query('ALTER TABLE users ADD UNIQUE INDEX idx_users_username (`username`)');
      }
      console.log('✅ username is now NOT NULL UNIQUE');
    } else {
      console.log('⏭️  `username` already exists');
    }

    // ── 3. Add `is_active` column ─────────────────────────────────────────────
    if (!cols.includes('is_active')) {
      await conn.query(
        'ALTER TABLE users ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `role`'
      );
      console.log('✅ Added `is_active` column');
    } else {
      console.log('⏭️  `is_active` already exists');
    }

    // ── 4. Widen `role` from ENUM → VARCHAR(50) ───────────────────────────────
    await conn.query(
      "ALTER TABLE users MODIFY COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'User'"
    );
    console.log('✅ role column widened to VARCHAR(50)');

    // ── 5. Normalise legacy role values ───────────────────────────────────────
    await conn.query("UPDATE users SET role = 'Admin' WHERE role = 'admin'");
    await conn.query("UPDATE users SET role = 'User'  WHERE role IN ('user','Tourist')");
    console.log('✅ Normalised existing role values');

    // ── 6. Add `profile_image_url` if missing ─────────────────────────────────
    if (!cols.includes('profile_image_url')) {
      await conn.query(
        'ALTER TABLE users ADD COLUMN `profile_image_url` VARCHAR(500) NULL'
      );
      console.log('✅ Added `profile_image_url` column');
    }

    // ── 7. Add `reset_token` / `reset_token_expiry` if missing ───────────────
    if (!cols.includes('reset_token')) {
      await conn.query(
        'ALTER TABLE users ADD COLUMN `reset_token` VARCHAR(255) NULL'
      );
      console.log('✅ Added `reset_token` column');
    }
    if (!cols.includes('reset_token_expiry')) {
      await conn.query(
        'ALTER TABLE users ADD COLUMN `reset_token_expiry` DATETIME NULL'
      );
      console.log('✅ Added `reset_token_expiry` column');
    }

    // ── 8. Seed / update test accounts ───────────────────────────────────────
    console.log('\n🌱 Seeding test credentials...');

    const adminHash   = await bcrypt.hash('Admin@1234', 10);
    const userHash    = await bcrypt.hash('User@1234', 10);

    const testUsers = [
      {
        fullName:     'Administrator',
        username:     'admin',
        email:        'admin@example.com',
        phone:        '+91 9876543210',
        passwordHash: adminHash,
        role:         'Admin'
      },
      {
        fullName:     'Platform Manager',
        username:     'manager01',
        email:        'manager@example.com',
        phone:        '+91 9876543211',
        passwordHash: adminHash,
        role:         'Admin'
      },
      {
        fullName:     'Demo Tourist User',
        username:     'user01',
        email:        'user@example.com',
        phone:        '+91 9876543212',
        passwordHash: userHash,
        role:         'User'
      }
    ];

    for (const tu of testUsers) {
      const [existing] = await conn.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [tu.email, tu.username]
      );

      if (existing.length > 0) {
        await conn.query(
          `UPDATE users
             SET full_name = ?, username = ?, password_hash = ?, role = ?,
                 phone = ?, is_active = 1, failed_attempts = 0, lock_until = NULL
           WHERE id = ?`,
          [tu.fullName, tu.username, tu.passwordHash, tu.role, tu.phone, existing[0].id]
        );
        console.log(`   ✅ Updated: ${tu.username} (${tu.role})`);
      } else {
        await conn.query(
          `INSERT INTO users (full_name, username, email, phone, password_hash, role, is_active, failed_attempts)
           VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
          [tu.fullName, tu.username, tu.email, tu.phone, tu.passwordHash, tu.role]
        );
        console.log(`   ✅ Created: ${tu.username} (${tu.role})`);
      }
    }

    console.log('\n=============================================');
    console.log('✨ Test Credentials:');
    console.log('  Admin:   username=admin   | email=admin@example.com   | password=Admin@1234');
    console.log('  Manager: username=manager01 | email=manager@example.com | password=Admin@1234');
    console.log('  User:    username=user01  | email=user@example.com    | password=User@1234');
    console.log('=============================================\n');
    console.log('🎉 Schema fix and seeding complete!');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  fixUsersSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = fixUsersSchema;
