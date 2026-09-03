const db = require('./db');

const SESSIONS = {};

function createSession(token, user) {
  SESSIONS[token] = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role
  };
  try {
    db.prepare('INSERT OR REPLACE INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);
  } catch (err) {
    console.error('Erreur sauvegarde session SQLite:', err.message);
  }
}

function destroySession(token) {
  if (token) {
    delete SESSIONS[token];
    try {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    } catch {}
  }
}

function getUserFromToken(token) {
  if (!token) return null;

  if (SESSIONS[token]) {
    return SESSIONS[token];
  }

  try {
    const row = db.prepare(`
      SELECT s.token, u.id, u.username, u.display_name, u.role, u.is_active
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token);

    if (row && row.is_active !== 0) {
      const user = {
        id: row.id,
        username: row.username,
        display_name: row.display_name,
        role: row.role
      };
      SESSIONS[token] = user;
      return user;
    }
  } catch (err) {
    console.error('Erreur récupération session:', err.message);
  }

  return null;
}

function extractUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const user = getUserFromToken(token);
    if (user) {
      req.user = user;
      req.token = token;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié ou session expirée' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const isAdm = req.user.role === 'admin' || req.user.username === 'admin' || req.user.role === 'manager';
  if (!isAdm) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
}

module.exports = {
  SESSIONS,
  createSession,
  destroySession,
  getUserFromToken,
  extractUser,
  requireAuth,
  requireAdmin
};
