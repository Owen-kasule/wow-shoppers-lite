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

// Response helpers for consistency
function successResponse(data) {
  return data;
}

function errorResponse(error, message, details = null) {
  const response = { error, message };
  if (details) response.details = details;
  return response;
}

function validationErrorResponse(message, details) {
  return errorResponse('VALIDATION_ERROR', message, details);
}

function notFoundErrorResponse(resource) {
  return errorResponse('NOT_FOUND', `${resource} not found`);
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/categories', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, created_at FROM categories ORDER BY name ASC'
    );
    res.json({ categories: result.rows, count: result.rowCount });
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
      return res.status(400).json(
        validationErrorResponse('Invalid inStock parameter', { inStock: 'Must be true or false' })
      );
    }

    if (categoryId !== undefined && !isUuid(categoryId)) {
      return res.status(400).json(
        validationErrorResponse('Invalid categoryId parameter', { categoryId: 'Must be a valid UUID' })
      );
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
    res.json({ products: result.rows, count: result.rowCount });
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
      orders: result.rows.map((row) => ({
        orderId: row.id,
        customerName: row.customer_name,
        status: row.status,
        total: parseFloat(row.total),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      count: total,
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

    // Comprehensive validation with structured errors
    const validationErrors = {};
    
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      validationErrors.customerName = 'Must be at least 2 characters';
    }
    
    if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim().length < 7) {
      validationErrors.customerPhone = 'Must be at least 7 characters';
    }
    
    if (!deliveryMethod || !['delivery', 'pickup'].includes(deliveryMethod)) {
      validationErrors.deliveryMethod = 'Must be either "delivery" or "pickup"';
    }
    
    if (deliveryMethod === 'delivery') {
      if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 5) {
        validationErrors.deliveryAddress = 'Required when delivery method is "delivery" (min 5 characters)';
      }
    }
    
    if (paymentMethod && !['cash_on_delivery', 'mock'].includes(paymentMethod)) {
      validationErrors.paymentMethod = 'Must be either "cash_on_delivery" or "mock"';
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      validationErrors.items = 'Must be a non-empty array';
    } else {
      const itemErrors = [];
      items.forEach((item, idx) => {
        const itemError = {};
        if (!item.productId) {
          itemError.productId = 'Required';
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          itemError.quantity = 'Must be an integer >= 1';
        }
        if (Object.keys(itemError).length > 0) {
          itemErrors.push({ index: idx, errors: itemError });
        }
      });
      if (itemErrors.length > 0) {
        validationErrors.items = itemErrors;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json(
        validationErrorResponse('Order validation failed', validationErrors)
      );
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
          await client.query('ROLLBACK');
          return res.status(400).json(
            validationErrorResponse('Invalid product', { productId: item.productId, message: 'Product not found' })
          );
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
        order: {
          orderId: order.id,
          status: order.status,
          total,
          items: orderItems,
          createdAt: order.created_at
        }
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
      return res.status(404).json(notFoundErrorResponse('Order'));
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
      order: {
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
      }
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
      return res.status(400).json(
        validationErrorResponse('Invalid status', {
          status: `Must be one of: ${allowedStatuses.join(', ')}`
        })
      );
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status, updated_at',
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(notFoundErrorResponse('Order'));
    }

    res.json({
      order: {
        orderId: result.rows[0].id,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json(errorResponse('NOT_FOUND', 'Route not found'));
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('Server error:', error.message);
  // Don't expose internal error details in production
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
