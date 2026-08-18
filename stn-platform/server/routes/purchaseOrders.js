const express = require('express');
const router = express.Router();
const db = require('../db');

function generateOrderNumber() {
  const count = db.prepare("SELECT COUNT(*) as c FROM purchase_orders").get().c;
  return String(count + 1).padStart(3, '0');
}

router.get('/next-number', (req, res) => {
  res.json({ number: generateOrderNumber() });
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM purchase_orders ORDER BY order_date DESC, id DESC').all();
  const result = rows.map(o => {
    const items = db.prepare('SELECT * FROM purchase_order_items WHERE order_id = ?').all(o.id);
    const subtotal = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0);
    const tva = o.tva_applicable ? subtotal * 0.18 : 0;
    const total = subtotal + tva;
    return { ...o, items, subtotal, tva, total };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Bon de commande introuvable' });
  const items = db.prepare('SELECT * FROM purchase_order_items WHERE order_id = ?').all(o.id);
  const subtotal = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0);
  const tva = o.tva_applicable ? subtotal * 0.18 : 0;
  const total = subtotal + tva;
  res.json({ ...o, items, subtotal, tva, total });
});

router.post('/', (req, res) => {
  const { order_number, order_date, supplier, section, tva_applicable, notes, items, premier_acompte, acompte_restant, acompte_final, signature } = req.body;
  const finalNumber = order_number && order_number.trim() ? order_number : generateOrderNumber();
  const insertOrder = db.prepare('INSERT INTO purchase_orders (order_number, order_date, supplier, section, tva_applicable, notes, premier_acompte, acompte_restant, acompte_final, signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO purchase_order_items (order_id, designation, quantite, unite, prix_unitaire) VALUES (?, ?, ?, ?, ?)');

  const a = (v) => (v === '' || v === undefined || v === null ? 0 : parseFloat(v));

  const txn = db.transaction(() => {
    const info = insertOrder.run(finalNumber, order_date, supplier, section || '', tva_applicable ? 1 : 0, notes || '', a(premier_acompte), a(acompte_restant), a(acompte_final), signature || '');
    const orderId = info.lastInsertRowid;
    (items || []).forEach(item => {
      insertItem.run(orderId, item.designation, item.quantite || 1, item.unite || '', item.prix_unitaire || 0);
    });
    return orderId;
  });

  const id = txn();
  res.json({ id });
});

router.put('/:id', (req, res) => {
  const { order_number, order_date, supplier, section, tva_applicable, notes, items, premier_acompte, acompte_restant, acompte_final, signature } = req.body;
  const updateOrder = db.prepare('UPDATE purchase_orders SET order_number = ?, order_date = ?, supplier = ?, section = ?, tva_applicable = ?, notes = ?, premier_acompte = ?, acompte_restant = ?, acompte_final = ?, signature = ? WHERE id = ?');
  const deleteItems = db.prepare('DELETE FROM purchase_order_items WHERE order_id = ?');
  const insertItem = db.prepare('INSERT INTO purchase_order_items (order_id, designation, quantite, unite, prix_unitaire) VALUES (?, ?, ?, ?, ?)');

  const a = (v) => (v === '' || v === undefined || v === null ? 0 : parseFloat(v));

  const txn = db.transaction(() => {
    updateOrder.run(order_number, order_date, supplier, section || '', tva_applicable ? 1 : 0, notes || '', a(premier_acompte), a(acompte_restant), a(acompte_final), signature || '', req.params.id);
    deleteItems.run(req.params.id);
    (items || []).forEach(item => {
      insertItem.run(req.params.id, item.designation, item.quantite || 1, item.unite || '', item.prix_unitaire || 0);
    });
  });

  txn();
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
