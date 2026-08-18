const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const totalPurchases = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(quantite), 0) as total_quantite, COALESCE(SUM(quantite * cout_prev_unitaire), 0) as total_prev, COALESCE(SUM(quantite * cout_reel_unitaire), 0) as total_reel, COALESCE(SUM(acompte), 0) as total_acompte FROM purchases').get();
  const totalPurchaseOrders = db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get();
  const purchaseOrderTotals = db.prepare(`
    SELECT
      COALESCE(SUM(i.quantite * i.prix_unitaire), 0) as total_ht,
      COALESCE(SUM(CASE WHEN po.tva_applicable = 1 THEN i.quantite * i.prix_unitaire * 1.18 ELSE i.quantite * i.prix_unitaire END), 0) as total_ttc
    FROM purchase_orders po
    LEFT JOIN purchase_order_items i ON i.order_id = po.id
  `).get();
  totalPurchaseOrders.total_ht = purchaseOrderTotals.total_ht;
  totalPurchaseOrders.total_ttc = purchaseOrderTotals.total_ttc;

  const totalSuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  const totalStocks = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(quantite), 0) as total_quantite FROM stocks').get();

  const purchasesByEtat = db.prepare("SELECT etat, COUNT(*) as count FROM purchases GROUP BY etat").all();
  const purchaseOrdersBySection = db.prepare("SELECT section, COUNT(*) as count FROM purchase_orders WHERE section != '' GROUP BY section").all();

  const totalCharges = db.prepare("SELECT COALESCE(SUM(quantite * prix_previsionnel), 0) as total FROM charges_fixes").get();
  const chargesByDept = db.prepare("SELECT department, COUNT(*) as count, COALESCE(SUM(quantite * prix_previsionnel), 0) as total FROM charges_fixes GROUP BY department").all();

  const totalOrders = db.prepare("SELECT COALESCE(SUM(quantite * prix), 0) as total FROM commandes_prevoir").get();
  const ordersByDept = db.prepare("SELECT department, COUNT(*) as count, COALESCE(SUM(quantite * prix), 0) as total FROM commandes_prevoir GROUP BY department").all();

  const totalStockValue = db.prepare("SELECT COALESCE(SUM(quantite * prix), 0) as total FROM stocks").get();

  const worksByDept = db.prepare("SELECT department, COUNT(*) as count FROM travaux_reparations GROUP BY department").all();

  const recentPurchases = db.prepare('SELECT * FROM purchases ORDER BY created_at DESC LIMIT 5').all();
  const recentPurchaseOrders = db.prepare('SELECT * FROM purchase_orders ORDER BY order_date DESC, id DESC LIMIT 5').all().map(po => {
    const items = db.prepare('SELECT quantite, prix_unitaire FROM purchase_order_items WHERE order_id = ?').all(po.id);
    const subtotal = items.reduce((s, i) => s + (i.quantite * i.prix_unitaire), 0);
    const total = po.tva_applicable ? subtotal * 1.18 : subtotal;
    return { ...po, total, nb_items: items.length };
  });

  const stockAlerts = db.prepare(`
    SELECT s.id, s.matiere, s.quantite,
      COALESCE(sa.threshold, 5) as threshold
    FROM stocks s
    LEFT JOIN stock_alerts sa ON sa.stock_id = s.id
    WHERE s.quantite <= COALESCE(sa.threshold, 5)
  `).all();

  const totalInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
  const totalQuotes = db.prepare('SELECT COUNT(*) as count FROM quotes').get();

  res.json({
    totalPurchases,
    totalPurchaseOrders,
    totalSuppliers,
    totalStocks,
    totalCharges,
    totalOrders,
    totalStockValue,
    purchasesByEtat,
    purchaseOrdersBySection,
    chargesByDept,
    ordersByDept,
    worksByDept,
    recentPurchases,
    recentPurchaseOrders,
    stockAlerts,
    totalInvoices,
    totalQuotes
  });
});

module.exports = router;
