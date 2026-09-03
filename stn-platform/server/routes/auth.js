const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createSession, destroySession, getUserFromToken } = require('../authMiddleware');
const { logAudit } = require('../auditLogger');

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
    logAudit(req, {
      action: 'CONNEXION_ÉCHOUÉE',
      entity_type: 'Sécurité',
      entity_id: username,
      description: `Tentative de connexion échouée pour l'identifiant "${username}"`,
      user: user ? { id: user.id, username: user.username, display_name: user.display_name, role: user.role } : { id: null, username, display_name: username, role: 'inconnu' }
    });
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
  }

  if (user.is_active === 0) {
    logAudit(req, {
      action: 'CONNEXION_REFUSÉE',
      entity_type: 'Sécurité',
      entity_id: username,
      description: `Connexion refusée : compte de "${user.display_name || username}" désactivé`,
      user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role }
    });
    return res.status(403).json({ error: 'Votre compte a été désactivé. Veuillez contacter un administrateur.' });
  }

  const token = generateToken();
  const sessionUser = { id: user.id, username: user.username, display_name: user.display_name, role: user.role };
  createSession(token, sessionUser);

  logAudit(req, {
    action: 'CONNEXION',
    entity_type: 'Sécurité',
    entity_id: user.id,
    description: `Connexion réussie de l'utilisateur ${user.display_name ? `${user.display_name} (${user.username})` : user.username} [${user.role}]`,
    user: sessionUser
  });

  res.json({ token, user: sessionUser });
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = getUserFromToken(token);
  if (!token || !user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  res.json({ user });
});

router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = getUserFromToken(token);
  if (user) {
    logAudit(req, {
      action: 'DÉCONNEXION',
      entity_type: 'Sécurité',
      entity_id: user.id,
      description: `Déconnexion de ${user.display_name ? `${user.display_name} (${user.username})` : user.username}`,
      user
    });
  }
  if (token) destroySession(token);
  res.json({ success: true });
});

router.post('/change-password', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = getUserFromToken(token);
  if (!token || !user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const { currentPassword, newPassword } = req.body;
  const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  if (!bcrypt.compareSync(currentPassword, dbUser.password)) {
    return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  }
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);

  logAudit(req, {
    action: 'MODIFICATION',
    entity_type: 'Sécurité',
    entity_id: user.id,
    description: `Modification du mot de passe pour ${user.display_name || user.username}`,
    user
  });

  res.json({ success: true });
});

module.exports = router;
