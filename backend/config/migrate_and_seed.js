const pool = require('./db');

async function migrateAndSeed() {
  console.log('🔄 Checking and creating database tables...');

  // 1. states
  await pool.query(`
    CREATE TABLE IF NOT EXISTS states (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(10) NOT NULL UNIQUE,
      capital VARCHAR(100),
      description TEXT,
      image_url VARCHAR(500),
      best_time VARCHAR(100),
      highlights TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Table states ready');

  // Helper to safely add column if not exists
  async function addColumnIfNotExists(table, column, definition) {
    try {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`+ Added column ${column} to ${table}`);
    } catch (e) {
      if (e.errno !== 1060) { // 1060 = Duplicate column name
        console.warn(`Column check error ${table}.${column}:`, e.message);
      }
    }
  }

  // 2. tourist_places columns
  await pool.query('ALTER TABLE tourist_places MODIFY COLUMN destination_id INT NULL DEFAULT NULL');
  await pool.query('ALTER TABLE tourist_places MODIFY COLUMN slug VARCHAR(160) NULL DEFAULT NULL');
  await addColumnIfNotExists('tourist_places', 'state_id', 'INT DEFAULT 1');
  await addColumnIfNotExists('tourist_places', 'location', 'VARCHAR(255)');
  await addColumnIfNotExists('tourist_places', 'category', 'VARCHAR(100) DEFAULT "Heritage"');
  await addColumnIfNotExists('tourist_places', 'image_url', 'TEXT');
  await addColumnIfNotExists('tourist_places', 'gallery_urls', 'JSON');
  await addColumnIfNotExists('tourist_places', 'history', 'TEXT');
  await addColumnIfNotExists('tourist_places', 'culture_info', 'TEXT');
  await addColumnIfNotExists('tourist_places', 'famous_festival', 'VARCHAR(200)');
  await addColumnIfNotExists('tourist_places', 'famous_dance_art', 'VARCHAR(200)');
  await addColumnIfNotExists('tourist_places', 'cultural_uniqueness', 'TEXT');
  await addColumnIfNotExists('tourist_places', 'major_attractions', 'JSON');
  await addColumnIfNotExists('tourist_places', 'activities', 'JSON');
  await addColumnIfNotExists('tourist_places', 'local_food', 'JSON');
  await addColumnIfNotExists('tourist_places', 'local_transport', 'JSON');
  await addColumnIfNotExists('tourist_places', 'estimated_cost_per_day', 'DECIMAL(10,2) DEFAULT 2500.00');
  await addColumnIfNotExists('tourist_places', 'recommended_duration_days', 'INT DEFAULT 3');
  await addColumnIfNotExists('tourist_places', 'reviews_count', 'INT DEFAULT 0');

  // 3. cultures
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cultures (
      id INT AUTO_INCREMENT PRIMARY KEY,
      state_id INT,
      title VARCHAR(200),
      category VARCHAR(100),
      description TEXT,
      image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Table cultures ready');

  // 4. festivals
  await pool.query(`
    CREATE TABLE IF NOT EXISTS festivals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      state_id INT,
      name VARCHAR(200),
      month_season VARCHAR(100),
      description TEXT,
      significance TEXT,
      image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Table festivals ready');

  // 5. travel_packages
  await pool.query(`
    CREATE TABLE IF NOT EXISTS travel_packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      destination_id INT,
      title VARCHAR(255),
      company_name VARCHAR(150),
      duration_days INT DEFAULT 3,
      duration_nights INT DEFAULT 2,
      price DECIMAL(10,2) DEFAULT 9999,
      transport_type VARCHAR(50),
      hotel_type VARCHAR(50),
      food_included BOOLEAN DEFAULT true,
      guide_included BOOLEAN DEFAULT true,
      activities JSON,
      description TEXT,
      image_url VARCHAR(500),
      rating DECIMAL(3,2) DEFAULT 4.8,
      reviews_count INT DEFAULT 45,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Table travel_packages ready');

  // 6. hotels columns
  try {
    await pool.query('ALTER TABLE hotels DROP FOREIGN KEY fk_hotels_destination');
  } catch (e) {}
  await pool.query('ALTER TABLE hotels MODIFY COLUMN city VARCHAR(100) NULL DEFAULT ""');
  await pool.query('ALTER TABLE hotels MODIFY COLUMN destination_id INT NULL DEFAULT NULL');
  await addColumnIfNotExists('hotels', 'location', 'VARCHAR(255)');
  await addColumnIfNotExists('hotels', 'room_type', 'VARCHAR(100)');
  await addColumnIfNotExists('hotels', 'contact', 'VARCHAR(100)');

  // 7. transport
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transport (
      id INT AUTO_INCREMENT PRIMARY KEY,
      destination_id INT,
      transport_type VARCHAR(50),
      provider VARCHAR(150),
      route VARCHAR(255),
      departure_time VARCHAR(50),
      arrival_time VARCHAR(50),
      price DECIMAL(10,2),
      duration VARCHAR(50),
      booking_info VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Table transport ready');

  // 8. guides
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      destination_id INT,
      name VARCHAR(150),
      languages VARCHAR(255),
      experience_years INT DEFAULT 5,
      specialization VARCHAR(150),
      price_per_day DECIMAL(10,2) DEFAULT 1500,
      rating DECIMAL(3,2) DEFAULT 4.9,
      contact VARCHAR(100),
      image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Table guides ready');

  // 9. emergency_services columns
  try {
    await pool.query('ALTER TABLE emergency_services DROP FOREIGN KEY fk_emergency_destination');
  } catch (e) {}
  try {
    await pool.query('ALTER TABLE emergency_services DROP FOREIGN KEY fk_emergency_services_destination');
  } catch (e) {}
  await pool.query('ALTER TABLE emergency_services MODIFY COLUMN destination_id INT NULL DEFAULT NULL');
  await pool.query('ALTER TABLE emergency_services MODIFY COLUMN city VARCHAR(100) NULL DEFAULT ""');
  await pool.query('ALTER TABLE emergency_services MODIFY COLUMN phone_primary VARCHAR(50) NULL DEFAULT ""');
  await pool.query('ALTER TABLE emergency_services MODIFY COLUMN service_type VARCHAR(100) DEFAULT "Hospital"');
  await addColumnIfNotExists('emergency_services', 'contact_number', 'VARCHAR(100)');
  await addColumnIfNotExists('emergency_services', 'distance_km', 'DECIMAL(6,2)');

  // 10. bookings
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      package_id INT NULL,
      hotel_id INT NULL,
      transport_id INT NULL,
      guide_id INT NULL,
      booking_type VARCHAR(50) DEFAULT 'Package',
      travel_date DATE NULL,
      return_date DATE NULL,
      people_count INT DEFAULT 1,
      total_amount DECIMAL(10,2) DEFAULT 0,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      discount_code VARCHAR(50) NULL,
      payment_method VARCHAR(50) DEFAULT 'UPI',
      payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Paid',
      transaction_id VARCHAR(100) NULL,
      status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Confirmed',
      special_requests TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Table bookings ready');

  // 11. travel_plans
  await pool.query(`
    CREATE TABLE IF NOT EXISTS travel_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      destination_id INT NULL,
      origin VARCHAR(150) NULL,
      destination_name VARCHAR(150),
      travel_date DATE NULL,
      days INT DEFAULT 3,
      traveller_type VARCHAR(50) DEFAULT 'Solo',
      people_count INT DEFAULT 1,
      budget VARCHAR(50) DEFAULT 'Moderate',
      transport_mode VARCHAR(50) DEFAULT 'Train',
      interests JSON NULL,
      food_preference VARCHAR(50) DEFAULT 'Any',
      estimated_cost DECIMAL(10,2) DEFAULT 0,
      itinerary JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Table travel_plans ready');

  // 12. reviews columns
  try {
    await pool.query('ALTER TABLE reviews DROP FOREIGN KEY fk_reviews_destination');
  } catch (e) {}
  await pool.query('ALTER TABLE reviews MODIFY COLUMN destination_id INT NULL DEFAULT NULL');
  await pool.query('ALTER TABLE reviews MODIFY COLUMN comment TEXT NULL DEFAULT NULL');
  await pool.query('ALTER TABLE reviews MODIFY COLUMN title VARCHAR(200) NULL DEFAULT NULL');
  await addColumnIfNotExists('reviews', 'review_text', 'TEXT');
  await addColumnIfNotExists('reviews', 'package_id', 'INT NULL');

  // 13. user_preferences columns
  await addColumnIfNotExists('user_preferences', 'budget_range', 'VARCHAR(50) DEFAULT "Moderate"');
  await addColumnIfNotExists('user_preferences', 'preferred_transport', 'VARCHAR(50) DEFAULT "Train"');
  await addColumnIfNotExists('user_preferences', 'food_preference', 'VARCHAR(100) DEFAULT "Vegetarian"');

  console.log('🎉 Schema migration complete! Now running seed script...');
  require('./seed');
}

migrateAndSeed().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
