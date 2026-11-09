const pool = require('./db');
async function migratePartnerQueries() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`CREATE TABLE IF NOT EXISTS partner_queries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      partner_user_id INT NOT NULL,
      application_id INT NULL,
      subject VARCHAR(160) NOT NULL,
      question TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Open',
      admin_reply TEXT NULL,
      replied_by INT NULL,
      replied_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_pq_partner FOREIGN KEY (partner_user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_pq_application FOREIGN KEY (application_id) REFERENCES partner_applications(id) ON DELETE SET NULL,
      CONSTRAINT fk_pq_admin FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('Partner query table ready.');
  } catch (error) { console.error('Partner query migration failed:', error.message); process.exitCode = 1; throw error; }
  finally { if (conn) conn.release(); if (require.main === module) process.exit(process.exitCode || 0); }
}
if (require.main === module) migratePartnerQueries().catch(() => process.exit(process.exitCode || 1));
module.exports = migratePartnerQueries;
