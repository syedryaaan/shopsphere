import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const { addToCart } = useCart();
  const { updateUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/wishlist');
      setProducts(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleMoveToCart = async (product) => {
    try {
      const { data } = await api.delete(`/wishlist/${product._id}`);
      updateUser((currentUser) => ({
        ...currentUser,
        wishlist: (data.wishlist || []).map((id) => String(id)),
      }));
      setProducts((current) => current.filter((item) => item._id !== product._id));
      addToCart(product);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRemove = async (productId) => {
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      updateUser((currentUser) => ({
        ...currentUser,
        wishlist: (data.wishlist || []).map((id) => String(id)),
      }));
      setProducts((current) => current.filter((item) => item._id !== productId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return <p className="muted">Loading your wishlist…</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (products.length === 0) {
    return (
      <section className="empty">
        <h2>Your wishlist is empty</h2>
        <Link to="/" className="btn">Browse products</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Wishlist</h1>
      <div className="cart-list">
        {products.map((product) => (
          <div key={product._id} className="cart-item card">
            <img src={product.image} alt={product.name} />
            <div className="grow">
              <strong>{product.name}</strong>
              <p className="muted">{product.category}</p>
            </div>
            <strong>{formatINR(product.price)}</strong>
            <button className="btn btn-ghost" onClick={() => handleMoveToCart(product)}>Move to cart</button>
            <button className="btn btn-danger" onClick={() => handleRemove(product._id)}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}
