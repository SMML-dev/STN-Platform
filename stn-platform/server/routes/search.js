const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ results: [] });
  const like = `%${q}%`;

  const purchases = db.prepare(`SELECT id, order_number, supplier, order_date FROM purchase_orders WHERE order_number LIKE ? OR supplier LIKE ? LIMIT 10`).all(like, like)
    .map(p => ({ type: 'achat', id: p.id, title: p.order_number, subtitle: `${p.supplier} — ${p.order_date}`, page: 'purchase-orders' }));

  const stocks = db.prepare(`SELECT id, matiere, quantite, prix FROM stocks WHERE matiere LIKE ? OR observation LIKE ? LIMIT 10`).all(like, like)
    .map(s => ({ type: 'stock', id: s.id, title: s.matiere, subtitle: `Quantité: ${s.quantite} — Prix: ${s.prix} FCFA`, page: 'stocks' }));

  const suppliers = db.prepare(`SELECT id, name, contact FROM suppliers WHERE name LIKE ? OR contact LIKE ? OR commentaires LIKE ? LIMIT 10`).all(like, like, like)
    .map(s => ({ type: 'fournisseur', id: s.id, title: s.name, subtitle: s.contact || '', page: 'suppliers' }));

  res.json({ results: [...purchases, ...stocks, ...suppliers] });
});

module.exports = router;
