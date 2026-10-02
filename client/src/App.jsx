import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Orders from './pages/Orders.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import NotFound from './pages/NotFound.jsx';
import { useCart } from './context/CartContext.jsx';

export default function App() {
  const { toast, removeToast } = useCart();

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
          </Route>
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} ShopSphere · Open-source student project</footer>

      {toast && (
        <div className="toast-container" aria-live="polite">
          <div className="toast">
            <button className="toast-close" aria-label="Close notification" onClick={removeToast}>
              ×
            </button>
            <div className="toast-icon">✓</div>
            <img src={toast.image} alt={toast.name} className="toast-thumb" />
            <div className="toast-copy">
              <span className="toast-badge">Added</span>
              <strong>{toast.name}</strong>
              <small>{toast.newQty} items in cart</small>
            </div>
            <div className="toast-progress" />
          </div>
        </div>
      )}
    </>
  );
}
