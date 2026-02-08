const express = require('express');
const { getDb } = require('../config/database');

const router = express.Router();

// ─── GET - Lista utenti ──────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(
      'SELECT id, name, email, role, banned, created_at FROM users ORDER BY created_at DESC'
    ).all();

    // Converti banned da 0/1 a boolean
    users.forEach(u => { u.banned = !!u.banned; });

    res.json({ users });
  } catch (err) {
    console.error('GET users error:', err);
    res.status(500).json({ error: 'Errore recupero utenti' });
  }
});

// ─── PUT - Aggiorna utente (ban/unban, ruolo) ────────
router.put('/', (req, res) => {
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

    updates.push("updated_at = datetime('now')");
    params.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ message: 'Utente aggiornato' });
  } catch (err) {
    console.error('PUT users error:', err);
    res.status(500).json({ error: 'Errore aggiornamento' });
  }
});

// ─── DELETE - Elimina utente ─────────────────────────
router.delete('/', (req, res) => {
  try {
    // Supporta sia query param che body
    const id = req.query.id || (req.body && req.body.id);

    if (!id) {
      return res.status(400).json({ error: 'ID utente mancante' });
    }

    const db = getDb();
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.json({ message: 'Utente eliminato' });
  } catch (err) {
    console.error('DELETE users error:', err);
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

module.exports = router;
