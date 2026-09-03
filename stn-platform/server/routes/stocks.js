const express = require('express');
const router = express.Router();
const db = require('../db');
const { logAudit } = require('../auditLogger');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT s.*, f.name AS family_name FROM stocks s LEFT JOIN families f ON s.family_id = f.id ORDER BY s.id DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { matiere, quantite, prix, disponibilite, family_id } = req.body;
  const familyId = family_id ? parseInt(family_id) : null;
  const info = db.prepare('INSERT INTO stocks (matiere, quantite, prix, disponibilite, family_id) VALUES (?, ?, ?, ?, ?)')
    .run(matiere, quantite || 0, prix || 0, disponibilite || 'indisponible', familyId);

  logAudit(req, {
    action: 'CRÉATION',
    entity_type: 'Stock',
    entity_id: info.lastInsertRowid,
    description: `Ajout de l'article en stock: "${matiere}" (Quantité: ${quantite || 0}, Prix: ${prix || 0} FCFA)`
  });

  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { matiere, quantite, prix, disponibilite, family_id } = req.body;
  const familyId = family_id ? parseInt(family_id) : null;
  db.prepare('UPDATE stocks SET matiere = ?, quantite = ?, prix = ?, disponibilite = ?, family_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(matiere, quantite || 0, prix || 0, disponibilite || 'indisponible', familyId, req.params.id);

  logAudit(req, {
    action: 'MODIFICATION',
    entity_type: 'Stock',
    entity_id: req.params.id,
    description: `Mise à jour de l'article de stock #${req.params.id}: "${matiere}" (Quantité: ${quantite || 0}, Dispo: ${disponibilite})`
  });

  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const item = db.prepare('SELECT matiere FROM stocks WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM stocks WHERE id = ?').run(req.params.id);

  logAudit(req, {
    action: 'SUPPRESSION',
    entity_type: 'Stock',
    entity_id: req.params.id,
    description: `Suppression de l'article de stock: "${item ? item.matiere : req.params.id}"`
  });

  res.json({ success: true });
});

module.exports = router;
