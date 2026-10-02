import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Login</h1>
      <input type="email" required placeholder="Email" value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" required placeholder="Password" value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="error">{error}</p>}
      <button className="btn full">Login</button>
      <p className="muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <span>New here? <Link to="/register">Create an account</Link></span>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </form>
  );
}
