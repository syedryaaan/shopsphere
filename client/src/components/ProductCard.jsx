import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const outOfStock = product.stock === 0;
  const [wishlistPending, setWishlistPending] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  const isWishlisted = (user?.wishlist || []).some(
    (id) => String(id) === String(product._id)
  );

  const syncWishlist = (wishlist = []) => {
    updateUser((currentUser) => {
      if (!currentUser) return currentUser;

      return {
        ...currentUser,
        wishlist: wishlist.map((id) => String(id)),
      };
    });
  };

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setWishlistPending(true);
    setWishlistError('');
    try {
      if (isWishlisted) {
        const { data } = await api.delete(`/wishlist/${product._id}`);
        syncWishlist(data.wishlist || []);
        return;
      }

      const { data } = await api.post(`/wishlist/${product._id}`);
      syncWishlist(data.wishlist || []);
    } catch (error) {
      setWishlistError(getErrorMessage(error));
    } finally {
      setWishlistPending(false);
    }
  };

  return (
    <article className="card product-card">
      {user && (
        <div className="wishlist-button-wrap">
          <button
            type="button"
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={toggleWishlist}
            disabled={wishlistPending}
            aria-label={
              isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
            }
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? '♥' : '♡'}
          </button>
          {wishlistError && <span className="error wishlist-error" role="status">{wishlistError}</span>}
        </div>
      )}

      <Link to={`/product/${product._id}`}>
        <img src={product.image} alt={product.name} />
      </Link>

      <div className="card-body">
        <span className="tag">{product.category}</span>

        <Link to={`/product/${product._id}`} className="product-name">
          {product.name}
        </Link>

        <div className="row-between">
          <strong>{formatINR(product.price)}</strong>
          <span className="muted">★ {product.rating.toFixed(1)}</span>
        </div>

        <button
          className="btn full"
          disabled={outOfStock}
          onClick={() => addToCart(product)}
        >
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}