const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

// ─── LOGIN ───────────────────────────────────────────
const login = express.Router();

login.post('/', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Email o password non validi' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email o password non validi' });
    }

    res.json({
      message: 'Login success',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ─── REGISTER ────────────────────────────────────────
const register = express.Router();

register.post('/', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();

    // Controlla se l'email esiste già
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Genera ID unico
    const id = 'user_' + uuidv4().replace(/-/g, '').substring(0, 16);

    // Inserisci utente
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'USER')
    `).run(id, name, email, passwordHash);

    res.json({ message: 'Account creato con successo' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Errore database: ' + err.message });
  }
});

module.exports = { login, register };
