const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/categories', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nom de catégorie requis' });
  try {
    const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    db.prepare('UPDATE suppliers SET category_id = NULL WHERE category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.*, c.name as category_name FROM suppliers s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY s.id DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { name, contact, category_id, commentaires } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nom du fournisseur requis' });
  try {
    const info = db.prepare('INSERT INTO suppliers (name, contact, category_id, commentaires) VALUES (?, ?, ?, ?)')
      .run(name.trim(), contact || '', category_id || null, commentaires || '');
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, contact, category_id, commentaires } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nom du fournisseur requis' });
  try {
    db.prepare('UPDATE suppliers SET name = ?, contact = ?, category_id = ?, commentaires = ? WHERE id = ?')
      .run(name.trim(), contact || '', category_id || null, commentaires || '', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

