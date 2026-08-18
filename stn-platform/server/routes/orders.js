const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { department } = req.query;
  if (department) {
    const rows = db.prepare('SELECT * FROM commandes_prevoir WHERE department = ? ORDER BY id DESC').all(department);
    res.json(rows);
  } else {
    const rows = db.prepare('SELECT * FROM commandes_prevoir ORDER BY id DESC').all();
    res.json(rows);
  }
});

router.post('/', (req, res) => {
  const { department, article, quantite, prix, delai_livraison, etat } = req.body;
  const info = db.prepare('INSERT INTO commandes_prevoir (department, article, quantite, prix, delai_livraison, etat) VALUES (?, ?, ?, ?, ?, ?)')
    .run(department, article, quantite || 0, prix || 0, delai_livraison || '', etat || 'en attente');
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { department, article, quantite, prix, delai_livraison, etat } = req.body;
  db.prepare('UPDATE commandes_prevoir SET department = ?, article = ?, quantite = ?, prix = ?, delai_livraison = ?, etat = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(department, article, quantite || 0, prix || 0, delai_livraison || '', etat || 'en attente', req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM commandes_prevoir WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
