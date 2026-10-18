const bcrypt = require('bcryptjs');
const pool = require('./db');

async function upgradeAuthSchema() {
  console.log('🔄 Upgrading users table schema for enhanced auth...');

  const connection = await pool.getConnection();

  try {
    // 1. Check existing columns in users table
    const [columns] = await connection.query('SHOW COLUMNS FROM users');
    const colNames = columns.map(c => c.Field);

    // 2. Modify role to VARCHAR(50)
    await connection.query("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'User'");
    console.log('✅ Updated role column to VARCHAR(50)');

    // 3. Add username column if not present
    if (!colNames.includes('username')) {
      await connection.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL AFTER full_name');
      console.log('✅ Added username column');

      // Populate usernames for existing rows
      const [existingUsers] = await connection.query('SELECT id, email FROM users WHERE username IS NULL');
      for (const u of existingUsers) {
        let base = u.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        if (!base || !/^[a-zA-Z]/.test(base)) base = 'user_' + u.id;
        let candidate = base;
        let suffix = 1;
        while (true) {
          const [match] = await connection.query('SELECT id FROM users WHERE username = ? AND id != ?', [candidate, u.id]);
          if (match.length === 0) break;
          candidate = `${base}_${suffix++}`;
        }
        await connection.query('UPDATE users SET username = ? WHERE id = ?', [candidate, u.id]);
      }

      await connection.query('ALTER TABLE users ADD UNIQUE INDEX idx_users_username (username)');
      console.log('✅ Assigned unique usernames to existing users and created unique index');
    }

    // 4. Add is_active column
    if (!colNames.includes('is_active')) {
      await connection.query('ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role');
      console.log('✅ Added is_active column');
    }

    // 5. Add failed_attempts column
    if (!colNames.includes('failed_attempts')) {
      await connection.query('ALTER TABLE users ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0 AFTER is_active');
      console.log('✅ Added failed_attempts column');
    }

    // 6. Add lock_until column
    if (!colNames.includes('lock_until')) {
      await connection.query('ALTER TABLE users ADD COLUMN lock_until DATETIME NULL AFTER failed_attempts');
      console.log('✅ Added lock_until column');
    }

    // 7. Add reset_token and reset_token_expiry
    if (!colNames.includes('reset_token')) {
      await connection.query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL AFTER lock_until');
      console.log('✅ Added reset_token column');
    }
    if (!colNames.includes('reset_token_expiry')) {
      await connection.query('ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL AFTER reset_token');
      console.log('✅ Added reset_token_expiry column');
    }

    // 8. Normalize legacy roles (e.g. 'user' -> 'User', 'admin' -> 'Admin')
    await connection.query("UPDATE users SET role = 'Admin' WHERE role = 'admin'");
    await connection.query("UPDATE users SET role = 'User' WHERE role = 'user' OR role = 'Tourist'");
    console.log('✅ Normalized existing user roles');

    // 9. Seed the required test accounts
    console.log('🌱 Seeding required test accounts...');
    const superAdminHash = await bcrypt.hash('Admin@1234', 10);
    const adminHash = await bcrypt.hash('Manager@1234', 10);
    const userHash = await bcrypt.hash('User@1234', 10);

    const testUsers = [
      {
        fullName: 'Super Administrator',
        username: 'admin',
        email: 'admin@example.com',
        phone: '+91 9876543210',
        passwordHash: superAdminHash,
        role: 'Super Admin'
      },
      {
        fullName: 'Platform Manager',
        username: 'manager01',
        email: 'manager@example.com',
        phone: '+91 9876543211',
        passwordHash: adminHash,
        role: 'Admin'
      },
      {
        fullName: 'Demo Tourist User',
        username: 'user01',
        email: 'user@example.com',
        phone: '+91 9876543212',
        passwordHash: userHash,
        role: 'User'
      }
    ];

    for (const tu of testUsers) {
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [tu.email, tu.username]
      );

      if (existing.length > 0) {
        await connection.query(
          `UPDATE users 
           SET full_name = ?, username = ?, password_hash = ?, role = ?, phone = ?, is_active = 1, failed_attempts = 0, lock_until = NULL 
           WHERE id = ?`,
          [tu.fullName, tu.username, tu.passwordHash, tu.role, tu.phone, existing[0].id]
        );
        console.log(`Updated test user: ${tu.username} (${tu.role})`);
      } else {
        await connection.query(
          `INSERT INTO users (full_name, username, email, phone, password_hash, role, is_active, failed_attempts) 
           VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
          [tu.fullName, tu.username, tu.email, tu.phone, tu.passwordHash, tu.role]
        );
        console.log(`Created test user: ${tu.username} (${tu.role})`);
      }
    }

    console.log('🎉 Auth schema upgrade and test credentials seeding completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  upgradeAuthSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = upgradeAuthSchema;
