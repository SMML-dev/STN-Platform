const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SESSIONS = {};

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
  }
  const token = generateToken();
  SESSIONS[token] = { id: user.id, username: user.username, display_name: user.display_name, role: user.role };
  res.json({ token, user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role } });
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !SESSIONS[token]) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  res.json({ user: SESSIONS[token] });
});

router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) delete SESSIONS[token];
  res.json({ success: true });
});

router.post('/change-password', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !SESSIONS[token]) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(SESSIONS[token].id);
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  }
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);
  res.json({ success: true });
});

module.exports = router;
