import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <section className="empty-cart-section">
        <div className="empty-state card">
          <div className="empty-icon">🛍️</div>
          <h2>Your cart is currently empty</h2>
          <p className="muted">Explore our catalog and find amazing deals on high-quality products.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '12px' }}>Start Shopping</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="row-between cart-header-row">
        <div>
          <h1>Shopping Cart</h1>
          <p className="muted">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearCart}>
          Clear Cart
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-list">
          {items.map((item) => (
            <div key={item.product} className="cart-item card">
              <Link to={`/product/${item.product}`} className="cart-item-img-wrap">
                <img
                  src={item.image || 'https://placehold.co/600x400?text=ShopSphere'}
                  alt={item.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400?text=ShopSphere';
                  }}
                />
              </Link>
              <div className="cart-item-info">
                <Link to={`/product/${item.product}`} className="cart-item-title">
                  {item.name}
                </Link>
                <p className="cart-item-unit-price muted">{formatINR(item.price)} each</p>
              </div>

              <div className="cart-item-stepper">
                <button
                  className="stepper-btn"
                  onClick={() => updateQuantity(item.product, item.quantity - 1)}
                  title="Decrease quantity"
                >
                  −
                </button>
                <span className="stepper-val">{item.quantity}</span>
                <button
                  className="stepper-btn"
                  onClick={() => updateQuantity(item.product, item.quantity + 1)}
                  title="Increase quantity"
                >
                  +
                </button>
              </div>

              <div className="cart-item-total">
                <strong>{formatINR(item.price * item.quantity)}</strong>
              </div>

              <button
                className="cart-remove-btn"
                onClick={() => removeFromCart(item.product)}
                title="Remove item"
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary-col">
          <div className="card summary-card">
            <h3>Order Summary</h3>
            <div className="summary-line">
              <span className="muted">Subtotal ({totalItems} items)</span>
              <span>{formatINR(totalPrice)}</span>
            </div>
            <div className="summary-line">
              <span className="muted">Standard Delivery</span>
              <span className="text-success font-semibold">FREE</span>
            </div>
            <hr className="summary-divider" />
            <div className="summary-line summary-total">
              <strong>Total Amount</strong>
              <strong className="summary-total-price">{formatINR(totalPrice)}</strong>
            </div>
            <Link to="/checkout" className="btn btn-primary full btn-lg" style={{ marginTop: '16px' }}>
              Proceed to Checkout →
            </Link>
            <p className="checkout-trust-badge muted">
              🔒 Safe & Secure Checkout
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
