import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'shopsphere_cart';

// The cart lives only in localStorage for now.
// See issue: "Persist cart on the server for logged-in users".
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const showToast = (product, quantity = 1, previousQty = 0, newQty = quantity) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, name: product.name, image: product.image, quantity, previousQty, newQty }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2400);
  };

  const addToCart = (product, quantity = 1) => {
    const existing = items.find((i) => i.product === product._id);
    const previousQty = existing ? existing.quantity : 0;
    const newQty = previousQty + quantity;

    setItems((prev) => {
      if (existing) {
        return prev.map((i) =>
          i.product === product._id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }

      return [
        ...prev,
        { product: product._id, name: product.name, price: product.price, image: product.image, quantity },
      ];
    });

    showToast(product, quantity, previousQty, newQty);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    setItems((prev) => prev.map((i) => (i.product === productId ? { ...i, quantity } : i)));
  };

  const removeFromCart = (productId) =>
    setItems((prev) => prev.filter((i) => i.product !== productId));

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, toasts, showToast }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
