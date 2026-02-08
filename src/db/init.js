const bcrypt = require('bcryptjs');

async function initMySQLDatabase() {
  const { mysqlPool } = require('../config/database');

  console.log('  Inizializzazione tabelle MySQL...');

  // Crea tabelle se non esistono
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'USER',
      banned TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id VARCHAR(191) PRIMARY KEY NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      project_type VARCHAR(100) NOT NULL,
      budget_range VARCHAR(100) DEFAULT '',
      description TEXT NOT NULL,
      deadline VARCHAR(100) DEFAULT '',
      attachments TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      admin_notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id VARCHAR(191) PRIMARY KEY NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      project_url VARCHAR(500) DEFAULT '',
      category VARCHAR(100) NOT NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_featured (featured)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Seed admin se non esiste
  const adminHash = bcrypt.hashSync('admin123', 10);
  await mysqlPool.execute(
    `INSERT IGNORE INTO users (id, name, email, password_hash, role, banned)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['admin_001', 'Admin WAG', 'admin@wagservices.it', adminHash, 'ADMIN', 0]
  );
  // Aggiorna hash admin (fix per hash PHP incompatibili)
  await mysqlPool.execute(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [adminHash, 'admin_001']
  );

  // Seed utente test
  const userHash = bcrypt.hashSync('user123', 10);
  await mysqlPool.execute(
    `INSERT IGNORE INTO users (id, name, email, password_hash, role, banned)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['user_001', 'Utente Test', 'user@wagservices.it', userHash, 'USER', 0]
  );

  // Seed portfolio items
  await mysqlPool.execute(
    `INSERT IGNORE INTO portfolio_items (id, title, description, image_url, project_url, category, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['port_001', 'TechStore Pro', 'E-commerce tech con catalogo headless e reportistica.',
     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&q=80', '#', 'E-Commerce', 1]
  );

  await mysqlPool.execute(
    `INSERT IGNORE INTO portfolio_items (id, title, description, image_url, project_url, category, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['port_002', 'FinanceFlow', 'Dashboard fintech con indicatori personalizzati.',
     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80', '#', 'Web App', 1]
  );

  console.log('  Tabelle MySQL pronte');
}

module.exports = { initMySQLDatabase };
