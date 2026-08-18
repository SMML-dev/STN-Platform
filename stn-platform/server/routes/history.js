const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { entity_type, status, date_from, date_to, search } = req.query;
  let query = 'SELECT * FROM activity_history WHERE 1=1';
  const params = [];

  if (entity_type) { query += ' AND entity_type = ?'; params.push(entity_type); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (date_from) { query += ' AND created_at >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND created_at <= ?'; params.push(date_to + ' 23:59:59'); }
  if (search) { query += ' AND description LIKE ?'; params.push(`%${search}%`); }

  query += ' ORDER BY created_at DESC LIMIT 500';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

module.exports = router;
