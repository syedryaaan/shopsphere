import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <svg className="brand-logo" width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#brandGrad)" />
          <path d="M8 12L16 7L24 12V21L16 26L8 21V12Z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
          <circle cx="16" cy="16" r="3" fill="#38BDF8"/>
          <defs>
            <linearGradient id="brandGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED" />
              <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
          </defs>
        </svg>
        <span>Shop</span>Sphere
      </Link>
      <nav className="nav-links">
        {user && (
          <>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Shop
            </NavLink>
            <NavLink to="/cart" className={({ isActive }) => `cart-nav-link ${isActive ? 'active' : ''}`}>
              Cart {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
              My Orders
            </NavLink>
          </>
        )}
        {isAdmin && (
          <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'active' : '')}>
            Admin
          </NavLink>
        )}

        {user ? (
          <div className="user-menu">
            <span className="user-greeting">Hi, {user.name.split(' ')[0]}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className="auth-nav-btns">
            <NavLink to="/login" className="btn btn-ghost btn-sm">Login</NavLink>
            <NavLink to="/register" className="btn btn-sm">Sign Up</NavLink>
          </div>
        )}
      </nav>
    </header>
  );
}
