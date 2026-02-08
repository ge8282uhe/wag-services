const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

const login = express.Router();

login.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

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

const register = express.Router();

register.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

    const db = getDb();

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = 'user_' + uuidv4().replace(/-/g, '').substring(0, 16);

    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'USER')`,
      [id, name, email, passwordHash]
    );

    res.json({ message: 'Account creato con successo' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Errore database: ' + err.message });
  }
});

module.exports = { login, register };
