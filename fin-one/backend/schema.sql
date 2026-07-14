-- FIN-ONE database schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS fin_one CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fin_one;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

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
);
