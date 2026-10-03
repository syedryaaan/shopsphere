import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) {
    return (
      <div className="empty-state card">
        <div className="empty-icon">⚠️</div>
        <h3>Product Not Found</h3>
        <p className="error">{error}</p>
        <Link to="/" className="btn btn-sm">← Back to shop</Link>
      </div>
    );
  }

  if (!product) return <Loader text="Loading product details..." />;

  const isOutOfStock = product.stock === 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => {
      navigate('/cart');
    }, 400);
  };

  return (
    <section>
      <div className="breadcrumb">
        <Link to="/">Shop</Link> &gt; <span>{product.category}</span> &gt; <span>{product.name}</span>
      </div>

      <div className="detail card">
        <div className="detail-image-container">
          <img
            src={product.image || 'https://placehold.co/600x400?text=ShopSphere'}
            alt={product.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/600x400?text=ShopSphere';
            }}
          />
        </div>

        <div className="detail-info">
          <div className="detail-header">
            <span className="tag">{product.category}</span>
            <span className="rating-pill">★ {product.rating?.toFixed(1) || '4.0'}</span>
          </div>

          <h1 className="detail-title">{product.name}</h1>
          <p className="detail-brand muted">Brand: <strong>{product.brand || 'Generic'}</strong></p>

          <div className="detail-price-box">
            <span className="detail-price">{formatINR(product.price)}</span>
            <span className="detail-tax muted">Inclusive of all taxes</span>
          </div>

          <div className="detail-stock-status">
            {product.stock > 0 ? (
              <span className="status-pill status-in-stock">
                ✓ In Stock ({product.stock} units available)
              </span>
            ) : (
              <span className="status-pill status-out-stock">✕ Out of Stock</span>
            )}
          </div>

          <div className="detail-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {!isOutOfStock && (
            <div className="detail-actions">
              <label className="qty-label">
                <span>Quantity</span>
                <div className="qty-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    −
                  </button>
                  <span className="stepper-val">{qty}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                  >
                    +
                  </button>
                </div>
              </label>

              <button
                className={`btn btn-lg ${added ? 'btn-success' : ''}`}
                onClick={handleAdd}
              >
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
