import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client.js';
import { formatINR } from '../../utils/format.js';
import Loader from '../../components/Loader.jsx';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/orders')
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (id, status) => {
    setStatusUpdating(id);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      await load();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setStatusUpdating(null);
    }
  };

  // Compute metrics
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  return (
    <section className="admin-page">
      <div className="row-between admin-header">
        <div>
          <h1>Admin · Order Management</h1>
          <p className="muted">Review customer orders, update statuses, and monitor sales</p>
        </div>
        <Link to="/admin/products" className="btn btn-ghost btn-sm">← Manage Products</Link>
      </div>

      <div className="admin-stats-grid">
        <div className="card stat-card">
          <span className="stat-label muted">Total Revenue</span>
          <strong className="stat-value text-primary">{formatINR(totalRevenue)}</strong>
          <span className="stat-sub muted">From active orders</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label muted">Total Orders</span>
          <strong className="stat-value">{orders.length}</strong>
          <span className="stat-sub muted">All-time transactions</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label muted">Pending Orders</span>
          <strong className="stat-value" style={{ color: '#d97706' }}>{pendingOrders}</strong>
          <span className="stat-sub muted">Awaiting fulfillment</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label muted">Delivered Orders</span>
          <strong className="stat-value text-success">{deliveredOrders}</strong>
          <span className="stat-sub muted">Completed successfully</span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>All Orders ({orders.length})</h2>

      {loading ? (
        <Loader text="Loading orders..." />
      ) : orders.length === 0 ? (
        <p className="muted">No orders placed yet.</p>
      ) : (
        <div className="table-wrapper card">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>
                    <strong>#{o._id.slice(-6).toUpperCase()}</strong>
                  </td>
                  <td>
                    <strong>{o.user?.name || 'Customer'}</strong>
                    <div className="muted font-sm">{o.user?.email || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="order-items-snippet">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="font-sm">
                          {i.name} <span className="muted">× {i.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="font-sm">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <strong>{formatINR(o.totalAmount)}</strong>
                  </td>
                  <td>
                    <select
                      className={`status-select status-${o.status}`}
                      value={o.status}
                      disabled={statusUpdating === o._id}
                      onChange={(e) => changeStatus(o._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
