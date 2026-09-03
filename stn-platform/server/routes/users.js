const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAdmin } = require('../authMiddleware');
const { logAudit } = require('../auditLogger');

// Toutes les routes utilisateurs nécessitent le rôle administrateur
router.use(requireAdmin);

// Lister tous les employés / utilisateurs
router.get('/', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, display_name, role, is_active, created_at
    FROM users
    ORDER BY id ASC
  `).all();
  res.json(users);
});

// Créer un nouvel employé
router.post('/', (req, res) => {
  const { username, display_name, password, role } = req.body;

  if (!username || !password || !display_name) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être renseignés' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: "L'identifiant doit comporter au moins 3 caractères" });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 4 caractères' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
  if (existing) {
    return res.status(400).json({ error: "Cet identifiant d'utilisateur existe déjà" });
  }

  const validRole = (role === 'admin') ? 'admin' : 'employe';
  const hashedPassword = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(`
    INSERT INTO users (username, display_name, password, role, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  const info = stmt.run(cleanUsername, display_name.trim(), hashedPassword, validRole);
  const newUserId = info.lastInsertRowid;

  logAudit(req, {
    action: 'CRÉATION',
    entity_type: 'Employé',
    entity_id: newUserId,
    description: `Création du compte employé "${display_name.trim()}" (Identifiant: ${cleanUsername}, Rôle: ${validRole})`
  });

  res.status(201).json({
    id: newUserId,
    username: cleanUsername,
    display_name: display_name.trim(),
    role: validRole,
    is_active: 1
  });
});

// Mettre à jour les informations d'un employé
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { display_name, role, is_active } = req.body;

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  // Protéger l'administrateur principal : aucun autre admin ne peut modifier son statut ou son rôle
  const isPrimaryAdmin = targetUser.username === 'admin';
  if (isPrimaryAdmin && req.user.id !== targetUser.id) {
    // Seul le compte lui-même peut modifier son propre affichage, mais le statut/rôle est protégé
    if (is_active !== undefined) {
      return res.status(403).json({ error: "Impossible de modifier le statut de l'administrateur principal. Ce compte est protégé." });
    }
    if (role !== undefined && role !== targetUser.role) {
      return res.status(403).json({ error: "Impossible de modifier le rôle de l'administrateur principal. Ce compte est protégé." });
    }
  }

  // Empêcher l'admin connecté de désactiver ou rétrograder son propre compte
  if (req.user.id === id) {
    if (is_active !== undefined && Number(is_active) === 0) {
      return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte administrateur' });
    }
    if (role && role !== 'admin') {
      return res.status(400).json({ error: 'Vous ne pouvez pas rétrograder votre propre rôle administrateur' });
    }
  }

  const newDisplayName = display_name !== undefined ? display_name.trim() : targetUser.display_name;
  const newRole = role !== undefined ? (role === 'admin' ? 'admin' : 'employe') : targetUser.role;
  const newActive = is_active !== undefined ? (is_active ? 1 : 0) : targetUser.is_active;

  db.prepare(`
    UPDATE users
    SET display_name = ?, role = ?, is_active = ?
    WHERE id = ?
  `).run(newDisplayName, newRole, newActive, id);

  logAudit(req, {
    action: 'MODIFICATION',
    entity_type: 'Employé',
    entity_id: id,
    description: `Mise à jour du compte "${targetUser.username}" (Nom: ${newDisplayName}, Rôle: ${newRole}, Statut: ${newActive ? 'Actif' : 'Inactif'})`
  });

  res.json({
    id,
    username: targetUser.username,
    display_name: newDisplayName,
    role: newRole,
    is_active: newActive
  });
});

// Réinitialiser le mot de passe d'un employé par l'admin
// Règle : les administrateurs (role='admin') ne peuvent changer leur mot de passe que dans leurs Paramètres personnels.
router.put('/:id/reset-password', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 4 caractères' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  // Bloquer la réinitialisation du mot de passe pour tout compte administrateur
  if (targetUser.role === 'admin') {
    return res.status(403).json({
      error: `Le mot de passe d'un compte administrateur ne peut pas être réinitialisé depuis ici. Les administrateurs doivent utiliser la section Paramètres pour changer leur mot de passe.`
    });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id);

  logAudit(req, {
    action: 'MODIFICATION',
    entity_type: 'Sécurité',
    entity_id: id,
    description: `Réinitialisation administrative du mot de passe pour l'employé "${targetUser.display_name || targetUser.username}"`
  });

  res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
});

// Supprimer un employé
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (req.user.id === id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  // Protéger l'administrateur principal contre toute suppression
  if (targetUser.username === 'admin') {
    return res.status(403).json({ error: "L'administrateur principal ne peut pas être supprimé. Ce compte est protégé par le système." });
  }

  // Supprimer les sessions associées
  try {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  } catch {}

  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  logAudit(req, {
    action: 'SUPPRESSION',
    entity_type: 'Employé',
    entity_id: id,
    description: `Suppression définitive du compte employé "${targetUser.display_name || targetUser.username}" (${targetUser.username})`
  });

  res.json({ success: true, message: 'Employé supprimé avec succès' });
});

module.exports = router;
