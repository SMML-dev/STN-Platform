const express = require('express');
const router = express.Router();
const db = require('../db');

// Liste toutes les familles
router.get('/', (req, res) => {
  const families = db.prepare('SELECT * FROM families ORDER BY name').all();
  res.json(families);
});

// Récupère une famille par ID
router.get('/:id', (req, res) => {
  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(req.params.id);
  if (!family) return res.status(404).json({ error: 'Famille non trouvée' });
  res.json(family);
});

// Crée une nouvelle famille
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom de famille requis' });
  try {
    const info = db.prepare('INSERT INTO families (name) VALUES (?)').run(name);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Cette famille existe déjà' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Met à jour une famille
router.put('/:id', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom de famille requis' });
  try {
    db.prepare('UPDATE families SET name = ? WHERE id = ?').run(name, req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Cette famille existe déjà' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Supprime une famille
router.delete('/:id', (req, res) => {
  // Vérifier si des achats utilisent cette famille
  const count = db.prepare('SELECT COUNT(*) as count FROM purchases WHERE family_id = ?').get(req.params.id);
  if (count.count > 0) {
    return res.status(400).json({ error: 'Cette famille est utilisée par des achats' });
  }
  db.prepare('DELETE FROM families WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
