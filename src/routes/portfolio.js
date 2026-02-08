const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

const router = express.Router();

// ─── GET - Lista portfolio items ─────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM portfolio_items';

    if (req.query.featured !== undefined) {
      sql += ' WHERE featured = 1';
    }

    sql += ' ORDER BY created_at DESC';

    const items = db.prepare(sql).all();

    // Converti featured da 0/1 a boolean
    items.forEach(item => { item.featured = !!item.featured; });

    res.json(items);
  } catch (err) {
    console.error('GET portfolio error:', err);
    res.status(500).json({ error: 'Errore recupero portfolio' });
  }
});

// ─── POST - Crea portfolio item ──────────────────────
router.post('/', (req, res) => {
  try {
    const { title, description, image_url, project_url, category, featured } = req.body;

    if (!title || !description || !image_url || !category) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();
    const id = 'port_' + uuidv4().replace(/-/g, '').substring(0, 16);

    db.prepare(`
      INSERT INTO portfolio_items (id, title, description, image_url, project_url, category, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description, image_url, project_url || '', category, featured ? 1 : 0);

    res.json({ message: 'Portfolio item creato', id });
  } catch (err) {
    console.error('POST portfolio error:', err);
    res.status(500).json({ error: 'Errore creazione' });
  }
});

// ─── PUT - Aggiorna portfolio item ───────────────────
router.put('/', (req, res) => {
  try {
    const { id, title, description, image_url, project_url, category, featured } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID mancante' });
    }

    const db = getDb();
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
    if (project_url !== undefined) { updates.push('project_url = ?'); params.push(project_url); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (featured !== undefined) { updates.push('featured = ?'); params.push(featured ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    db.prepare(`UPDATE portfolio_items SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ message: 'Portfolio item aggiornato' });
  } catch (err) {
    console.error('PUT portfolio error:', err);
    res.status(500).json({ error: 'Errore aggiornamento' });
  }
});

// ─── DELETE - Elimina portfolio item ─────────────────
router.delete('/', (req, res) => {
  try {
    // Supporta sia query param che body
    const id = req.query.id || (req.body && req.body.id);

    if (!id) {
      return res.status(400).json({ error: 'ID mancante' });
    }

    const db = getDb();
    db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(id);

    res.json({ message: 'Portfolio item eliminato' });
  } catch (err) {
    console.error('DELETE portfolio error:', err);
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

module.exports = router;
