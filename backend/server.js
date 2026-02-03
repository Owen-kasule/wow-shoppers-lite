const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { getPgConfig } = require('./db/pgConfig');

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
let pool;
try {
  pool = new Pool(getPgConfig());
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error.message || error);
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/categories', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, created_at FROM categories ORDER BY name ASC'
    );
    res.json({ data: result.rows, total: result.rowCount });
  } catch (error) {
    next(error);
  }
});

function isUuid(value) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    String(value)
  );
}

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

app.get('/api/products', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const inStock = parseBoolean(req.query.inStock);

    if (inStock === null) {
      return res.status(400).json({
        data: [],
        total: 0,
        error: 'Invalid inStock. Use true or false.'
      });
    }

    if (categoryId !== undefined && !isUuid(categoryId)) {
      return res.status(400).json({
        data: [],
        total: 0,
        error: 'Invalid categoryId. Must be a UUID.'
      });
    }

    const whereClauses = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`lower(p.name) LIKE lower($${params.length})`);
    }

    if (categoryId) {
      params.push(categoryId);
      whereClauses.push(`p.category_id = $${params.length}`);
    }

    if (inStock === true) {
      whereClauses.push('(p.in_stock = true AND p.stock_qty > 0)');
    }
    if (inStock === false) {
      whereClauses.push('(p.in_stock = false OR p.stock_qty <= 0)');
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.description,
        p.price,
        p.in_stock,
        p.stock_qty,
        p.image_url,
        p.created_at
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${whereSql}
      ORDER BY p.created_at DESC, p.name ASC
    `;

    const result = await pool.query(query, params);
    res.json({ data: result.rows, total: result.rowCount });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ data: [], total: 0, error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({ data: [], total: 0, error: 'Internal server error' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
