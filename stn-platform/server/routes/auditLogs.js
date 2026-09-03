const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../authMiddleware');
const { toXLSX, sendXLSX } = require('./export');

// Seuls les administrateurs ont accès au journal d'audit
router.use(requireAdmin);

// Récupérer les statistiques du journal d'audit
router.get('/stats', (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();
    const todayRow = db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `).get();

    // Utilisateurs actifs : comptes non supprimés, non désactivés (is_active = 1) et s'étant déjà connectés/actifs sur la plateforme (indéfiniment)
    const activeUsersRow = db.prepare(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      INNER JOIN audit_logs a ON a.user_id = u.id
      WHERE u.is_active = 1
    `).get();

    const lastLogRow = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY id DESC
      LIMIT 1
    `).get();

    const actionStats = db.prepare(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
      LIMIT 6
    `).all();

    res.json({
      total: totalRow.count,
      today: todayRow.count,
      activeUsers: activeUsersRow.count,
      lastLog: lastLogRow || null,
      actionStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer les logs avec filtres et pagination
router.get('/', (req, res) => {
  try {
    const { action, entity_type, username, search, date_from, date_to } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (action && action !== 'TOUS') {
      whereClause += ' AND action = ?';
      params.push(action);
    }

    if (entity_type && entity_type !== 'TOUS') {
      whereClause += ' AND entity_type = ?';
      params.push(entity_type);
    }

    if (username && username !== 'TOUS') {
      whereClause += ' AND username LIKE ?';
      params.push(`%${username}%`);
    }

    if (date_from) {
      whereClause += ' AND created_at >= ?';
      params.push(`${date_from} 00:00:00`);
    }

    if (date_to) {
      whereClause += ' AND created_at <= ?';
      params.push(`${date_to} 23:59:59`);
    }

    if (search && search.trim()) {
      whereClause += ' AND (description LIKE ? OR entity_id LIKE ? OR username LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
    const total = db.prepare(countQuery).get(...params).total;

    const dataQuery = `
      SELECT id, user_id, username, user_role, action, entity_type, entity_id, description, ip_address, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    const logs = db.prepare(dataQuery).all(...params, limit, offset);

    // Listes distinctes pour les filtres du frontend
    const availableActions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action ASC').all().map(r => r.action);
    const availableEntities = db.prepare('SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type ASC').all().map(r => r.entity_type);
    const availableUsers = db.prepare('SELECT DISTINCT username FROM audit_logs ORDER BY username ASC').all().map(r => r.username);

    res.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      filterOptions: {
        actions: availableActions,
        entities: availableEntities,
        users: availableUsers
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exporter les logs au format Excel (.xlsx)
router.get('/export', (req, res) => {
  try {
    const { action, entity_type, username, search, date_from, date_to } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (action && action !== 'TOUS') {
      whereClause += ' AND action = ?';
      params.push(action);
    }
    if (entity_type && entity_type !== 'TOUS') {
      whereClause += ' AND entity_type = ?';
      params.push(entity_type);
    }
    if (username && username !== 'TOUS') {
      whereClause += ' AND username LIKE ?';
      params.push(`%${username}%`);
    }
    if (date_from) {
      whereClause += ' AND created_at >= ?';
      params.push(`${date_from} 00:00:00`);
    }
    if (date_to) {
      whereClause += ' AND created_at <= ?';
      params.push(`${date_to} 23:59:59`);
    }
    if (search && search.trim()) {
      whereClause += ' AND (description LIKE ? OR entity_id LIKE ? OR username LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const logs = db.prepare(`
      SELECT id, created_at, username, user_role, action, entity_type, entity_id, description, ip_address
      FROM audit_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT 2000
    `).all(...params);

    const headers = ['id', 'created_at', 'username', 'user_role', 'action', 'entity_type', 'entity_id', 'description', 'ip_address'];
    const labels = ['ID', 'Date & Heure Précise', 'Utilisateur', 'Rôle', 'Action', 'Module / Entité', 'Réf. Entité', 'Description Complète', 'Adresse IP'];

    const buffer = toXLSX('Journal Audit STN', headers, logs, labels);
    sendXLSX(res, `journal_audit_stn_${new Date().toISOString().slice(0, 10)}.xlsx`, buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
