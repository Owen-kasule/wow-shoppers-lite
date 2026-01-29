import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from './api.js';

export default function App() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingCategories(true);
    setError('');

    apiGet('/api/categories')
      .then((json) => {
        if (cancelled) return;
        setCategories(json.data || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Failed to load categories');
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const productParams = useMemo(() => {
    return {
      search: search.trim() || undefined,
      categoryId: categoryId || undefined
    };
  }, [search, categoryId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    setError('');

    const handle = setTimeout(() => {
      apiGet('/api/products', productParams)
        .then((json) => {
          if (cancelled) return;
          setProducts(json.data || []);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e.message || 'Failed to load products');
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingProducts(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [productParams]);

  return (
    <div className="page">
      <header className="header">
        <h1>Wow Shoppers Lite</h1>
        <p className="subtitle">Supermarket X (pilot)</p>
      </header>

      <section className="controls">
        <div className="control">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name..."
          />
        </div>

        <div className="control">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loadingCategories}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}

      <section className="results">
        <div className="resultsHeader">
          <h2>Products</h2>
          <div className="meta">
            {loadingProducts ? 'Loading…' : `${products.length} item(s)`}
          </div>
        </div>

        {loadingProducts ? (
          <div className="loading">Loading products…</div>
        ) : (
          <div className="grid">
            {products.map((p) => {
              const isInStock = Boolean(p.in_stock) && Number(p.stock_qty) > 0;
              const price = Number(p.price);
              return (
                <div key={p.id} className="card">
                  <div className="cardTop">
                    <div className="name">{p.name}</div>
                    <div className="price">UGX {Number.isFinite(price) ? price.toLocaleString() : p.price}</div>
                  </div>
                  <div className={isInStock ? 'stock in' : 'stock out'}>
                    {isInStock ? 'In stock' : 'Out of stock'}
                  </div>
                  <div className="category">{p.category_name}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
