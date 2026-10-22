/**
 * Database Migration Script: Transport Booking Platform Upgrade
 * Safely adds new columns and tables for multi-transport booking modules.
 */

const pool = require('./db');

async function addColumnIfNotExists(connection, tableName, columnName, columnDefinition) {
  const [cols] = await connection.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ? 
      AND COLUMN_NAME = ?
  `, [tableName, columnName]);

  if (cols.length === 0) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    console.log(`  + Added column '${columnName}' to '${tableName}'`);
    return true;
  }
  return false;
}

async function upgradeTransportSchema() {
  console.log('====================================================');
  console.log('🚀 Upgrading Transport Booking Database Schema');
  console.log('====================================================\n');

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Extend 'transport' table columns
    console.log('1. Checking transport table columns...');
    await addColumnIfNotExists(connection, 'transport', 'from_city', 'VARCHAR(150) NULL');
    await addColumnIfNotExists(connection, 'transport', 'to_city', 'VARCHAR(150) NULL');
    await addColumnIfNotExists(connection, 'transport', 'service_number', 'VARCHAR(100) NULL');
    await addColumnIfNotExists(connection, 'transport', 'vehicle_model', 'VARCHAR(150) NULL');
    await addColumnIfNotExists(connection, 'transport', 'class_options', 'JSON NULL');
    await addColumnIfNotExists(connection, 'transport', 'boarding_points', 'JSON NULL');
    await addColumnIfNotExists(connection, 'transport', 'dropping_points', 'JSON NULL');
    await addColumnIfNotExists(connection, 'transport', 'amenities', 'JSON NULL');
    await addColumnIfNotExists(connection, 'transport', 'luggage_capacity', 'VARCHAR(150) NULL');
    await addColumnIfNotExists(connection, 'transport', 'seats_total', 'INT DEFAULT 40');
    await addColumnIfNotExists(connection, 'transport', 'reviews_count', 'INT DEFAULT 85');
    await addColumnIfNotExists(connection, 'transport', 'driver_name', 'VARCHAR(150) NULL');
    await addColumnIfNotExists(connection, 'transport', 'driver_phone', 'VARCHAR(50) NULL');
    await addColumnIfNotExists(connection, 'transport', 'driver_rating', 'DECIMAL(3,2) DEFAULT 4.80');
    await addColumnIfNotExists(connection, 'transport', 'cancellation_policy', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'transport', 'airline_logo', 'VARCHAR(500) NULL');

    // 2. Extend 'bookings' table for transport tickets
    console.log('\n2. Checking bookings table columns...');
    await addColumnIfNotExists(connection, 'bookings', 'booking_reference', 'VARCHAR(100) NULL');
    await addColumnIfNotExists(connection, 'bookings', 'booking_details', 'JSON NULL');
    await addColumnIfNotExists(connection, 'bookings', 'cancellation_reason', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'bookings', 'refund_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await addColumnIfNotExists(connection, 'bookings', 'refund_status', "VARCHAR(50) DEFAULT 'None'");

    // 3. Create 'transport_seat_bookings' table
    console.log('\n3. Creating transport_seat_bookings table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transport_seat_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transport_id INT NOT NULL,
        travel_date DATE NOT NULL,
        seat_number VARCHAR(20) NOT NULL,
        deck_tier VARCHAR(20) DEFAULT 'lower',
        seat_type VARCHAR(30) DEFAULT 'standard',
        coach_class VARCHAR(30) DEFAULT 'standard',
        booking_id INT NULL,
        user_id INT NULL,
        status ENUM('held', 'booked', 'cancelled') NOT NULL DEFAULT 'held',
        passenger_name VARCHAR(150) NULL,
        passenger_age INT NULL,
        passenger_gender VARCHAR(20) NULL,
        hold_expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_transport_date_seat (transport_id, travel_date, seat_number, deck_tier),
        CONSTRAINT fk_tsb_transport FOREIGN KEY (transport_id) REFERENCES transport(id) ON DELETE CASCADE,
        CONSTRAINT fk_tsb_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
        CONSTRAINT fk_tsb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✅ Table transport_seat_bookings ready.');

    // 4. Create 'transport_driver_bookings' table
    console.log('\n4. Creating transport_driver_bookings table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transport_driver_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transport_id INT NOT NULL,
        booking_id INT NULL,
        user_id INT NOT NULL,
        trip_type VARCHAR(100) NOT NULL DEFAULT 'one_way',
        pickup_location VARCHAR(255) NOT NULL,
        drop_location VARCHAR(255) NOT NULL,
        pickup_date DATE NOT NULL,
        pickup_time VARCHAR(50) NOT NULL,
        return_date DATE NULL,
        passengers_count INT DEFAULT 1,
        luggage_count INT DEFAULT 1,
        vehicle_category VARCHAR(50) NOT NULL,
        base_fare DECIMAL(10,2) NOT NULL,
        toll_taxes DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        driver_assigned_name VARCHAR(150) NULL,
        driver_assigned_phone VARCHAR(50) NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_tdb_transport FOREIGN KEY (transport_id) REFERENCES transport(id) ON DELETE CASCADE,
        CONSTRAINT fk_tdb_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
        CONSTRAINT fk_tdb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✅ Table transport_driver_bookings ready.');

    console.log('\n🎉 Transport schema upgrade completed successfully!');
  } catch (err) {
    console.error('❌ Schema upgrade error:', err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

// Run directly if invoked from CLI
if (require.main === module) {
  upgradeTransportSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = upgradeTransportSchema;
