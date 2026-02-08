const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'database.sqlite');

function initDatabase() {
  // Assicurati che la cartella data/ esista
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ─── Crea tabelle ──────────────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      banned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      project_type TEXT NOT NULL,
      budget_range TEXT DEFAULT '',
      description TEXT NOT NULL,
      deadline TEXT DEFAULT '',
      attachments TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      project_url TEXT DEFAULT '',
      category TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(category);
    CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio_items(featured);
  `);

  // ─── Seed dati iniziali (solo se tabelle vuote) ────

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    console.log('  ℹ  Database vuoto, inserimento dati iniziali...');

    // Admin: admin@wagservices.it / admin123
    const adminHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, banned)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin_001', 'Admin WAG', 'admin@wagservices.it', adminHash, 'ADMIN', 0);

    // User: user@wagservices.it / user123
    const userHash = bcrypt.hashSync('user123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, banned)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('user_001', 'Utente Test', 'user@wagservices.it', userHash, 'USER', 0);

    console.log('  ✓  Utenti creati (admin@wagservices.it / admin123, user@wagservices.it / user123)');
  }

  const portfolioCount = db.prepare('SELECT COUNT(*) as count FROM portfolio_items').get();
  if (portfolioCount.count === 0) {
    const insertPortfolio = db.prepare(`
      INSERT INTO portfolio_items (id, title, description, image_url, project_url, category, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertPortfolio.run(
      'port_001',
      'TechStore Pro',
      'E-commerce tech con catalogo headless e reportistica.',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&q=80',
      '#',
      'E-Commerce',
      1
    );

    insertPortfolio.run(
      'port_002',
      'FinanceFlow',
      'Dashboard fintech con indicatori personalizzati.',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80',
      '#',
      'Web App',
      1
    );

    console.log('  ✓  Portfolio items di esempio creati');
  }

  db.close();
  console.log('  ✓  Database inizializzato con successo');
}

// ─── MySQL init (Hostinger) ─────────────────────────

async function initMySQLDatabase() {
  const { mysqlPool } = require('../config/database');

  console.log('  🗄️  Inizializzazione tabelle MySQL...');

  // Crea tabelle se non esistono (usa query(), non execute(), per DDL)
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

  // Seed admin se non esiste (INSERT IGNORE = no errore se già presente)
  const adminHash = bcrypt.hashSync('admin123', 10);
  await mysqlPool.execute(
    `INSERT IGNORE INTO users (id, name, email, password_hash, role, banned)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['admin_001', 'Admin WAG', 'admin@wagservices.it', adminHash, 'ADMIN', 0]
  );
  // Aggiorna l'hash admin per sicurezza (se importato da SQL con hash PHP incompatibile)
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

  console.log('  ✓  Tabelle MySQL pronte');
}

// Se eseguito direttamente: node src/db/init.js
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
  initDatabase();
}

module.exports = { initDatabase, initMySQLDatabase };
