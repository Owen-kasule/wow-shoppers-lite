import React, { useEffect, useMemo, useState } from 'react';
import {
  apiGet,
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartTotal
} from './api.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function App() {
  const [route, setRoute] = useState('products');
  const [routeParams, setRouteParams] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [toast, setToast] = useState('');

  useEffect(() => {
    // set initial cart count
    const cart = getCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));

    // update cart count whenever cart is changed elsewhere
    const handler = (e) => {
      try {
        const newCart = e?.detail ?? getCart();
        setCartCount(newCart.reduce((sum, item) => sum + item.quantity, 0));
      } catch (err) {}
    };

    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  }, []);

  const navigate = (path) => {
    if (path.startsWith('order-confirmation/')) {
      const orderId = path.split('/')[1];
      setRouteParams({ orderId });
      setRoute('order-confirmation');
    } else if (path.startsWith('order/')) {
      const orderId = path.split('/')[1];
      setRouteParams({ orderId });
      setRoute('order-tracking');
    } else if (path === 'admin/orders') {
      setRoute('admin-orders');
      setRouteParams({});
    } else {
      setRoute(path);
      setRouteParams({});
    }
  };

  const openAddModal = (product) => {
    setModalProduct(product);
    setModalQty(1);
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setModalProduct(null);
  };

  const confirmAdd = (qty) => {
    if (!modalProduct) return;
    addToCart(modalProduct, qty);
    setToast(`${modalProduct.name} × ${qty} added to cart`);
    setTimeout(() => setToast(''), 2500);
    closeAddModal();
  };

  return (
    <div className="site">
      <div className="shell">
        <nav className="nav">
           <div className="brand">Wow Shoppers Lite</div>
           <div className="nav-actions">
             <button onClick={() => navigate('products')}>Products</button>
             <button onClick={() => navigate('cart')}>
               <svg className="icon-cart" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                 <path d="M3 3h2l.4 2M7 13h10l3-8H6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                 <circle cx="10" cy="20" r="1" fill="currentColor"/>
                 <circle cx="18" cy="20" r="1" fill="currentColor"/>
               </svg>
               <span style={{ marginLeft: 6 }}>Cart</span>
               {cartCount > 0 && <span className="cartBadge">({cartCount})</span>}
             </button>
             <button onClick={() => navigate('admin/orders')}>Admin</button>
           </div>
        </nav>

        {route === 'products' && <ProductsPage onNavigate={navigate} onAddRequest={openAddModal} />}
        {route === 'cart' && <CartPage onNavigate={navigate} />}
        {route === 'checkout' && <CheckoutPage onNavigate={navigate} />}
        {route === 'order-confirmation' && (
          <OrderConfirmationPage orderId={routeParams.orderId} onNavigate={navigate} />
        )}
        {route === 'order-tracking' && <OrderTrackingPage orderId={routeParams.orderId} />}
        {route === 'admin-orders' && <AdminOrdersPage onNavigate={navigate} />}

        {addModalOpen && modalProduct && (
          <div className="addModal">
            <div className="addModalBox">
              <h3 className="modal-title">Add to cart</h3>
              <div className="modal-product">{modalProduct.name}</div>
              <label className="modal-label">Quantity</label>
              <input
                className="modal-qty"
                type="number"
                min={1}
                value={modalQty}
                onChange={(e) => setModalQty(Number(e.target.value) || 1)}
              />
              <div className="modal-actions">
                <button className="btn btn--primary" onClick={() => confirmAdd(modalQty)}>Add to Cart</button>
                <button className="btn btn--outline" onClick={closeAddModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

function ProductsPage({ onNavigate, onAddRequest }) {
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
        setCategories(json.categories || []);
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
          setProducts(json.products || []);
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

  const handleAddToCart = (product) => {
    if (typeof onAddRequest === 'function') return onAddRequest(product);
    // fallback
    addToCart(product);
  };

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
                    <div className="price">${Number.isFinite(price) ? price.toLocaleString() : p.price}</div>
                  </div>
                  <div className={isInStock ? 'stock in' : 'stock out'}>
                    {isInStock ? 'In stock' : 'Out of stock'}
                  </div>
                  <div className="category">{p.category_name}</div>
                  {isInStock && (
                    <button className="btnAddCart" onClick={() => handleAddToCart(p)}>
                      Add to Cart
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CartPage({ onNavigate }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const handleUpdateQuantity = (productId, newQuantity) => {
    const updated = updateCartQuantity(productId, newQuantity);
    setCart(updated);
  };

  const handleRemove = (productId) => {
    const updated = removeFromCart(productId);
    setCart(updated);
  };

  const total = getCartTotal(cart);

  return (
    <div className="page">
      <header className="header">
        <h1>Your Cart</h1>
      </header>

      {cart.length === 0 ? (
        <div className="empty">Your cart is empty.</div>
      ) : (
        <>
          <div className="cartList">
            {cart.map((item) => (
              <div key={item.productId} className="cartItem">
                <div className="cartItemName">{item.name}</div>
                <div className="cartItemPrice">${item.price.toFixed(2)}</div>
                <div className="cartItemQty">
                  <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <div className="cartItemTotal">${(item.price * item.quantity).toFixed(2)}</div>
                <button className="btnRemove" onClick={() => handleRemove(item.productId)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="cartSummary">
            <div className="summaryLine">
              <span>Total:</span>
              <span className="totalPrice">${total.toFixed(2)}</span>
            </div>
            <button className="btnPrimary" onClick={() => onNavigate('checkout')}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CheckoutPage({ onNavigate }) {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentCart = getCart();
    if (currentCart.length === 0) {
      onNavigate('cart');
    }
    setCart(currentCart);
  }, [onNavigate]);

  const total = getCartTotal(cart);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const items = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    const body = {
      customerName,
      customerPhone,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
      paymentMethod,
      items
    };

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Order creation failed');
      }

      clearCart();
      onNavigate(`order-confirmation/${json.order.orderId}`);
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <h1>Checkout</h1>
      </header>

      <div className="checkoutContainer">
        <div className="checkoutSummary">
          <h2>Order Summary</h2>
          {cart.map((item) => (
            <div key={item.productId} className="summaryItem">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="summaryTotal">
            <strong>Total:</strong>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </div>

        <form className="checkoutForm" onSubmit={handleSubmit}>
          <h2>Customer Details</h2>

          <label>
            Name *
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
            />
          </label>

          <label>
            Phone *
            <input
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number"
            />
          </label>

          <label>
            Delivery Method *
            <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
          </label>

          {deliveryMethod === 'delivery' && (
            <label>
              Delivery Address *
              <textarea
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address"
                rows={3}
              />
            </label>
          )}

          <label>
            Payment Method *
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash_on_delivery">Cash on Delivery</option>
              <option value="mock">Mock Payment</option>
            </select>
          </label>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btnPrimary" disabled={loading}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

function OrderConfirmationPage({ orderId, onNavigate }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrder(data.order);
      })
      .catch((err) => setError(err.message || 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="page">Loading...</div>;
  if (error) return <div className="page error">{error}</div>;
  if (!order) return <div className="page">Order not found</div>;

  return (
    <div className="page">
      <header className="header">
        <h1>Order Confirmed!</h1>
      </header>

      <div className="confirmation">
        <p className="confirmMsg">Thank you for your order.</p>
        <div className="confirmDetail">
          <strong>Order ID:</strong> {order.orderId}
        </div>
        <div className="confirmDetail">
          <strong>Status:</strong> {order.status}
        </div>
        <div className="confirmDetail">
          <strong>Total:</strong> ${order.total.toFixed(2)}
        </div>

        <button className="btnPrimary" onClick={() => onNavigate(`order/${orderId}`)}>
          Track Order
        </button>
      </div>
    </div>
  );
}

function OrderTrackingPage({ orderId, onNavigate }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchOrder = () => {
    setLoading(true);
    setUpdateSuccess(false);
    fetch(`${API_URL}/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrder(data.order);
      })
      .catch((err) => setError(err.message || 'Failed to load order'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    setUpdateSuccess(false);
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to update status');
      setUpdateSuccess(true);
      fetchOrder();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div className="page">Loading order...</div>;
  if (error) return <div className="page error">{error}</div>;
  if (!order) return <div className="page">Order not found</div>;

  return (
    <div className="page">
      <header className="header">
        <h1>Order Tracking</h1>
      </header>

      {updateSuccess && <div className="success">Order status updated successfully!</div>}

      <div className="trackingContainer">
        <div className="trackingDetail">
          <strong>Order ID:</strong> {order.orderId}
        </div>
        <div className="trackingDetail">
          <strong>Status:</strong> <span className="statusBadge">{order.status}</span>
        </div>
        <div className="trackingDetail">
          <strong>Customer:</strong> {order.customerName}
        </div>
        <div className="trackingDetail">
          <strong>Phone:</strong> {order.customerPhone}
        </div>
        <div className="trackingDetail">
          <strong>Delivery Method:</strong> {order.deliveryMethod}
        </div>
        {order.deliveryAddress && (
          <div className="trackingDetail">
            <strong>Address:</strong> {order.deliveryAddress}
          </div>
        )}
        <div className="trackingDetail">
          <strong>Payment:</strong> {order.paymentMethod}
        </div>

        <h2>Items</h2>
        <div className="orderItems">
          {order.items.map((item) => (
            <div key={item.productId} className="orderItem">
              <span>{item.name}</span>
              <span>
                {item.quantity} x ${item.unitPrice.toFixed(2)} = ${item.lineTotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="trackingTotal">
          <strong>Total:</strong> <strong>${order.total.toFixed(2)}</strong>
        </div>

        <div className="adminControls">
          <h3>Update Order Status</h3>
          <div className="statusButtons">
            {['placed', 'accepted', 'packed', 'dispatched', 'delivered'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={updatingStatus || order.status === status}
                className={order.status === status ? 'btnSmall active' : 'btnSmall'}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminOrdersPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = () => {
    setLoading(true);
    setError('');
    fetch(`${API_URL}/api/orders?page=${page}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrders(data.orders || []);
        setTotal(data.count || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => setError(err.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="page">
      <header className="header">
        <h1>Admin: Order Management</h1>
        <p className="subtitle">Manage all customer orders</p>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="adminStats">
        <div className="stat">
          <strong>{total}</strong>
          <span>Total Orders</span>
        </div>
        <div className="stat">
          <strong>{page}</strong>
          <span>Current Page</span>
        </div>
        <div className="stat">
          <strong>{totalPages}</strong>
          <span>Total Pages</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : (
        <>
          <div className="ordersTable">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.orderId}>
                      <td className="orderId">{order.orderId.slice(0, 8)}...</td>
                      <td>{order.customerName}</td>
                      <td>
                        <span className="statusBadge">{order.status}</span>
                      </td>
                      <td>${order.total.toFixed(2)}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <button
                          className="btnSmall"
                          onClick={() => onNavigate(`order/${order.orderId}`)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
