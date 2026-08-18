const express = require('express');
const router = express.Router();
const db = require('../db');

function getDefaultThreshold() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'default_stock_threshold'").get();
  return row ? parseInt(row.value) : 5;
}

router.get('/', (req, res) => {
  const defaultThreshold = getDefaultThreshold();
  const stocks = db.prepare('SELECT * FROM stocks').all();
  const result = stocks.map(s => {
    const alert = db.prepare('SELECT * FROM stock_alerts WHERE stock_id = ?').get(s.id);
    const threshold = alert ? alert.threshold : defaultThreshold;
    const isTriggered = s.quantite <= threshold;
    return {
      ...s,
      threshold,
      alert_triggered: isTriggered ? 1 : 0
    };
  }).filter(s => s.quantite <= s.threshold);

  res.json(result);
});

router.get('/all', (req, res) => {
  const defaultThreshold = getDefaultThreshold();
  const stocks = db.prepare('SELECT * FROM stocks').all();
  const result = stocks.map(s => {
    const alert = db.prepare('SELECT * FROM stock_alerts WHERE stock_id = ?').get(s.id);
    const threshold = alert ? alert.threshold : defaultThreshold;
    return {
      ...s,
      threshold,
      alert_triggered: s.quantite <= threshold ? 1 : 0
    };
  });
  res.json({ stocks: result, defaultThreshold });
});

router.get('/default-threshold', (req, res) => {
  res.json({ value: getDefaultThreshold() });
});

router.post('/default-threshold', (req, res) => {
  const { value } = req.body;
  db.prepare("INSERT INTO settings (key, value) VALUES ('default_stock_threshold', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
    .run(String(value), String(value));
  res.json({ success: true, value });
});

router.post('/threshold', (req, res) => {
  const { stock_id, threshold } = req.body;
  const existing = db.prepare('SELECT * FROM stock_alerts WHERE stock_id = ?').get(stock_id);
  if (existing) {
    db.prepare('UPDATE stock_alerts SET threshold = ? WHERE stock_id = ?').run(threshold, stock_id);
  } else {
    db.prepare('INSERT INTO stock_alerts (stock_id, threshold) VALUES (?, ?)').run(stock_id, threshold);
  }
  res.json({ success: true });
});

module.exports = router;
