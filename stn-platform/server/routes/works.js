const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { department } = req.query;
  if (department) {
    const rows = db.prepare('SELECT * FROM travaux_reparations WHERE department = ? ORDER BY id DESC').all(department);
    res.json(rows);
  } else {
    const rows = db.prepare('SELECT * FROM travaux_reparations ORDER BY id DESC').all();
    res.json(rows);
  }
});

router.post('/', (req, res) => {
  const { department, domaine, fournisseur, etat } = req.body;
  const info = db.prepare('INSERT INTO travaux_reparations (department, domaine, fournisseur, etat) VALUES (?, ?, ?, ?)')
    .run(department, domaine, fournisseur || '', etat || 'en attente');
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { department, domaine, fournisseur, etat } = req.body;
  db.prepare('UPDATE travaux_reparations SET department = ?, domaine = ?, fournisseur = ?, etat = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(department, domaine, fournisseur || '', etat || 'en attente', req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM travaux_reparations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
