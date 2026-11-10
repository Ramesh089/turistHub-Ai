const pool = require('./db');

async function getColumns(conn, tableName) {
  const [columns] = await conn.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return new Map(columns.map(column => [column.COLUMN_NAME, column]));
}

async function migratePartnerWorkflow() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS partner_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        contact_person VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(30) NOT NULL,
        address VARCHAR(500) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        business_details TEXT NULL,
        gst_number VARCHAR(40) NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'Pending',
        admin_note TEXT NULL,
        privacy_consent TINYINT(1) NOT NULL DEFAULT 0,
        account_setup_token_hash CHAR(64) NULL,
        account_setup_token_expires_at DATETIME NULL,
        account_setup_token_used_at DATETIME NULL,
        user_id INT NULL UNIQUE,
        reviewed_by INT NULL,
        reviewed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_pa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_pa_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [applicationStatusColumns] = await conn.query(`
      SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partner_applications' AND COLUMN_NAME = 'status'
    `);
    if (!applicationStatusColumns.length || applicationStatusColumns[0].DATA_TYPE !== 'varchar') {
      await conn.query("ALTER TABLE partner_applications MODIFY COLUMN status VARCHAR(40) NOT NULL DEFAULT 'Pending'");
    }

    let applicationColumns = await getColumns(conn, 'partner_applications');
    for (const [name, definition] of [
      ['application_id', 'VARCHAR(100) NULL'],
      ['admin_note', 'TEXT NULL'],
      ['user_id', 'INT NULL'],
      ['account_setup_token_hash', 'CHAR(64) NULL'],
      ['account_setup_token_expires_at', 'DATETIME NULL'],
      ['account_setup_token_used_at', 'DATETIME NULL']
    ]) {
      if (!applicationColumns.has(name)) {
        await conn.query(`ALTER TABLE partner_applications ADD COLUMN ${name} ${definition}`);
      }
    }
    applicationColumns = await getColumns(conn, 'partner_applications');

    // Older installations have a required public application identifier that this API does not use.
    const legacyApplicationId = applicationColumns.get('application_id');
    if (legacyApplicationId && legacyApplicationId.IS_NULLABLE === 'NO') {
      await conn.query(
        `ALTER TABLE partner_applications MODIFY COLUMN application_id ${legacyApplicationId.COLUMN_TYPE} NULL`
      );
    }
    await conn.query("UPDATE partner_applications SET application_id = CAST(id AS CHAR) WHERE application_id IS NULL OR application_id = ''");
    if (applicationColumns.has('admin_notes')) {
      await conn.query(
        'UPDATE partner_applications SET admin_note = admin_notes WHERE admin_note IS NULL AND admin_notes IS NOT NULL'
      );
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS partner_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        document_type VARCHAR(120) NOT NULL DEFAULT 'Business Document',
        original_name VARCHAR(255) NOT NULL,
        stored_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pd_application FOREIGN KEY (application_id) REFERENCES partner_applications(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    let documentColumns = await getColumns(conn, 'partner_documents');
    for (const [name, definition] of [
      ['document_type', 'VARCHAR(150) NULL'],
      ['stored_filename', 'VARCHAR(255) NULL'],
      ['file_path', 'VARCHAR(500) NULL']
    ]) {
      if (!documentColumns.has(name)) {
        await conn.query(`ALTER TABLE partner_documents ADD COLUMN ${name} ${definition}`);
      }
    }
    documentColumns = await getColumns(conn, 'partner_documents');

    if (documentColumns.has('doc_type')) {
      await conn.query(
        'UPDATE partner_documents SET document_type = doc_type WHERE document_type IS NULL OR document_type = \'\''
      );
      const legacyDocumentType = documentColumns.get('doc_type');
      if (legacyDocumentType.IS_NULLABLE === 'NO') {
        await conn.query(
          `ALTER TABLE partner_documents MODIFY COLUMN doc_type ${legacyDocumentType.COLUMN_TYPE} NOT NULL DEFAULT 'Business Document'`
        );
      }
    }
    await conn.query(
      "ALTER TABLE partner_documents MODIFY COLUMN document_type VARCHAR(150) NOT NULL DEFAULT 'Business Document'"
    );

    if (documentColumns.has('storage_key')) {
      await conn.query(
        'UPDATE partner_documents SET stored_filename = storage_key WHERE stored_filename IS NULL AND storage_key IS NOT NULL'
      );
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS partner_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        admin_id INT NOT NULL,
        action VARCHAR(80) NOT NULL,
        previous_status VARCHAR(40) NULL,
        new_status VARCHAR(40) NULL,
        note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pal_application FOREIGN KEY (application_id) REFERENCES partner_applications(id) ON DELETE CASCADE,
        CONSTRAINT fk_pal_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS partner_account_setup_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        actor_user_id INT NULL,
        actor_role VARCHAR(40) NOT NULL,
        event_type VARCHAR(60) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pase_application FOREIGN KEY (application_id) REFERENCES partner_applications(id) ON DELETE RESTRICT,
        CONSTRAINT fk_pase_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_pase_application_created (application_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Partner application tables verified.');
  } catch (error) {
    console.error('Partner workflow migration failed:', error.message);
    process.exitCode = 1;
    throw error;
  } finally {
    if (conn) conn.release();
    if (require.main === module) process.exit(process.exitCode || 0);
  }
}

if (require.main === module) {
  migratePartnerWorkflow().catch(() => process.exit(process.exitCode || 1));
}

module.exports = migratePartnerWorkflow;
