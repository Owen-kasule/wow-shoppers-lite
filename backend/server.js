const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const dns = require('dns');

dotenv.config();

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error('Missing DATABASE_URL. Create backend/.env from backend/.env.example');
  process.exit(1);
}

const databaseSsl = process.env.DATABASE_SSL;
const useSsl =
  databaseSsl === 'true' ||
  DATABASE_URL.includes('supabase.co') ||
  DATABASE_URL.includes('pooler.supabase.com');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(useSsl
    ? {
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {})
});

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

app.get('/api/orders', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM orders');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, customer_name, status, total, created_at, updated_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      data: result.rows.map((row) => ({
        orderId: row.id,
        customerName: row.customer_name,
        status: row.status,
        total: parseFloat(row.total),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', async (req, res, next) => {
  try {
    const { customerName, customerPhone, deliveryMethod, deliveryAddress, paymentMethod, items } =
      req.body;

    // Validation
    const errors = [];
    if (!customerName || customerName.trim().length < 2) {
      errors.push('customerName must be at least 2 characters');
    }
    if (!customerPhone || customerPhone.trim().length < 7) {
      errors.push('customerPhone must be at least 7 characters');
    }
    if (!deliveryMethod || !['delivery', 'pickup'].includes(deliveryMethod)) {
      errors.push('deliveryMethod must be delivery or pickup');
    }
    if (deliveryMethod === 'delivery') {
      if (!deliveryAddress || deliveryAddress.trim().length < 5) {
        errors.push('deliveryAddress required (5+ chars) when deliveryMethod is delivery');
      }
    }
    if (!Array.isArray(items) || items.length === 0) {
      errors.push('items must be a non-empty array');
    } else {
      items.forEach((item, idx) => {
        if (!item.productId) errors.push(`items[${idx}].productId is required`);
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          errors.push(`items[${idx}].quantity must be integer >= 1`);
        }
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('; ') });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch product details and validate
      const productIds = items.map((i) => i.productId);
      const productResult = await client.query(
        'SELECT id, name, price FROM products WHERE id = ANY($1::uuid[])',
        [productIds]
      );
      const productMap = new Map(productResult.rows.map((p) => [p.id, p]));

      const orderItems = [];
      let total = 0;
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const unitPrice = parseFloat(product.price);
        const lineTotal = unitPrice * item.quantity;
        total += lineTotal;
        orderItems.push({
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          unitPrice,
          lineTotal
        });
      }

      const orderResult = await client.query(
        `INSERT INTO orders (customer_name, customer_phone, delivery_method, delivery_address, payment_method, total)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, status, created_at`,
        [
          customerName.trim(),
          customerPhone.trim(),
          deliveryMethod,
          deliveryMethod === 'delivery' ? deliveryAddress.trim() : null,
          paymentMethod || 'cash_on_delivery',
          total
        ]
      );

      const order = orderResult.rows[0];

      for (const item of orderItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [order.id, item.productId, item.quantity, item.unitPrice]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        orderId: order.id,
        status: order.status,
        total,
        items: orderItems,
        createdAt: order.created_at
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      'SELECT id, customer_name, customer_phone, delivery_method, delivery_address, payment_method, status, total, created_at FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.product_id, p.name, oi.quantity, oi.unit_price
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.created_at ASC`,
      [orderId]
    );

    const items = itemsResult.rows.map((row) => ({
      productId: row.product_id,
      name: row.name,
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price),
      lineTotal: parseFloat(row.unit_price) * row.quantity
    }));

    res.json({
      orderId: order.id,
      status: order.status,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryMethod: order.delivery_method,
      deliveryAddress: order.delivery_address,
      paymentMethod: order.payment_method,
      items,
      total: parseFloat(order.total),
      createdAt: order.created_at
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/orders/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['placed', 'accepted', 'packed', 'dispatched', 'delivered'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status, updated_at',
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: result.rows[0].id,
      status: result.rows[0].status,
      updatedAt: result.rows[0].updated_at
    });
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
