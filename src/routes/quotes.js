const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, getSqlNow } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
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

    const quotes = await db.all(sql, params);
    res.json({ quotes });
  } catch (err) {
    console.error('GET quotes error:', err);
    res.status(500).json({ error: 'Errore recupero preventivi' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, project_type, budget_range, description, deadline, attachments } = req.body;

    if (!user_id || !project_type || !description) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();
    const id = 'quote_' + uuidv4().replace(/-/g, '').substring(0, 16);

    await db.run(
      `INSERT INTO quotes (id, user_id, project_type, budget_range, description, deadline, attachments, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [id, user_id, project_type, budget_range || '', description, deadline || '', attachments || '']
    );

    res.json({ message: 'Preventivo creato', id });
  } catch (err) {
    console.error('POST quotes error:', err);
    res.status(500).json({ error: 'Errore creazione preventivo' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { id, status, admin_notes } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();
    const now = getSqlNow();
    await db.run(
      `UPDATE quotes SET status = ?, admin_notes = ?, updated_at = ${now} WHERE id = ?`,
      [status, admin_notes || '', id]
    );

    res.json({ message: 'Preventivo aggiornato' });
  } catch (err) {
    console.error('PUT quotes error:', err);
    res.status(500).json({ error: 'Errore aggiornamento' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const id = req.query.id || (req.body && req.body.id);

    if (!id) {
      return res.status(400).json({ error: 'ID mancante' });
    }

    const db = getDb();
    await db.run('DELETE FROM quotes WHERE id = ?', [id]);

    res.json({ message: 'Preventivo eliminato' });
  } catch (err) {
    console.error('DELETE quotes error:', err);
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

module.exports = router;
