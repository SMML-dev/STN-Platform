const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { designation, scope } = req.query;
  let query = `
    SELECT p.* FROM price_history p
    INNER JOIN (
      SELECT designation, supplier_name, MAX(recorded_date) as max_date
      FROM price_history GROUP BY designation, supplier_name
    ) latest ON p.designation = latest.designation AND p.supplier_name = latest.supplier_name AND p.recorded_date = latest.max_date
  `;
  const params = [];
  const conditions = [];
  if (designation) { conditions.push('p.designation = ?'); params.push(designation); }
  if (scope) { conditions.push('p.scope = ?'); params.push(scope); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY p.designation, p.price ASC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.get('/compare', (req, res) => {
  const { designation } = req.query;
  if (!designation) {
    const products = db.prepare('SELECT DISTINCT designation FROM price_history ORDER BY designation').all();
    const result = products.map(p => {
      const prices = db.prepare(`
        SELECT p.* FROM price_history p
        INNER JOIN (
          SELECT supplier_name, MAX(recorded_date) as max_date
          FROM price_history WHERE designation = ?
          GROUP BY supplier_name
        ) latest ON p.supplier_name = latest.supplier_name AND p.recorded_date = latest.max_date
        WHERE p.designation = ?
        ORDER BY p.price ASC
      `).all(p.designation, p.designation);
      return buildComparison(p.designation, prices);
    });
    return res.json(result);
  }
  const prices = db.prepare(`
    SELECT p.* FROM price_history p
    INNER JOIN (
      SELECT supplier_name, MAX(recorded_date) as max_date
      FROM price_history WHERE designation = ?
      GROUP BY supplier_name
    ) latest ON p.supplier_name = latest.supplier_name AND p.recorded_date = latest.max_date
    WHERE p.designation = ?
    ORDER BY p.price ASC
  `).all(designation, designation);
  res.json(buildComparison(designation, prices));
});

function buildComparison(designation, prices) {
  if (!prices.length) return { designation, prices: [], bestPrice: null, worstPrice: null, avgPrice: 0, potentialSavings: 0, savingsPercent: 0, supplierCount: 0 };
  const best = prices[0];
  const worst = prices[prices.length - 1];
  const avg = prices.reduce((s, p) => s + p.price, 0) / prices.length;
  const savings = worst.price - best.price;
  const savingsPercent = worst.price > 0 ? (savings / worst.price) * 100 : 0;
  return {
    designation,
    prices: prices.map((p, i) => ({ ...p, is_best: i === 0, is_worst: i === prices.length - 1 })),
    bestPrice: best,
    worstPrice: worst,
    avgPrice: Math.round(avg),
    potentialSavings: savings,
    savingsPercent: Math.round(savingsPercent * 100) / 100,
    supplierCount: prices.length
  };
}

router.post('/', (req, res) => {
  const { designation, supplier_name, scope, price, currency, market_url, product_url, recorded_date } = req.body;
  const info = db.prepare('INSERT INTO price_history (designation, supplier_name, scope, price, currency, market_url, product_url, recorded_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(designation, supplier_name, scope || 'national', price || 0, currency || 'FCFA', market_url || '', product_url || '', recorded_date || new Date().toISOString().split('T')[0]);
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { designation, supplier_name, scope, price, currency, market_url, product_url, recorded_date } = req.body;
  db.prepare('UPDATE price_history SET designation = ?, supplier_name = ?, scope = ?, price = ?, currency = ?, market_url = ?, product_url = ?, recorded_date = ? WHERE id = ?')
    .run(designation, supplier_name, scope || 'national', price || 0, currency || 'FCFA', market_url || '', product_url || '', recorded_date, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM price_history WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/designations', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT designation FROM price_history ORDER BY designation').all();
  res.json(rows.map(r => r.designation));
});

module.exports = router;
