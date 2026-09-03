const db = require('./db');

/**
 * Enregistre une action dans le journal d'audit
 * @param {object} req - Objet requête Express (optionnel)
 * @param {object} logData - Détails de l'action à tracer
 */
function logAudit(req, { action, entity_type, entity_id = null, description, user = null, ip = null }) {
  try {
    const currentUser = user || req?.user;
    const userId = currentUser ? currentUser.id : null;
    const username = currentUser ? (currentUser.display_name ? `${currentUser.display_name} (${currentUser.username})` : currentUser.username) : 'Système';
    const userRole = currentUser ? currentUser.role : 'admin';

    let ipAddress = ip;
    if (!ipAddress && req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
      if (ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.replace('::ffff:', '');
      }
    }

    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, username, user_role, action, entity_type, entity_id, description, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `);

    stmt.run(
      userId,
      username,
      userRole || 'employe',
      action ? action.toUpperCase() : 'ACTION',
      entity_type || 'Général',
      entity_id ? String(entity_id) : null,
      description || '',
      ipAddress || '127.0.0.1'
    );
  } catch (err) {
    console.error("Erreur lors de l'enregistrement du log d'audit:", err.message);
  }
}

module.exports = { logAudit };
