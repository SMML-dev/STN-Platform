const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT s.*, f.name AS family_name FROM stocks s LEFT JOIN families f ON s.family_id = f.id ORDER BY s.id DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { matiere, quantite, prix, disponibilite, family_id } = req.body;
  const familyId = family_id ? parseInt(family_id) : null;
  const info = db.prepare('INSERT INTO stocks (matiere, quantite, prix, disponibilite, family_id) VALUES (?, ?, ?, ?, ?)')
    .run(matiere, quantite || 0, prix || 0, disponibilite || 'indisponible', familyId);
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { matiere, quantite, prix, disponibilite, family_id } = req.body;
  const familyId = family_id ? parseInt(family_id) : null;
  db.prepare('UPDATE stocks SET matiere = ?, quantite = ?, prix = ?, disponibilite = ?, family_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(matiere, quantite || 0, prix || 0, disponibilite || 'indisponible', familyId, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM stocks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
