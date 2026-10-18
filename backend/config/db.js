const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tourist_hub',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL/MariaDB database: ' + (process.env.DB_NAME || 'tourist_hub'));
    connection.release();
  } catch (error) {
    console.error('MySQL Connection Error:', error.message);
  }
})();

module.exports = pool;
