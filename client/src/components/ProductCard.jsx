import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock === 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="card product-card">
      <Link to={`/product/${product._id}`} className="product-image-wrap">
        <img
          src={product.image || 'https://placehold.co/600x400?text=ShopSphere'}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/600x400?text=ShopSphere';
          }}
        />
        {outOfStock ? (
          <span className="badge badge-danger">Out of Stock</span>
        ) : product.stock <= 5 ? (
          <span className="badge badge-warning">Only {product.stock} left</span>
        ) : null}
      </Link>
      <div className="card-body">
        <div className="card-top-row">
          <span className="tag">{product.category}</span>
          <span className="rating-badge">★ {product.rating?.toFixed(1) || '4.0'}</span>
        </div>
        <Link to={`/product/${product._id}`} className="product-name" title={product.name}>
          {product.name}
        </Link>
        <div className="row-between card-pricing">
          <strong className="product-price">{formatINR(product.price)}</strong>
          {product.brand && <span className="product-brand">{product.brand}</span>}
        </div>
        <button
          className={`btn full ${added ? 'btn-success' : ''}`}
          disabled={outOfStock}
          onClick={handleAdd}
        >
          {outOfStock ? 'Out of stock' : added ? '✓ Added to Cart' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
