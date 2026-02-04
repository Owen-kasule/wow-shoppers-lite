const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiGet(path, params) {
  const url = new URL(path, API_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString());
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return json;
}

// Cart utilities
const CART_KEY = 'wow_cart';

export function getCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1
    });
  }
  saveCart(cart);
  return cart;
}

export function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      return removeFromCart(productId);
    }
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter((i) => i.productId !== productId);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
