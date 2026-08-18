const express = require('express');
const router = express.Router();
const db = require('../db');

function invoiceTotal(invoiceId) {
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId);
  return items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0);
}

function totalPaid(invoiceId) {
  const row = db.prepare('SELECT COALESCE(SUM(montant), 0) as total FROM payments WHERE invoice_id = ?').get(invoiceId);
  return row.total;
}

function updateInvoiceStatus(invoiceId) {
  const total = invoiceTotal(invoiceId);
  const paid = totalPaid(invoiceId);
  let status;
  if (paid <= 0) status = 'en attente';
  else if (paid >= total && total > 0) status = 'payée';
  else status = 'partiellement payée';
  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, invoiceId);
  return { total, paid, solde: total - paid, status };
}

router.get('/invoice/:invoiceId', (req, res) => {
  const invoiceId = req.params.invoiceId;
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  if (!inv) return res.status(404).json({ error: 'Facture introuvable' });
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC').all(invoiceId);
  const total = invoiceTotal(invoiceId);
  const paid = totalPaid(invoiceId);
  res.json({ payments, total, paid, solde: total - paid });
});

router.post('/', (req, res) => {
  const { invoice_id, montant, mode, payment_date, reference, notes } = req.body;
  if (!invoice_id || !montant || montant <= 0) {
    return res.status(400).json({ error: 'Facture et montant valide requis' });
  }
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
  if (!inv) return res.status(404).json({ error: 'Facture introuvable' });

  const info = db.prepare('INSERT INTO payments (invoice_id, montant, mode, payment_date, reference, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(invoice_id, montant, mode || 'espèces', payment_date || new Date().toISOString().split('T')[0], reference || '', notes || '');

  const summary = updateInvoiceStatus(invoice_id);
  res.json({ id: info.lastInsertRowid, ...summary });
});

router.delete('/:id', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Paiement introuvable' });
  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  const summary = updateInvoiceStatus(payment.invoice_id);
  res.json({ success: true, ...summary });
});

module.exports = router;
