const express = require('express');
const router = express.Router();
const db = require('../db');

function generateOrderNumber() {
  const count = db.prepare("SELECT COUNT(*) as c FROM reception_orders").get().c;
  return String(count + 1).padStart(3, '0');
}

router.get('/next-number', (req, res) => {
  res.json({ number: generateOrderNumber() });
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM reception_orders ORDER BY order_date DESC, id DESC').all();
  const result = rows.map(o => {
    const items = db.prepare('SELECT * FROM reception_order_items WHERE order_id = ?').all(o.id);
    return { ...o, items };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM reception_orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Bon de réception introuvable' });
  const items = db.prepare('SELECT * FROM reception_order_items WHERE order_id = ?').all(o.id);
  res.json({ ...o, items });
});

router.post('/', (req, res) => {
  const { order_number, order_date, supplier, section, tva_applicable, notes, items, signature } = req.body;
  const finalNumber = order_number && order_number.trim() ? order_number : generateOrderNumber();
  const insertOrder = db.prepare('INSERT INTO reception_orders (order_number, order_date, supplier, section, tva_applicable, notes, signature) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO reception_order_items (order_id, designation, quantite, unite) VALUES (?, ?, ?, ?)');

  const txn = db.transaction(() => {
    const info = insertOrder.run(finalNumber, order_date, supplier, section || '', tva_applicable ? 1 : 0, notes || '', signature || '');
    const orderId = info.lastInsertRowid;
    (items || []).forEach(item => {
      insertItem.run(orderId, item.designation, item.quantite || 1, item.unite || '');
    });
    return orderId;
  });

  const id = txn();
  res.json({ id });
});

router.put('/:id', (req, res) => {
  const { order_number, order_date, supplier, section, tva_applicable, notes, items, signature } = req.body;
  const updateOrder = db.prepare('UPDATE reception_orders SET order_number = ?, order_date = ?, supplier = ?, section = ?, tva_applicable = ?, notes = ?, signature = ? WHERE id = ?');
  const deleteItems = db.prepare('DELETE FROM reception_order_items WHERE order_id = ?');
  const insertItem = db.prepare('INSERT INTO reception_order_items (order_id, designation, quantite, unite) VALUES (?, ?, ?, ?)');

  const txn = db.transaction(() => {
    updateOrder.run(order_number, order_date, supplier, section || '', tva_applicable ? 1 : 0, notes || '', signature || '', req.params.id);
    deleteItems.run(req.params.id);
    (items || []).forEach(item => {
      insertItem.run(req.params.id, item.designation, item.quantite || 1, item.unite || '');
    });
  });

  txn();
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM reception_orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
