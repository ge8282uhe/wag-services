const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase, initMySQLDatabase } = require('./src/db/init');
const { useMySQL, testMySQLConnection, dbConfig } = require('./src/config/database');
const authRoutes = require('./src/routes/auth');
const quotesRoutes = require('./src/routes/quotes');
const usersRoutes = require('./src/routes/users');
const statsRoutes = require('./src/routes/stats');
const portfolioRoutes = require('./src/routes/portfolio');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Static files (public/) ──────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ──────────────────────────────────────
app.use('/api/login', authRoutes.login);
app.use('/api/register', authRoutes.register);
app.use('/api/quotes', quotesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/portfolio', portfolioRoutes);

// ─── Health check ────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { getDb } = require('./src/config/database');
    const db = getDb();
    await db.get('SELECT 1');
    res.json({
      ok: true,
      db: 'connected',
      dbTarget: useMySQL
        ? { type: 'mysql', host: dbConfig.host || '127.0.0.1', database: dbConfig.database || null }
        : { type: 'sqlite', path: path.join(__dirname, 'data', 'database.sqlite') },
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Debug: verifica presenza env (non espone valori sensibili)
app.get('/api/env-check', (req, res) => {
  res.json({
    ok: true,
    useMySQL,
    dbConfig: {
      host: !!dbConfig.host,
      user: !!dbConfig.user,
      password: !!dbConfig.password,
      database: !!dbConfig.database,
    },
    rawEnv: {
      DB_HOST: !!process.env.DB_HOST,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_NAME: !!process.env.DB_NAME,
      MYSQL_HOST: !!process.env.MYSQL_HOST,
      MYSQL_USER: !!process.env.MYSQL_USER,
      MYSQL_PASSWORD: !!process.env.MYSQL_PASSWORD,
      MYSQL_DATABASE: !!process.env.MYSQL_DATABASE,
      DATABASE_HOST: !!process.env.DATABASE_HOST,
      DATABASE_USER: !!process.env.DATABASE_USER,
      DATABASE_PASSWORD: !!process.env.DATABASE_PASSWORD,
      DATABASE_NAME: !!process.env.DATABASE_NAME,
    }
  });
});

// ─── Error handler globale ─────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Errore interno del server' });
});

// ─── Avvio server ────────────────────────────────────
async function start() {
  try {
    if (useMySQL) {
      console.log(`\n  🗄️  Connessione a MySQL (${dbConfig.host || '127.0.0.1'})...`);
      const test = await testMySQLConnection();
      if (!test.ok) {
        console.error(`  ❌ MySQL connection FAILED: ${test.error}`);
        console.error(`     Host:     ${dbConfig.host || '127.0.0.1'}`);
        console.error(`     User:     ${dbConfig.user || 'N/A'}`);
        console.error(`     Database: ${dbConfig.database || 'N/A'}`);
        console.error(`     Code:     ${test.code || 'N/A'}`);
        process.exit(1);
      }
      console.log('  ✓  MySQL connesso');
      await initMySQLDatabase();
    } else {
      initDatabase();
    }

    app.listen(PORT, () => {
      console.log(`\n  🚀 WAG Services server attivo`);
      console.log(`  ➜ Local:   http://localhost:${PORT}`);
      console.log(`  ➜ API:     http://localhost:${PORT}/api`);
      if (useMySQL) {
        console.log(`  🗄️  DB:     MySQL (${dbConfig.host || '127.0.0.1'}) → ${dbConfig.database || ''}\n`);
      } else {
        console.log(`  🗄️  DB:     SQLite (locale)\n`);
      }
    });
  } catch (err) {
    console.error('\n  ❌ Errore avvio server:', err.message);
    process.exit(1);
  }
}

start();
