const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Resolve .env from backend directory regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isRemoteHost = process.env.DB_HOST && 
  process.env.DB_HOST !== '127.0.0.1' && 
  process.env.DB_HOST !== 'localhost';

const sslRequired = process.env.DB_SSL === 'true' || 
  process.env.DB_SSL === 'require' || 
  (!process.env.DB_SSL && isRemoteHost);

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
  keepAliveInitialDelay: 10000,
  ssl: sslRequired ? { rejectUnauthorized: false } : undefined
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
