# Wow Shoppers Lite — Sprint 1 (Supermarket X pilot)

Sprint 1 delivers an end-to-end vertical slice:
- PostgreSQL database (schema + seed data)
- Express API (Node 18+, `pg`, `dotenv`, `cors`)
- React UI (Vite) to browse/search/filter products

## Repo structure

```
/
  backend/
  frontend/
  README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL running locally

Required DB connection string:

```
postgresql://wowadmin:wow123@127.0.0.1:5432/wow_shoppers_lite
```

## Database setup

Create the DB and user (skip if you already have them):

```bash
psql postgres -c "CREATE USER wowadmin WITH PASSWORD 'wow123';"
psql postgres -c "CREATE DATABASE wow_shoppers_lite OWNER wowadmin;"
```

## Backend (Express API)

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

- `GET /health` → `{ ok: true }`
- `GET /api/categories` → `{ data, total }`
- `GET /api/products` → `{ data, total }`
  - Query params:
    - `search` (case-insensitive match on product name)
    - `categoryId` (filter by category UUID)
    - `inStock` (`true`/`false`)

CORS is enabled for `http://localhost:5173`.

## Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173` and calls the backend using `VITE_API_URL`.
# Wow Shoppers Lite (Sprint 1)

Single-supermarket pilot for **Supermarket X**.

Sprint 1 delivers (end-to-end):
- PostgreSQL (seeded) + Express API + React UI
- Browse products, search by name, filter by category

Repo structure:
/
	backend/
	frontend/
	README.md

## Prerequisites
- Node.js 18+
- PostgreSQL running locally

Database connection string (required):
`postgresql://wowadmin:wow123@127.0.0.1:5432/wow_shoppers_lite`

## 1) Database setup (PostgreSQL)
Create the DB/user if you don’t already have them:

```bash
psql postgres -c "CREATE USER wowadmin WITH PASSWORD 'wow123';" 
psql postgres -c "CREATE DATABASE wow_shoppers_lite OWNER wowadmin;"
```

## 2) Backend setup (Express + pg)

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs on `http://localhost:3000`.

Endpoints:
- `GET /health` → `{ ok: true }`
- `GET /api/categories` → `{ data, total }`
- `GET /api/products` → `{ data, total }`
	- Query params:
		- `search` (case-insensitive match on name)
		- `categoryId` (uuid)
		- `inStock` (`true`/`false`)

## 3) Frontend setup (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173` and calls the backend using `VITE_API_URL`.

## Suggested commit (after verifying locally)

```bash
git add .
git commit -m "Sprint 1: Postgres + Express API + React products UI"
```
Wow Shoppers Lite is a single supermarket ecommerce MVP with clear structure and documentation, designed to be easily discoverable online and clearly understood by both people and modern search and AI systems.

## Team Quotes

- Owen: "Progress beats perfection."
- Daniel: "Small steps, shipped daily."
