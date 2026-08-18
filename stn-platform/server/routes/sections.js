const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM sections ORDER BY name ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nom de section requis' });
  try {
    const info = db.prepare('INSERT INTO sections (name) VALUES (?)').run(name.trim());
    res.json({ id: info.lastInsertRowid, name: name.trim() });
  } catch (e) {
    res.status(400).json({ error: 'Cette section existe déjà' });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
