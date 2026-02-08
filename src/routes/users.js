const express = require('express');
const { getDb, getSqlNow } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const users = await db.all(
      'SELECT id, name, email, role, banned, created_at FROM users ORDER BY created_at DESC'
    );

    users.forEach(u => { u.banned = !!u.banned; });

    res.json({ users });
  } catch (err) {
    console.error('GET users error:', err);
    res.status(500).json({ error: 'Errore recupero utenti' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { id, banned, role } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID utente mancante' });
    }

    const db = getDb();
    const updates = [];
    const params = [];

    if (banned !== undefined) {
      updates.push('banned = ?');
      params.push(banned ? 1 : 0);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }

    const now = getSqlNow();
    updates.push(`updated_at = ${now}`);
    params.push(id);

    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Utente aggiornato' });
  } catch (err) {
    console.error('PUT users error:', err);
    res.status(500).json({ error: 'Errore aggiornamento' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const id = req.query.id || (req.body && req.body.id);

    if (!id) {
      return res.status(400).json({ error: 'ID utente mancante' });
    }

    const db = getDb();
    await db.run('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'Utente eliminato' });
  } catch (err) {
    console.error('DELETE users error:', err);
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

module.exports = router;
