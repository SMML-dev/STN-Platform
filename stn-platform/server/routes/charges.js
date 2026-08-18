const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { department } = req.query;
  if (department) {
    const rows = db.prepare('SELECT * FROM charges_fixes WHERE department = ? ORDER BY id DESC').all(department);
    res.json(rows);
  } else {
    const rows = db.prepare('SELECT * FROM charges_fixes ORDER BY id DESC').all();
    res.json(rows);
  }
});

router.post('/', (req, res) => {
  const { department, charge_name, quantite, prix_previsionnel, fournisseur, delai_livraison, etat } = req.body;
  const info = db.prepare('INSERT INTO charges_fixes (department, charge_name, quantite, prix_previsionnel, fournisseur, delai_livraison, etat) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(department, charge_name, quantite || 0, prix_previsionnel || 0, fournisseur || '', delai_livraison || '', etat || 'en attente');
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { department, charge_name, quantite, prix_previsionnel, fournisseur, delai_livraison, etat } = req.body;
  db.prepare('UPDATE charges_fixes SET department = ?, charge_name = ?, quantite = ?, prix_previsionnel = ?, fournisseur = ?, delai_livraison = ?, etat = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(department, charge_name, quantite || 0, prix_previsionnel || 0, fournisseur || '', delai_livraison || '', etat || 'en attente', req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM charges_fixes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
