const express = require('express');
const router = express.Router();
const db = require('../db');

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = db.prepare("SELECT COUNT(*) as c FROM invoices WHERE invoice_number LIKE ?").get(`FAC-${year}-%`).c;
  const num = String(count + 1).padStart(3, '0');
  return `FAC-${year}-${num}`;
}

router.get('/next-number', (req, res) => {
  res.json({ number: generateInvoiceNumber() });
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM invoices ORDER BY invoice_date DESC').all();
  const result = rows.map(inv => {
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);
    const total = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0);
    return { ...inv, items, total };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Facture introuvable' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);
  const total = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0);
  res.json({ ...inv, items, total });
});

router.post('/', (req, res) => {
  const { invoice_number, client_name, client_address, invoice_date, due_date, status, notes, items } = req.body;
  const finalNumber = invoice_number && invoice_number.trim() ? invoice_number : generateInvoiceNumber();
  const insertInvoice = db.prepare('INSERT INTO invoices (invoice_number, client_name, client_address, invoice_date, due_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO invoice_items (invoice_id, designation, quantite, prix_unitaire) VALUES (?, ?, ?, ?)');

  const txn = db.transaction(() => {
    const info = insertInvoice.run(finalNumber, client_name, client_address || '', invoice_date, due_date || '', status || 'en attente', notes || '');
    const invoiceId = info.lastInsertRowid;
    (items || []).forEach(item => {
      insertItem.run(invoiceId, item.designation, item.quantite || 1, item.prix_unitaire || 0);
    });
    return invoiceId;
  });

  const id = txn();
  res.json({ id });
});

router.put('/:id', (req, res) => {
  const { invoice_number, client_name, client_address, invoice_date, due_date, status, notes, items } = req.body;
  const updateInvoice = db.prepare('UPDATE invoices SET invoice_number = ?, client_name = ?, client_address = ?, invoice_date = ?, due_date = ?, status = ?, notes = ? WHERE id = ?');
  const deleteItems = db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?');
  const insertItem = db.prepare('INSERT INTO invoice_items (invoice_id, designation, quantite, prix_unitaire) VALUES (?, ?, ?, ?)');

  const txn = db.transaction(() => {
    updateInvoice.run(invoice_number, client_name, client_address || '', invoice_date, due_date || '', status || 'en attente', notes || '', req.params.id);
    deleteItems.run(req.params.id);
    (items || []).forEach(item => {
      insertItem.run(req.params.id, item.designation, item.quantite || 1, item.prix_unitaire || 0);
    });
  });

  txn();
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
