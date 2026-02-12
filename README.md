# Wow Shoppers Lite — Sprint 1+2+3 (Supermarket X pilot)

Sprint 1+2+3 delivers complete e-commerce with admin functionality:
- PostgreSQL database (Supabase) with schema + seed data
- Express API (Node 18+, `pg`, `dotenv`, `cors`)
- React UI (Vite) with product browsing, cart, checkout, order tracking, and admin order management

## Features

**Sprint 1:**
- Browse products with search and category filter
- View product availability (in stock / out of stock)

**Sprint 2:**
- Add products to cart (localStorage)
- Manage cart (update quantities, remove items)
- Checkout with customer details and delivery/payment options
- Order confirmation with order ID
- Order tracking with status updates (placed → accepted → packed → dispatched → delivered)

**Sprint 3:**
- Admin order management UI at `/admin/orders`
- View all orders with pagination (20 orders per page)
- Order status tracking for customers
- Admin can update order status from order detail page
- Success feedback on status updates
- Automatic `updated_at` timestamp on status changes

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

1) In Supabase, open your project → **Connect** → **Session pooler** and copy the Postgres connection string (URI).
2) Create `backend/.env` from `backend/.env.example` and set:
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

#### Products & Categories
- `GET /health` → `{ ok: true }`
- `GET /api/categories` → `{ data, total }`
- `GET /api/products` → `{ data, total }`
  - Query params:
    - `search` (case-insensitive match on product name)
    - `categoryId` (filter by category UUID)
    - `inStock` (`true`/`false`)

#### Orders (Sprint 2+3)
- `POST /api/orders` → Create new order
- `GET /api/orders` → List all orders (pagination: `?page=1&limit=20`)
- `GET /api/orders/:orderId` → Get full order details
- `PATCH /api/orders/:orderId/status` → Update order status

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

## Team Quotes

- Owen: "Progress beats perfection."
- Daniel: "Small steps, shipped daily."
