import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client.js';
import { CATEGORIES, formatINR } from '../../utils/format.js';
import Loader from '../../components/Loader.jsx';

const empty = { name: '', description: '', price: '', category: 'electronics', brand: '', image: '', stock: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/products')
      .then(({ data }) => setProducts(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const { name, description, category, brand, image } = form;
    const payload = {
      name,
      description,
      category,
      brand,
      image,
      price: Number(form.price),
      stock: Number(form.stock),
    };
    if (!payload.image) delete payload.image;

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setSuccess('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        setSuccess('Product added successfully!');
      }
      setForm(empty);
      setEditingId(null);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const edit = (p) => {
    setEditingId(p._id);
    setForm({ ...empty, ...p, price: String(p.price), stock: String(p.stock) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      setSuccess('Product deleted successfully');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="admin-page">
      <div className="row-between admin-header">
        <div>
          <h1>Admin · Product Management</h1>
          <p className="muted">Create, edit, and manage catalog inventory</p>
        </div>
        <Link to="/admin/orders" className="btn btn-ghost btn-sm">Manage Orders →</Link>
      </div>

      <form className="card form admin-form" onSubmit={submit}>
        <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <label className="field-group">
          <span className="field-label">Product Name</span>
          <input required placeholder="e.g. Wireless Noise-Cancelling Headphones" value={form.name} onChange={set('name')} />
        </label>

        <label className="field-group">
          <span className="field-label">Description</span>
          <textarea required placeholder="Detailed product description..." value={form.description} onChange={set('description')} />
        </label>

        <div className="form-grid-2">
          <label className="field-group">
            <span className="field-label">Price (₹ INR)</span>
            <input required type="number" min="0" placeholder="e.g. 1999" value={form.price} onChange={set('price')} />
          </label>
          <label className="field-group">
            <span className="field-label">Stock Quantity</span>
            <input required type="number" min="0" placeholder="e.g. 50" value={form.stock} onChange={set('stock')} />
          </label>
        </div>

        <div className="form-grid-2">
          <label className="field-group">
            <span className="field-label">Category</span>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="field-group">
            <span className="field-label">Brand</span>
            <input placeholder="e.g. Sony, Apple, Stride" value={form.brand} onChange={set('brand')} />
          </label>
        </div>

        <label className="field-group">
          <span className="field-label">Image URL (Optional)</span>
          <input placeholder="https://..." value={form.image} onChange={set('image')} />
        </label>

        <div className="row" style={{ marginTop: '8px' }}>
          <button className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Product'}</button>
          {editingId && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm(empty);
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>Inventory ({products.length})</h2>

      {loading ? (
        <Loader text="Loading products..." />
      ) : products.length === 0 ? (
        <p className="muted">No products found.</p>
      ) : (
        <div className="table-wrapper card">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.brand && <div className="muted font-sm">{p.brand}</div>}
                  </td>
                  <td>
                    <span className="tag">{p.category}</span>
                  </td>
                  <td><strong>{formatINR(p.price)}</strong></td>
                  <td>
                    <span className={`status-tag ${p.stock > 0 ? 'status-delivered' : 'status-cancelled'}`}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => edit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p._id, p.name)}>Delete</button>
                    </div>
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
