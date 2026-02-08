const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./src/db/init');
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

// ─── Health check: test connessione DB (per capire errori in produzione) ─
app.get('/api/health', async (req, res) => {
  try {
    const { getDb } = require('./src/config/database');
    const db = getDb();
    await db.get('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Error handler globale ─────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Errore interno del server' });
});

// ─── Inizializza DB (solo SQLite; con MySQL usi database importato in phpMyAdmin) ─
const useMySQL = !!(process.env.DB_HOST || process.env.DB_NAME);
if (!useMySQL) {
  initDatabase();
}

app.listen(PORT, () => {
  console.log(`\n  🚀 WAG Services server attivo`);
  console.log(`  ➜ Local:   http://localhost:${PORT}`);
  console.log(`  ➜ API:     http://localhost:${PORT}/api\n`);
});
