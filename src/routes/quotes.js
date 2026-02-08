const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

const router = express.Router();

// ─── GET - Lista preventivi ──────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const userId = req.query.user_id;
    const limit = parseInt(req.query.limit) || 50;

    let sql = `
      SELECT q.*, u.name as user_name, u.email as user_email
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
    `;

    const params = [];

    if (userId) {
      sql += ' WHERE q.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY q.created_at DESC LIMIT ?';
    params.push(limit);

    const quotes = db.prepare(sql).all(...params);
    res.json({ quotes });
  } catch (err) {
    console.error('GET quotes error:', err);
    res.status(500).json({ error: 'Errore recupero preventivi' });
  }
});

// ─── POST - Crea nuovo preventivo ────────────────────
router.post('/', (req, res) => {
  try {
    const { user_id, project_type, budget_range, description, deadline, attachments } = req.body;

    if (!user_id || !project_type || !description) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();
    const id = 'quote_' + uuidv4().replace(/-/g, '').substring(0, 16);

    db.prepare(`
      INSERT INTO quotes (id, user_id, project_type, budget_range, description, deadline, attachments, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(id, user_id, project_type, budget_range || '', description, deadline || '', attachments || '');

    res.json({ message: 'Preventivo creato', id });
  } catch (err) {
    console.error('POST quotes error:', err);
    res.status(500).json({ error: 'Errore creazione preventivo' });
  }
});

// ─── PUT - Aggiorna stato preventivo (admin) ─────────
router.put('/', (req, res) => {
  try {
    const { id, status, admin_notes } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();
    db.prepare(`
      UPDATE quotes SET status = ?, admin_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, admin_notes || '', id);

    res.json({ message: 'Preventivo aggiornato' });
  } catch (err) {
    console.error('PUT quotes error:', err);
    res.status(500).json({ error: 'Errore aggiornamento' });
  }
});

// ─── DELETE - Elimina preventivo ─────────────────────
router.delete('/', (req, res) => {
  try {
    // Supporta sia query param che body
    const id = req.query.id || (req.body && req.body.id);

    if (!id) {
      return res.status(400).json({ error: 'ID mancante' });
    }

    const db = getDb();
    db.prepare('DELETE FROM quotes WHERE id = ?').run(id);

    res.json({ message: 'Preventivo eliminato' });
  } catch (err) {
    console.error('DELETE quotes error:', err);
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

module.exports = router;
