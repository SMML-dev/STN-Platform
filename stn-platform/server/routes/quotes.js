const express = require('express');
const router = express.Router();
const db = require('../db');

function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const count = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE quote_number LIKE ?").get(`DEV-${year}-%`).c;
  const num = String(count + 1).padStart(3, '0');
  return `DEV-${year}-${num}`;
}

router.get('/next-number', (req, res) => {
  res.json({ number: generateQuoteNumber() });
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM quotes ORDER BY quote_date DESC').all();
  const result = rows.map(q => {
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(q.id);
    const total = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0);
    return { ...q, items, total };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const q = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!q) return res.status(404).json({ error: 'Devis introuvable' });
  const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(q.id);
  const total = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0);
  res.json({ ...q, items, total });
});

router.post('/', (req, res) => {
  const { quote_number, client_name, client_address, quote_date, valid_until, status, notes, items } = req.body;
  const finalNumber = quote_number && quote_number.trim() ? quote_number : generateQuoteNumber();
  const insertQuote = db.prepare('INSERT INTO quotes (quote_number, client_name, client_address, quote_date, valid_until, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO quote_items (quote_id, designation, quantite, prix_unitaire) VALUES (?, ?, ?, ?)');

  const txn = db.transaction(() => {
    const info = insertQuote.run(finalNumber, client_name, client_address || '', quote_date, valid_until || '', status || 'en attente', notes || '');
    const quoteId = info.lastInsertRowid;
    (items || []).forEach(item => {
      insertItem.run(quoteId, item.designation, item.quantite || 1, item.prix_unitaire || 0);
    });
    return quoteId;
  });

  const id = txn();
  res.json({ id });
});

router.put('/:id', (req, res) => {
  const { quote_number, client_name, client_address, quote_date, valid_until, status, notes, items } = req.body;
  const updateQuote = db.prepare('UPDATE quotes SET quote_number = ?, client_name = ?, client_address = ?, quote_date = ?, valid_until = ?, status = ?, notes = ? WHERE id = ?');
  const deleteItems = db.prepare('DELETE FROM quote_items WHERE quote_id = ?');
  const insertItem = db.prepare('INSERT INTO quote_items (quote_id, designation, quantite, prix_unitaire) VALUES (?, ?, ?, ?)');

  const txn = db.transaction(() => {
    updateQuote.run(quote_number, client_name, client_address || '', quote_date, valid_until || '', status || 'en attente', notes || '', req.params.id);
    deleteItems.run(req.params.id);
    (items || []).forEach(item => {
      insertItem.run(req.params.id, item.designation, item.quantite || 1, item.prix_unitaire || 0);
    });
  });

  txn();
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
