const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Quick sanity check on startup + auto-create tables if they don't exist
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected:', process.env.DB_NAME);
    conn.release();
    await runMigrations();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
}

async function runMigrations() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        from_currency VARCHAR(10) NOT NULL,
        to_currency VARCHAR(10) NOT NULL,
        amount DECIMAL(18,4) NOT NULL,
        converted_amount DECIMAL(18,4) NOT NULL,
        rate DECIMAL(18,8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_conversions_user (user_id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tax_calculations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        gross_income DECIMAL(18,2) NOT NULL,
        hra DECIMAL(18,2) DEFAULT 0,
        deduction_80c DECIMAL(18,2) DEFAULT 0,
        deduction_80d DECIMAL(18,2) DEFAULT 0,
        nps DECIMAL(18,2) DEFAULT 0,
        tax_old_regime DECIMAL(18,2) NOT NULL,
        tax_new_regime DECIMAL(18,2) NOT NULL,
        recommended_regime VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_tax_user (user_id)
      )
    `);
    console.log('✅ Tables ready: users, conversions, tax_calculations');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

testConnection();

module.exports = pool;