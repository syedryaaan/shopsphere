import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = () => {
    api
      .get('/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      fetchOrders();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  if (error) {
    return (
      <div className="empty-state card">
        <div className="empty-icon">⚠️</div>
        <h3>Failed to load orders</h3>
        <p className="error">{error}</p>
        <button className="btn btn-sm" onClick={fetchOrders}>Try again</button>
      </div>
    );
  }

  if (!orders) return <Loader text="Loading your orders..." />;

  return (
    <section className="orders-page">
      <div className="row-between orders-header">
        <div>
          <h1>My Orders</h1>
          <p className="muted">Track and manage your past and recent purchases</p>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm">Shop More</Link>
      </div>

      {location.state?.placed && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          🎉 Your order #{location.state.placed.slice(-6).toUpperCase()} was placed successfully! Thank you for shopping with ShopSphere.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📦</div>
          <h3>No orders placed yet</h3>
          <p className="muted">You haven't placed any orders with us yet. Start browsing our catalogue!</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '12px' }}>Explore Products</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => (
            <div key={o._id} className="card order-card">
              <div className="order-card-header">
                <div>
                  <span className="order-id">Order #{o._id.slice(-6).toUpperCase()}</span>
                  <span className="order-date muted">
                    Placed on {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="order-header-right">
                  <span className={`status-tag status-${o.status}`}>
                    {o.status}
                  </span>
                </div>
              </div>

              <div className="order-items-list">
                {o.items.map((i, idx) => (
                  <div key={idx} className="order-item-row">
                    <div className="order-item-info">
                      <Link to={`/product/${i.product}`} className="order-item-title">
                        {i.name}
                      </Link>
                      <span className="muted">Qty: {i.quantity}</span>
                    </div>
                    <strong>{formatINR(i.price * i.quantity)}</strong>
                  </div>
                ))}
              </div>

              {o.shippingAddress && (
                <div className="order-shipping-details muted">
                  <strong>Ship to:</strong> {o.shippingAddress.line1}, {o.shippingAddress.city}, {o.shippingAddress.state} - {o.shippingAddress.pincode} · <em>{o.paymentMethod}</em>
                </div>
              )}

              <div className="order-card-footer">
                <div className="order-total-box">
                  <span className="muted">Total: </span>
                  <strong className="order-total-price">{formatINR(o.totalAmount)}</strong>
                </div>

                {o.status === 'pending' && (
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={cancellingId === o._id}
                    onClick={() => handleCancel(o._id)}
                  >
                    {cancellingId === o._id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
