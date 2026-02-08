const express = require('express');
const { getDb } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();

    const userRow = await db.get('SELECT COUNT(*) as count FROM users');
    const totalUsers = userRow ? Number(userRow.count) : 0;

    const statusRows = await db.all(
      'SELECT status, COUNT(*) as count FROM quotes GROUP BY status'
    );

    const quoteCounts = { PENDING: 0, REVIEWING: 0, ACCEPTED: 0, REJECTED: 0 };
    let totalQuotes = 0;

    for (const row of statusRows) {
      quoteCounts[row.status] = Number(row.count);
      totalQuotes += Number(row.count);
    }

    const portfolioRow = await db.get('SELECT COUNT(*) as count FROM portfolio_items');
    const portfolioItems = portfolioRow ? Number(portfolioRow.count) : 0;

    const recentQuotes = await db.all(`
      SELECT q.*, u.name as user_name, u.email as user_email
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
      LIMIT 5
    `);

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
