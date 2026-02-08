// Deploy test: 2026-02-08 - MySQL only, no SQLite
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initMySQLDatabase } = require('./src/db/init');
const { testMySQLConnection, dbConfig } = require('./src/config/database');
const authRoutes = require('./src/routes/auth');
const quotesRoutes = require('./src/routes/quotes');
const usersRoutes = require('./src/routes/users');
const statsRoutes = require('./src/routes/stats');
const portfolioRoutes = require('./src/routes/portfolio');

const app = express();
const PORT = process.env.PORT || 3000;

let mysqlConnected = false;

// Middleware
app.use(cors());
app.use(express.json());

// Static files (public/)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/login', authRoutes.login);
app.use('/api/register', authRoutes.register);
app.use('/api/quotes', quotesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { getDb } = require('./src/config/database');
    const db = getDb();
    await db.get('SELECT 1');
    res.json({
      ok: true,
      db: 'connected',
      type: 'mysql',
      host: dbConfig.host,
      database: dbConfig.database,
    });
  } catch (err) {
    console.error('Health check error:', err.message);
    res.status(500).json({
      ok: false,
      db: 'disconnected',
      type: 'mysql',
      error: err.message,
      host: dbConfig.host,
      database: dbConfig.database,
    });
  }
});

// Debug env check
app.get('/api/env-check', (req, res) => {
  res.json({
    ok: true,
    mysqlConnected,
    dbConfig: {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      passwordSet: !!dbConfig.password,
    },
    env: {
      DB_HOST: !!process.env.DB_HOST,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_NAME: !!process.env.DB_NAME,
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Errore interno del server' });
});

// Avvio server
async function start() {
  console.log('\n  Tentativo connessione MySQL (' + dbConfig.host + ')...');

  const test = await testMySQLConnection();

  if (test.ok) {
    console.log('  MySQL connesso' + (test.host ? ' (host: ' + test.host + ')' : ''));
    mysqlConnected = true;

    try {
      await initMySQLDatabase();
    } catch (initErr) {
      console.error('  MySQL init tabelle fallito:', initErr.message);
    }
  } else {
    console.error('  ERRORE: MySQL non disponibile - ' + test.error + ' (code: ' + (test.code || 'N/A') + ')');
    console.error('  Il server partira ma le API daranno errore finche MySQL non si connette.');
  }

  app.listen(PORT, () => {
    console.log('\n  WAG Services server attivo');
    console.log('  Local:   http://localhost:' + PORT);
    console.log('  DB:      MySQL (' + dbConfig.host + ') -> ' + dbConfig.database);
    if (!mysqlConnected) {
      console.log('  ATTENZIONE: MySQL NON connesso! Le API non funzioneranno.\n');
    } else {
      console.log('');
    }
  });
}

start();
