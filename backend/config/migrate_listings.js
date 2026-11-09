/**
 * Migration: Partner Service Listings + Listing Images + Listing Audit Logs
 * Run: node config/migrate_listings.js
 * Safe and idempotent — uses CREATE TABLE IF NOT EXISTS.
 */

const pool = require('./db');

async function migrateListings() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('🏪 Running partner service listings migration...');

    // 1. partner_service_listings
    await conn.query(`
      CREATE TABLE IF NOT EXISTS partner_service_listings (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        application_id       INT NOT NULL,
        partner_user_id      INT NULL,
        listing_title        VARCHAR(255) NOT NULL,
        listing_description  TEXT NULL,
        category             VARCHAR(100) NOT NULL,
        location_or_route    VARCHAR(255) NULL,
        city                 VARCHAR(100) NULL,
        state                VARCHAR(100) NULL,
        price                DECIMAL(10,2) NULL,
        capacity             INT NOT NULL DEFAULT 1,
        price_unit           VARCHAR(50) NULL COMMENT 'e.g. per night, per day, per person',
        availability         TEXT NULL,
        terms                TEXT NULL,
        extra_info           JSON NULL COMMENT 'category-specific fields',
        primary_image_id     INT NULL,
        status               ENUM('Submitted','Changes Requested','Rejected','Draft','Published','Unpublished','Archived') NOT NULL DEFAULT 'Submitted',
        created_by_admin_id  INT NOT NULL,
        published_by_admin_id INT NULL,
        published_at         DATETIME NULL,
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_psl_application  FOREIGN KEY (application_id)       REFERENCES partner_applications(id) ON DELETE CASCADE,
        CONSTRAINT fk_psl_partner_user FOREIGN KEY (partner_user_id)      REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_psl_created_by   FOREIGN KEY (created_by_admin_id)  REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [listingColumns] = await conn.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partner_service_listings'
    `);
    const listingColumnMap = new Map(listingColumns.map(column => [column.COLUMN_NAME, column]));
    const requiredStatuses = ['Submitted', 'Changes Requested', 'Rejected', 'Draft', 'Published', 'Unpublished', 'Archived'];
    const currentStatusType = listingColumnMap.has('status') ? listingColumnMap.get('status').COLUMN_TYPE : '';
    if (requiredStatuses.some(status => !currentStatusType.includes(status))) {
      await conn.query(`
        ALTER TABLE partner_service_listings
        MODIFY COLUMN status ENUM('Submitted','Changes Requested','Rejected','Draft','Published','Unpublished','Archived')
        NOT NULL DEFAULT 'Submitted'
      `);
    }
    if (listingColumnMap.get('created_by_admin_id')?.IS_NULLABLE === 'NO') {
      await conn.query('ALTER TABLE partner_service_listings MODIFY COLUMN created_by_admin_id INT NULL');
    }
    if (!listingColumnMap.has('admin_note')) {
      await conn.query('ALTER TABLE partner_service_listings ADD COLUMN admin_note TEXT NULL AFTER status');
    }
    if (!listingColumnMap.has('capacity')) {
      await conn.query('ALTER TABLE partner_service_listings ADD COLUMN capacity INT NOT NULL DEFAULT 1 AFTER price');
    }
    console.log('  ✅ Table partner_service_listings ready.');

    const [bookingColumns] = await conn.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings'
    `);
    const bookingColumnNames = new Set(bookingColumns.map(column => column.COLUMN_NAME));
    if (bookingColumns.length && !bookingColumnNames.has('listing_id')) {
      await conn.query('ALTER TABLE bookings ADD COLUMN listing_id INT NULL AFTER guide_id');
    }
    if (bookingColumns.length && !bookingColumnNames.has('capacity_units')) {
      await conn.query('ALTER TABLE bookings ADD COLUMN capacity_units INT NOT NULL DEFAULT 1 AFTER listing_id');
    }
    if (bookingColumns.length) {
      const [bookingIndexes] = await conn.query(`
        SELECT INDEX_NAME
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings'
          AND INDEX_NAME = 'idx_bookings_listing_status'
      `);
      if (!bookingIndexes.length) {
        await conn.query('CREATE INDEX idx_bookings_listing_status ON bookings (listing_id, status)');
      }
    }

    // 2. listing_images
    await conn.query(`
      CREATE TABLE IF NOT EXISTS listing_images (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        listing_id           INT NOT NULL,
        stored_filename      VARCHAR(255) NOT NULL,
        original_name        VARCHAR(255) NOT NULL,
        file_path            VARCHAR(500) NOT NULL,
        file_size            INT NOT NULL,
        mime_type            VARCHAR(100) NOT NULL,
        alt_text             VARCHAR(255) NULL,
        caption              VARCHAR(255) NULL,
        is_primary           TINYINT(1) NOT NULL DEFAULT 0,
        display_order        INT NOT NULL DEFAULT 0,
        uploaded_by_admin_id INT NOT NULL,
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_li_listing FOREIGN KEY (listing_id)           REFERENCES partner_service_listings(id) ON DELETE CASCADE,
        CONSTRAINT fk_li_admin   FOREIGN KEY (uploaded_by_admin_id) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Table listing_images ready.');

    // 3. listing_audit_logs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS listing_audit_logs (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        listing_id      INT NOT NULL,
        admin_id        INT NOT NULL,
        action          VARCHAR(80) NOT NULL COMMENT 'create, edit, image_add, image_remove, image_update, publish, unpublish, archive',
        previous_status VARCHAR(50) NULL,
        new_status      VARCHAR(50) NULL,
        note            TEXT NULL,
        changed_fields  JSON NULL,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_lal_listing FOREIGN KEY (listing_id) REFERENCES partner_service_listings(id) ON DELETE CASCADE,
        CONSTRAINT fk_lal_admin   FOREIGN KEY (admin_id)   REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Table listing_audit_logs ready.');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS partner_listing_submissions (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        listing_id      INT NOT NULL,
        partner_user_id INT NOT NULL,
        submission_data JSON NOT NULL,
        submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pls_listing FOREIGN KEY (listing_id) REFERENCES partner_service_listings(id) ON DELETE CASCADE,
        CONSTRAINT fk_pls_partner FOREIGN KEY (partner_user_id) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Table partner_listing_submissions ready.');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS partner_service_change_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        listing_id INT NOT NULL,
        partner_user_id INT NOT NULL,
        proposed_data JSON NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Pending',
        admin_note TEXT NULL,
        reviewed_by INT NULL,
        reviewed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_pscr_listing FOREIGN KEY (listing_id) REFERENCES partner_service_listings(id) ON DELETE CASCADE,
        CONSTRAINT fk_pscr_partner FOREIGN KEY (partner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_pscr_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_pscr_status (status),
        INDEX idx_pscr_partner_listing (partner_user_id, listing_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Table partner_service_change_requests ready.');

    const [auditColumns] = await conn.query(`
      SELECT COLUMN_NAME, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listing_audit_logs'
    `);
    const auditColumnNames = new Set(auditColumns.map(column => column.COLUMN_NAME));
    if (auditColumns.some(column => column.COLUMN_NAME === 'admin_id' && column.IS_NULLABLE === 'NO')) {
      await conn.query('ALTER TABLE listing_audit_logs MODIFY COLUMN admin_id INT NULL');
    }
    if (!auditColumnNames.has('actor_user_id')) {
      await conn.query('ALTER TABLE listing_audit_logs ADD COLUMN actor_user_id INT NULL AFTER admin_id');
    }
    if (!auditColumnNames.has('actor_role')) {
      await conn.query("ALTER TABLE listing_audit_logs ADD COLUMN actor_role VARCHAR(40) NOT NULL DEFAULT 'Admin' AFTER actor_user_id");
    }

    console.log('✅ Listings migration complete.\n');
  } catch (err) {
    // Ignore duplicate key/constraint errors (idempotent)
    if (err.errno === 1061 || err.errno === 1050) {
      console.log('  ℹ️  Tables already up-to-date.');
    } else {
      console.error('❌ Listings migration error:', err.message);
      process.exitCode = 1;
    }
  } finally {
    if (conn) conn.release();
    if (require.main === module) process.exit(process.exitCode || 0);
  }
}

if (require.main === module) migrateListings();
module.exports = migrateListings;
