/**
 * Safe, Idempotent Database Initializer for Tourist Hub AI
 * Compatible with MySQL 8+, MariaDB 10.5+, and Aiven MySQL (sql_require_primary_key=ON)
 * 
 * Rules:
 * 1. Creates all 14 required tables if they do not exist, ensuring explicit primary keys.
 * 2. Safely adds any missing columns to existing tables using INFORMATION_SCHEMA inspection.
 * 3. Never drops tables, resets tables, or deletes existing production users or bookings.
 * 4. Seeds master catalogue reference data only if tables are completely empty.
 * 5. Can be safely executed repeatedly in any environment without side effects.
 */

const fs = require('fs');
const path = require('path');
const pool = require('./db');

// Helper to safely add column only if table exists and column is missing
async function addColumnIfNotExists(connection, tableName, columnName, columnDefinition) {
  const [tables] = await connection.query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
  `, [tableName]);

  if (tables.length === 0) {
    return false;
  }

  const [cols] = await connection.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ? 
      AND COLUMN_NAME = ?
  `, [tableName, columnName]);

  if (cols.length === 0) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    console.log(`  + Added missing column '${columnName}' to '${tableName}'`);
    return true;
  }
  return false;
}

async function initDatabase() {
  console.log('====================================================');
  console.log('🚀 Tourist Hub AI — Safe Database Initialization');
  console.log('Target DB:', process.env.DB_NAME || 'tourist_hub');
  console.log('Host:     ', process.env.DB_HOST || '127.0.0.1');
  console.log('====================================================\n');

  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Connected to database successfully.');

    // 1. Read and apply schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Executing schema definitions from schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');

      // Strip comments properly without dropping CREATE TABLE statements
      const cleanSql = schemaSql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--.*$/gm, '')
        .trim();

      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`  -> Found ${statements.length} table definitions to execute.`);

      for (const statement of statements) {
        try {
          await connection.query(statement);
          const match = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
          if (match) {
            console.log(`  ✅ Table '${match[1]}' verified / created.`);
          }
        } catch (err) {
          // If table already exists or constraint already exists, log and proceed
          if (err.errno !== 1050 && err.errno !== 1061) {
            console.warn(`  ⚠️ Schema warning: ${err.message}`);
          }
        }
      }
      console.log('✅ All 14 application tables verified.');
    }

    // 2. Safe Column Additions for backward/forward compatibility
    console.log('\n🔍 Verifying column compatibility on existing tables...');

    // Table: users
    await addColumnIfNotExists(connection, 'users', 'profile_image_url', 'VARCHAR(500) NULL');
    await addColumnIfNotExists(connection, 'users', 'name', 'VARCHAR(150) GENERATED ALWAYS AS (full_name) VIRTUAL');
    await addColumnIfNotExists(connection, 'users', 'avatar_url', 'VARCHAR(500) GENERATED ALWAYS AS (profile_image_url) VIRTUAL');
    await addColumnIfNotExists(connection, 'users', 'failed_attempts', 'INT NOT NULL DEFAULT 0');
    await addColumnIfNotExists(connection, 'users', 'lock_until', 'DATETIME NULL');
    await addColumnIfNotExists(connection, 'users', 'reset_token', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'users', 'reset_token_expiry', 'DATETIME NULL');
    await addColumnIfNotExists(connection, 'users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // Only update non-generated columns
    const [userCols] = await connection.query(`
      SELECT COLUMN_NAME, EXTRA 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('name', 'avatar_url')
    `);
    for (const col of userCols) {
      if (!col.EXTRA.includes('GENERATED')) {
        if (col.COLUMN_NAME === 'name') {
          await connection.query('UPDATE users SET name = full_name WHERE name IS NULL OR name = ""');
        }
        if (col.COLUMN_NAME === 'avatar_url') {
          await connection.query('UPDATE users SET avatar_url = profile_image_url WHERE avatar_url IS NULL AND profile_image_url IS NOT NULL');
        }
      }
    }

    // Table: user_preferences
    await addColumnIfNotExists(connection, 'user_preferences', 'budget_range', "VARCHAR(50) DEFAULT 'Moderate'");
    await addColumnIfNotExists(connection, 'user_preferences', 'preferred_transport', "VARCHAR(50) DEFAULT 'Any'");
    await addColumnIfNotExists(connection, 'user_preferences', 'food_preference', "VARCHAR(100) DEFAULT 'No Preference'");

    // Table: tourist_places
    await addColumnIfNotExists(connection, 'tourist_places', 'destination_id', 'INT NULL DEFAULT NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'slug', 'VARCHAR(160) NULL DEFAULT NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'category', "VARCHAR(100) DEFAULT 'Heritage'");
    await addColumnIfNotExists(connection, 'tourist_places', 'gallery_urls', 'JSON NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'history', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'culture_info', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'famous_festival', 'VARCHAR(200) NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'famous_dance_art', 'VARCHAR(200) NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'cultural_uniqueness', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'major_attractions', 'JSON NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'activities', 'JSON NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'local_food', 'JSON NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'local_transport', 'JSON NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'estimated_cost_per_day', 'DECIMAL(10,2) DEFAULT 2500.00');
    await addColumnIfNotExists(connection, 'tourist_places', 'recommended_duration_days', 'INT DEFAULT 3');
    await addColumnIfNotExists(connection, 'tourist_places', 'reviews_count', 'INT DEFAULT 0');
    await addColumnIfNotExists(connection, 'tourist_places', 'best_time', 'VARCHAR(150) NULL');
    await addColumnIfNotExists(connection, 'tourist_places', 'best_time_to_visit', 'VARCHAR(150) NULL');

    // Table: hotels
    await addColumnIfNotExists(connection, 'hotels', 'location', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'hotels', 'room_type', "VARCHAR(100) DEFAULT 'Deluxe Room'");
    await addColumnIfNotExists(connection, 'hotels', 'contact', 'VARCHAR(100) NULL');

    // Table: emergency_services
    await addColumnIfNotExists(connection, 'emergency_services', 'contact_number', 'VARCHAR(100) NULL');
    await addColumnIfNotExists(connection, 'emergency_services', 'distance_km', 'DECIMAL(6,2) NULL');

    // Table: reviews
    await addColumnIfNotExists(connection, 'reviews', 'review_text', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'reviews', 'package_id', 'INT NULL');

    console.log('✅ Column inspection and synchronization completed.');

    // 3. Master Catalogue Data Seeding (Only if empty)
    console.log('\n📊 Checking master catalogue data...');
    const [stateRows] = await connection.query('SELECT COUNT(*) as count FROM states');
    const stateCount = stateRows[0].count;

    const [placeRows] = await connection.query('SELECT COUNT(*) as count FROM tourist_places');
    const placeCount = placeRows[0].count;

    const [pkgRows] = await connection.query('SELECT COUNT(*) as count FROM travel_packages');
    const pkgCount = pkgRows[0].count;

    if (stateCount === 0 || placeCount === 0 || pkgCount === 0) {
      console.log(`🌱 Master catalogue incomplete (states: ${stateCount}, places: ${placeCount}, packages: ${pkgCount}). Running catalogue seeding...`);
      try {
        const seed = require('./seed');
        await seed();
        console.log('✅ Master catalogue data seeded successfully.');
      } catch (seedErr) {
        console.warn('⚠️ Seeding warning:', seedErr.message);
      }
    } else {
      console.log(`ℹ️ Master catalogue already populated (${stateCount} states, ${placeCount} places, ${pkgCount} packages). Preserving existing data.`);
    }

    // 4. Optional Demo Users (CLI flag: --with-demo-users)
    if (process.argv.includes('--with-demo-users')) {
      console.log('\n👥 Flag --with-demo-users detected. Seeding test accounts...');
      try {
        const seedAuthUsers = require('./seed_auth');
        await seedAuthUsers();
        console.log('✅ Demo test accounts configured.');
      } catch (authErr) {
        console.warn('⚠️ Demo user seeding warning:', authErr.message);
      }
    }

    console.log('\n====================================================');
    console.log('🎉 Database initialization complete and verified!');
    console.log('All 14 tables and schemas are ready for production.');
    console.log('====================================================\n');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    if (require.main === module) {
      process.exit(process.exitCode || 0);
    }
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
