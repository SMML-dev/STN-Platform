const express = require('express');
const router = express.Router();
const db = require('../db');
const { toXLSX, sendXLSX } = require('./export');

router.get('/', (req, res) => {
  const rows = db.prepare(`SELECT p.*, f.name as family_name FROM purchases p LEFT JOIN families f ON p.family_id = f.id ORDER BY p.id DESC`).all();
  res.json(rows);
});

router.get('/export', (req, res) => {
  const rows = db.prepare(`SELECT p.*, f.name as family_name FROM purchases p LEFT JOIN families f ON p.family_id = f.id ORDER BY p.id DESC`).all();
  const enriched = rows.map(r => ({
    ...r,
    total_prev: r.quantite * r.cout_prev_unitaire,
    total_reel: r.quantite * r.cout_reel_unitaire,
    solde: (r.quantite * r.cout_reel_unitaire) - (r.acompte || 0)
  }));
  const headers = ['id', 'designation', 'family_name', 'quantite', 'cout_prev_unitaire', 'cout_reel_unitaire', 'total_prev', 'total_reel', 'acompte', 'solde', 'delai_livraison', 'etat', 'observation', 'created_at'];
  const labels = ['ID', 'Désignation', 'Famille', 'Quantité', 'Coût Prév. Unit.', 'Coût Réel Unit.', 'Total Prévisionnel', 'Total Réel', 'Acompte', 'Solde', 'Délai Livraison', 'État', 'Observation', 'Date Création'];
  const buffer = toXLSX('Achats', headers, enriched, labels);
  sendXLSX(res, 'achats_stn.xlsx', buffer);
});

router.post('/', (req, res) => {
  const { designation, quantite, cout_prev_unitaire, cout_reel_unitaire, acompte, delai_livraison, etat, observation, family_id } = req.body;
  const stmt = db.prepare(`INSERT INTO purchases (designation, quantite, cout_prev_unitaire, cout_reel_unitaire, acompte, delai_livraison, etat, observation, family_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(designation, quantite || 0, cout_prev_unitaire || 0, cout_reel_unitaire || 0, acompte || 0, delai_livraison || '', etat || 'en attente', observation || '', family_id || null);
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { designation, quantite, cout_prev_unitaire, cout_reel_unitaire, acompte, delai_livraison, etat, observation, family_id } = req.body;
  db.prepare(`UPDATE purchases SET designation = ?, quantite = ?, cout_prev_unitaire = ?, cout_reel_unitaire = ?, acompte = ?, delai_livraison = ?, etat = ?, observation = ?, family_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(designation, quantite || 0, cout_prev_unitaire || 0, cout_reel_unitaire || 0, acompte || 0, delai_livraison || '', etat || 'en attente', observation || '', family_id || null, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM purchases WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
