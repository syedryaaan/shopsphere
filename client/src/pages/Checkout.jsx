import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../utils/format.js';

export default function Checkout() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(
    user?.address || { line1: '', city: '', state: '', pincode: '' }
  );
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const update = (key) => (e) => setAddress((a) => ({ ...a, [key]: e.target.value }));

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');

    // Validate 6-digit Indian PIN code format
    const cleanPin = address.pincode ? String(address.pincode).trim() : '';
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setError('Please enter a valid 6-digit Indian PIN code (e.g. 560001)');
      return;
    }

    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map(({ product, name, price, quantity }) => ({ product, name, price, quantity })),
        shippingAddress: { ...address, pincode: cleanPin },
        paymentMethod,
      });
      clearCart();
      navigate('/orders', { state: { placed: data._id } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-state card">
        <div className="empty-icon">🛒</div>
        <h3>Your Cart is Empty</h3>
        <p className="muted">There are no items to check out.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '12px' }}>Return to Shop</Link>
      </div>
    );
  }

  return (
    <section className="checkout-page">
      <div className="breadcrumb">
        <Link to="/cart">← Back to Cart</Link>
      </div>

      <div className="checkout-layout">
        <form className="card form checkout-form" onSubmit={placeOrder}>
          <h2>Shipping Address</h2>
          <p className="muted" style={{ margin: '-4px 0 8px' }}>Enter where you would like your order delivered</p>

          <label className="field-group">
            <span className="field-label">Street Address</span>
            <input
              required
              placeholder="House/Flat No., Apartment, Street name"
              value={address.line1}
              onChange={update('line1')}
            />
          </label>

          <div className="form-grid-2">
            <label className="field-group">
              <span className="field-label">City</span>
              <input
                required
                placeholder="City"
                value={address.city}
                onChange={update('city')}
              />
            </label>

            <label className="field-group">
              <span className="field-label">State</span>
              <input
                required
                placeholder="State"
                value={address.state}
                onChange={update('state')}
              />
            </label>
          </div>

          <label className="field-group">
            <span className="field-label">PIN Code (6 digits)</span>
            <input
              required
              type="text"
              maxLength={6}
              placeholder="e.g. 560001"
              value={address.pincode}
              onChange={update('pincode')}
            />
          </label>

          <h2 style={{ marginTop: '12px' }}>Payment Method</h2>
          <div className="payment-options">
            <label className="radio-option card">
              <input
                type="radio"
                name="payment"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
              />
              <div>
                <strong>Cash on Delivery (COD)</strong>
                <p className="muted">Pay securely in cash or UPI upon delivery.</p>
              </div>
            </label>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary full btn-lg" disabled={placing}>
            {placing ? 'Placing Order...' : `Confirm & Place Order · ${formatINR(totalPrice)}`}
          </button>
        </form>

        <div className="checkout-review-col">
          <div className="card summary-card">
            <h3>Order Items ({totalItems})</h3>
            <div className="checkout-items-preview">
              {items.map((i) => (
                <div key={i.product} className="checkout-mini-item">
                  <img src={i.image || 'https://placehold.co/600x400?text=ShopSphere'} alt={i.name} />
                  <div className="checkout-mini-info">
                    <p className="checkout-mini-name">{i.name}</p>
                    <p className="muted">{i.quantity} × {formatINR(i.price)}</p>
                  </div>
                  <strong>{formatINR(i.price * i.quantity)}</strong>
                </div>
              ))}
            </div>
            <hr className="summary-divider" />
            <div className="summary-line">
              <span className="muted">Items Total</span>
              <span>{formatINR(totalPrice)}</span>
            </div>
            <div className="summary-line">
              <span className="muted">Delivery Fee</span>
              <span className="text-success font-semibold">FREE</span>
            </div>
            <div className="summary-line summary-total">
              <strong>Total</strong>
              <strong className="summary-total-price">{formatINR(totalPrice)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
