# Wow Shoppers Lite — Sprint 1-4 (Supermarket X pilot)

A lightweight e-commerce platform built for Supermarket X, demonstrating complete online shopping functionality with customer-facing product browsing, cart management, checkout, order tracking, and admin order management.

## Project Overview

Wow Shoppers Lite is a full-stack web application that enables:
- **Customers**: Browse products, filter by category, add to cart, checkout, and track orders
- **Admins**: View all orders, manage order status through the fulfillment lifecycle

## Tech Stack

- **Database**: PostgreSQL (Supabase) with Session Pooler, SSL-enabled
- **Backend**: Node.js 18+, Express, `pg`, `dotenv`, `cors`
- **Frontend**: React 18, Vite, native Fetch API
- **Data Persistence**: PostgreSQL for orders/products, localStorage for cart

## Features

### Customer Features (Sprint 1-2)
- Browse products with search and category filtering
- View product availability (in stock / out of stock)
- Add products to cart with localStorage persistence
- Update cart quantities and remove items
- Checkout with customer details, delivery, and payment options
- Order confirmation with unique order ID
- Order tracking page with real-time status updates

### Admin Features (Sprint 3)
- Admin dashboard at `/admin/orders` with paginated order list (20 per page)
- View detailed order information including customer details and items
- Update order status through fulfillment lifecycle (placed → accepted → packed → dispatched → delivered)
- Success feedback on status updates
- Automatic `updated_at` timestamp on all order changes

### Backend Enhancements (Sprint 4)
- Standardized API response format across all endpoints
- Robust field-level validation with structured error messages
- Consistent error handling with detailed error codes
- Environment configuration templates for easy setup
- Comprehensive documentation for API usage and testing

## Repo structure

```
/
  backend/
  frontend/
  README.md
  DB_CONNECTION.md  (for teammates)
```

## Prerequisites

- Node.js 18+
- A Supabase Postgres project

## Database setup (Supabase)

1. In Supabase, open your project → **Connect** → **Session pooler** and copy the Postgres connection string (URI).
2. Create `backend/.env` from `backend/.env.example` and set:
   - `DATABASE_URL` to your Supabase Session Pooler connection string
   - `DATABASE_SSL=true` (auto-detected for Supabase URLs)
   - Important: URL-encode special characters in password (`+` → `%2B`)

```bash
cd backend
npm install
cp .env.example .env

npm run db:migrate
npm run db:seed

npm run dev
```

Backend runs on `http://localhost:3000`.

### API routes

**Health Check:**
- `GET /health` → `{ ok: true }`

**Products & Categories:**
- `GET /api/categories` → `{ categories: [...], count: n }`
- `GET /api/products` → `{ products: [...], count: n }`
  - Query params:
    - `search` (case-insensitive match on product name)
    - `categoryId` (filter by category UUID)
    - `inStock` (`true`/`false`)

**Orders (Sprint 2-4):**
- `POST /api/orders` → `{ order: {...} }` — Create new order
  - Body: `{ customer_name, customer_email, customer_phone, delivery_address, delivery_option, payment_method, items: [{ product_id, quantity }] }`
  - Validates: all required fields, email format, phone format, product existence, stock availability
  - Returns structured validation errors on failure: `{ error: "VALIDATION_ERROR", message: "...", details: { field: "error message" } }`
  
- `GET /api/orders` → `{ orders: [...], count: n, page: n, limit: n, totalPages: n }` — List all orders (pagination: `?page=1&limit=20`)

- `GET /api/orders/:orderId` → `{ order: {...} }` — Get full order details including items
  - Returns 404 if order not found: `{ error: "NOT_FOUND", message: "Order not found" }`

- `PATCH /api/orders/:orderId/status` → `{ order: {...} }` — Update order status
  - Body: `{ status: "placed" | "accepted" | "packed" | "dispatched" | "delivered" }`
  - Validates status value and order existence
  - Updates `updated_at` timestamp automatically

**Error Responses:**
All errors follow a consistent format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": { /* optional field-level details */ }
}
```

Common error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`

CORS is enabled for `http://localhost:5173`.

## Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173` and calls the backend using `VITE_API_URL`.

## Run both (one command)

After you have configured the env files and migrated/seeded the database:

```bash
npm install
npm run install:all
npm run db:migrate
npm run db:seed
npm run dev
```

This starts:

- Backend on `http://localhost:3000`
- Frontend on `http://localhost:5173`

To verify migration success: `npm run db:check`

## Testing Sprint 3

### Customer Flow:
1) Browse products at `http://localhost:5173`
2) Click "Add to Cart" on in-stock products
3) Navigate to Cart (top nav) and adjust quantities
4) Click "Proceed to Checkout"
5) Fill customer details, choose delivery/payment, and submit
6) View order confirmation with order ID
7) Click "Track Order" to see order details and current status

### Admin Flow:
1) Navigate to "Admin" in the top navigation
2) View all orders in the system (paginated, 20 per page)
3) Click "View Details" on any order to see full order information
4) Use "Update Order Status" buttons to change order status
5) See success confirmation after status update
6) Navigate back to Admin Orders to see updated status in the list

### Testing Order Status Updates:
Test the complete order lifecycle:
- **placed**: Initial order status (automatic)
- **accepted**: Admin accepts the order
- **packed**: Order is being prepared
- **dispatched**: Order is out for delivery
- **delivered**: Order completed

## API Testing (Sprint 4)

Test backend endpoints directly with curl:

**Health check:**
```bash
curl http://localhost:3000/health
```

**Get categories:**
```bash
curl http://localhost:3000/api/categories
```

**Get products (with filters):**
```bash
# All products
curl http://localhost:3000/api/products

# Search products
curl "http://localhost:3000/api/products?search=rice"

# Filter by category (replace UUID)
curl "http://localhost:3000/api/products?categoryId=YOUR_CATEGORY_UUID"

# In-stock only
curl "http://localhost:3000/api/products?inStock=true"
```

**Create order:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "0712345678",
    "delivery_address": "123 Main St, Kampala",
    "delivery_option": "home_delivery",
    "payment_method": "cash_on_delivery",
    "items": [
      {"product_id": "YOUR_PRODUCT_UUID", "quantity": 2}
    ]
  }'
```

**Get all orders:**
```bash
# First page (20 orders)
curl http://localhost:3000/api/orders

# Specific page
curl "http://localhost:3000/api/orders?page=2&limit=20"
```

**Get order details:**
```bash
curl http://localhost:3000/api/orders/YOUR_ORDER_UUID
```

**Update order status:**
```bash
curl -X PATCH http://localhost:3000/api/orders/YOUR_ORDER_UUID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted"}'
```

**Test validation errors:**
```bash
# Missing required fields
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid email
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John",
    "customer_email": "invalid-email",
    "customer_phone": "0712345678",
    "delivery_address": "123 Main St",
    "delivery_option": "home_delivery",
    "payment_method": "cash_on_delivery",
    "items": []
  }'

# Invalid order status
curl -X PATCH http://localhost:3000/api/orders/YOUR_ORDER_UUID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "invalid_status"}'
```

## Known Limitations

- No authentication or authorization (admin routes are publicly accessible)
- Cart data stored in browser localStorage (not persistent across devices)
- No payment gateway integration (simulated payment methods only)
- No email notifications for order status changes
- Stock tracking is read-only (no automatic inventory deduction)
- Single admin interface (no role-based access control)

## Team Quotes

- Owen: "Progress beats perfection."
- Daniel: "Small steps, shipped daily."
