const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seedAuthUsers() {
  console.log('🌱 Seeding authentication credentials for Tourist AI Hub...');

  try {
    const adminHash = await bcrypt.hash('Admin@1234', 10);
    const userHash = await bcrypt.hash('User@1234', 10);

    const testUsers = [
      {
        fullName: 'Administrator',
        username: 'admin',
        email: 'admin@example.com',
        phone: '+91 9876543210',
        passwordHash: adminHash,
        role: 'Admin'
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
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [tu.email, tu.username]
      );

      if (existing.length > 0) {
        await pool.query(
          `UPDATE users 
           SET full_name = ?, username = ?, password_hash = ?, role = ?, phone = ?, is_active = 1, failed_attempts = 0, lock_until = NULL 
           WHERE id = ?`,
          [tu.fullName, tu.username, tu.passwordHash, tu.role, tu.phone, existing[0].id]
        );
        console.log(`✅ Updated account: ${tu.username} (${tu.role}) - ${tu.email}`);
      } else {
        await pool.query(
          `INSERT INTO users (full_name, username, email, phone, password_hash, role, is_active, failed_attempts) 
           VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
          [tu.fullName, tu.username, tu.email, tu.phone, tu.passwordHash, tu.role]
        );
        console.log(`✅ Created account: ${tu.username} (${tu.role}) - ${tu.email}`);
      }
    }

    console.log('\n=============================================');
    console.log('✨ Seeded Test Credentials:');
    console.log('1. Admin: username=admin  | email=admin@example.com | password=Admin@1234');
    console.log('2. User:  username=user01 | email=user@example.com  | password=User@1234');
    console.log('=============================================\n');
  } catch (error) {
    console.error('❌ Failed to seed auth accounts:', error.message);
    throw error;
  }
}

if (require.main === module) {
  seedAuthUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedAuthUsers;
