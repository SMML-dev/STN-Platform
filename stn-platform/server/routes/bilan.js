const express = require('express');
const router = express.Router();
const db = require('../db');
const { toXLSX, sendXLSX } = require('./export');

router.get('/', (req, res) => {
  const { period, date_from, date_to } = req.query;

  let dateFilter = '';
  const params = [];

  if (date_from && date_to) {
    dateFilter = ' AND created_at >= ? AND created_at <= ?';
    params.push(date_from, date_to + ' 23:59:59');
  } else if (period) {
    const now = new Date();
    let from = new Date();
    switch (period) {
      case 'daily':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        from = new Date(now.getFullYear(), 0, 1);
        break;
    }
    dateFilter = ' AND created_at >= ?';
    params.push(from.toISOString());
  }

  const purchaseOrderParams = params.map(p => p);
  let poDateFilter = dateFilter.replace(/created_at/g, 'po.order_date');
  const purchaseOrders = db.prepare(`
    SELECT
      COUNT(DISTINCT po.id) as count,
      COALESCE(SUM(i.quantite * i.prix_unitaire), 0) as total_ht,
      COALESCE(SUM(CASE WHEN po.tva_applicable = 1 THEN i.quantite * i.prix_unitaire * 1.18 ELSE i.quantite * i.prix_unitaire END), 0) as total_ttc
    FROM purchase_orders po
    LEFT JOIN purchase_order_items i ON i.order_id = po.id
    WHERE 1=1${poDateFilter}
  `).get(...purchaseOrderParams);

  const chargesParams = params.map(p => p);
  let chargeDateFilter = dateFilter.replace(/created_at/g, 'created_at');
  const charges = db.prepare(`SELECT * FROM charges_fixes WHERE 1=1${chargeDateFilter}`).all(...chargesParams);
  const totalCharges = charges.reduce((s, c) => s + (c.quantite * c.prix_previsionnel), 0);

  const ordersParams = params.map(p => p);
  let orderDateFilter = dateFilter.replace(/created_at/g, 'created_at');
  const orders = db.prepare(`SELECT * FROM commandes_prevoir WHERE 1=1${orderDateFilter}`).all(...ordersParams);
  const totalOrders = orders.reduce((s, o) => s + (o.quantite * o.prix), 0);

  const stocks = db.prepare('SELECT * FROM stocks').all();
  const totalStockValue = stocks.reduce((s, st) => s + (st.quantite * st.prix), 0);

  res.json({
    period: period || 'all',
    purchaseOrders: {
      count: purchaseOrders.count,
      total_ht: purchaseOrders.total_ht,
      total_ttc: purchaseOrders.total_ttc
    },
    charges: {
      count: charges.length,
      total: totalCharges
    },
    orders: {
      count: orders.length,
      total: totalOrders
    },
    stockValue: totalStockValue,
    grandTotal: purchaseOrders.total_ttc + totalCharges + totalOrders
  });
});

router.get('/export', (req, res) => {
  const { period, date_from, date_to } = req.query;

  let dateFilter = '';
  const params = [];

  if (date_from && date_to) {
    dateFilter = ' AND created_at >= ? AND created_at <= ?';
    params.push(date_from, date_to + ' 23:59:59');
  } else if (period) {
    const now = new Date();
    let from = new Date();
    switch (period) {
      case 'daily': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'weekly': from = new Date(now); from.setDate(now.getDate() - 7); break;
      case 'monthly': from = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'yearly': from = new Date(now.getFullYear(), 0, 1); break;
    }
    dateFilter = ' AND created_at >= ?';
    params.push(from.toISOString());
  }

  const purchaseOrders = db.prepare(`
    SELECT
      COUNT(DISTINCT po.id) as count,
      COALESCE(SUM(i.quantite * i.prix_unitaire), 0) as total_ht,
      COALESCE(SUM(CASE WHEN po.tva_applicable = 1 THEN i.quantite * i.prix_unitaire * 1.18 ELSE i.quantite * i.prix_unitaire END), 0) as total_ttc
    FROM purchase_orders po
    LEFT JOIN purchase_order_items i ON i.order_id = po.id
    WHERE 1=1${dateFilter.replace(/created_at/g, 'po.order_date')}
  `).get(...params);

  const charges = db.prepare(`SELECT * FROM charges_fixes WHERE 1=1${dateFilter}`).all(...params);
  const orders = db.prepare(`SELECT * FROM commandes_prevoir WHERE 1=1${dateFilter}`).all(...params);
  const stocks = db.prepare('SELECT * FROM stocks').all();

  const periode = date_from && date_to ? `du ${date_from} au ${date_to}` : (period || 'tout');

  const totalCharges = charges.reduce((s, c) => s + (c.quantite * c.prix_previsionnel), 0);
  const totalOrders = orders.reduce((s, o) => s + (o.quantite * o.prix), 0);
  const totalStock = stocks.reduce((s, st) => s + (st.quantite * st.prix), 0);

  const rows = [
    { rubrique: 'BONS DE COMMANDE', detail: `${purchaseOrders.count} bon(s)`, montant: '' },
    { rubrique: '  Montant HT', detail: '', montant: purchaseOrders.total_ht },
    { rubrique: '  Montant TTC', detail: '', montant: purchaseOrders.total_ttc },
    { rubrique: 'CHARGES FIXES', detail: `${charges.length} charge(s)`, montant: totalCharges },
    { rubrique: 'COMMANDES À PRÉVOIR', detail: `${orders.length} commande(s)`, montant: totalOrders },
    { rubrique: 'VALEUR DU STOCK', detail: `${stocks.length} article(s)`, montant: totalStock },
    { rubrique: 'TOTAL GÉNÉRAL', detail: '', montant: purchaseOrders.total_ttc + totalCharges + totalOrders },
  ];

  const headers = ['rubrique', 'detail', 'montant'];
  const labels = [`Bilan STN (${periode})`, 'Détail', 'Montant (FCFA)'];
  const buffer = toXLSX('Bilan', headers, rows, labels);
  sendXLSX(res, `bilan_stn_${periode.replace(/\s+/g, '_')}.xlsx`, buffer);
});

module.exports = router;
