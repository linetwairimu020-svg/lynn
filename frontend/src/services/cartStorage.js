const CART_KEY = 'apex-cart';

export function readCart() {
  let serialized;
  try {
    serialized = window.localStorage.getItem(CART_KEY);
  } catch (error) {
    throw new Error(`Cart storage is unavailable: ${error.message}`);
  }
  if (!serialized) return [];

  let cart;
  try {
    cart = JSON.parse(serialized);
  } catch {
    throw new Error('Saved cart data is invalid. Clear the apex-cart browser storage entry to start a new cart.');
  }
  if (!Array.isArray(cart) || cart.some((item) => (
    !item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1
    || !Number.isFinite(item.price) || item.price < 0
  ))) {
    throw new Error('Saved cart data is incomplete. Clear the apex-cart browser storage entry to start a new cart.');
  }
  return cart;
}

export function writeCart(cart) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    throw new Error(`Could not save the cart: ${error.message}`);
  }
}
