const express = require('express');
const router = express.Router();
const db = require('../db');
const { logAudit } = require('../auditLogger');

router.get('/', (req, res) => {
  const families = db.prepare('SELECT * FROM families ORDER BY name').all();
  res.json(families);
});

router.get('/:id', (req, res) => {
  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(req.params.id);
  if (!family) return res.status(404).json({ error: 'Famille non trouvée' });
  res.json(family);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom de famille requis' });
  try {
    const info = db.prepare('INSERT INTO families (name) VALUES (?)').run(name);

    logAudit(req, {
      action: 'CRÉATION',
      entity_type: "Famille d'Articles",
      entity_id: info.lastInsertRowid,
      description: `Création de la famille d'articles: "${name}"`
    });

    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Cette famille existe déjà' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom de famille requis' });
  try {
    db.prepare('UPDATE families SET name = ? WHERE id = ?').run(name, req.params.id);

    logAudit(req, {
      action: 'MODIFICATION',
      entity_type: "Famille d'Articles",
      entity_id: req.params.id,
      description: `Modification de la famille d'articles #${req.params.id} vers "${name}"`
    });

    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Cette famille existe déjà' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM purchases WHERE family_id = ?').get(req.params.id);
  if (count.count > 0) {
    return res.status(400).json({ error: 'Cette famille est utilisée par des achats' });
  }
  const fam = db.prepare('SELECT name FROM families WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM families WHERE id = ?').run(req.params.id);

  logAudit(req, {
    action: 'SUPPRESSION',
    entity_type: "Famille d'Articles",
    entity_id: req.params.id,
    description: `Suppression de la famille d'articles: "${fam ? fam.name : req.params.id}"`
  });

  res.json({ success: true });
});

module.exports = router;
