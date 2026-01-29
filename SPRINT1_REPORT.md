# W03 Activity: Sprint Commit and Retrospective (Sprint 1)

## 1) GitHub Commit URL (required)

- Commit URL: ****

How to generate it:

```bash
git add .
git commit -m "Sprint 1: Postgres + Express API + React products UI"
git push
```

Then open the commit on GitHub and copy the URL.

## 2) Task report (required)

At least one task completed this sprint:

- Implemented Postgres schema + seed data for Supermarket X pilot
  - Added `categories` and `products` tables, indexes, and `pgcrypto` extension.
  - Seeded 8 categories and ~30+ realistic Ugandan supermarket items with some out-of-stock.
- Built Express API
  - `GET /health`
  - `GET /api/categories` → `{ data, total }`
  - `GET /api/products` → `{ data, total }` with `search`, `categoryId`, `inStock`
  - Enabled CORS for `http://localhost:5173`
- Built React (Vite) UI
  - Products page with search input, category dropdown, product grid, and loading/error states.
  - Data fetched from backend using `VITE_API_URL`.

## 3) Retrospective: Well (required)

- Delivered an end-to-end vertical slice (DB → API → UI) with minimal scope and consistent `{ data, total }` response format.

## 4) Retrospective: Improve (required)

- Add a small test checklist (or basic automated checks) for API filters/search and seed reproducibility before finalizing the sprint.
