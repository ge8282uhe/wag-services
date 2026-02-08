const express = require('express');
const { getDb } = require('../config/database');

const router = express.Router();

// ─── GET - Statistiche admin ─────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();

    // Conta utenti
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    // Conta preventivi per stato
    const statusRows = db.prepare(
      'SELECT status, COUNT(*) as count FROM quotes GROUP BY status'
    ).all();

    const quoteCounts = { PENDING: 0, REVIEWING: 0, ACCEPTED: 0, REJECTED: 0 };
    let totalQuotes = 0;

    for (const row of statusRows) {
      quoteCounts[row.status] = row.count;
      totalQuotes += row.count;
    }

    // Conta portfolio items
    const portfolioItems = db.prepare('SELECT COUNT(*) as count FROM portfolio_items').get().count;

    // Ultimi preventivi con info utente
    const recentQuotes = db.prepare(`
      SELECT q.*, u.name as user_name, u.email as user_email
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
      LIMIT 5
    `).all();

    res.json({
      totalUsers,
      totalQuotes,
      pendingQuotes: quoteCounts.PENDING,
      reviewingQuotes: quoteCounts.REVIEWING,
      acceptedQuotes: quoteCounts.ACCEPTED,
      rejectedQuotes: quoteCounts.REJECTED,
      portfolioItems,
      recentQuotes
    });
  } catch (err) {
    console.error('GET stats error:', err);
    res.status(500).json({ error: 'Errore recupero statistiche' });
  }
});

module.exports = router;
