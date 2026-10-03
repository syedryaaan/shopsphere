import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(() => ({
    email: location.state?.email || localStorage.getItem('shopsphere_last_email') || '',
    password: '',
  }));
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (form.email.trim()) {
        localStorage.setItem('shopsphere_last_email', form.email.trim());
      }
      await login(form.email, form.password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Login</h1>
      <input
        type="email"
        required
        placeholder="Email"
        value={form.email}
        onChange={(e) => {
          const val = e.target.value;
          setForm({ ...form, email: val });
          if (val.includes('@')) {
            localStorage.setItem('shopsphere_last_email', val.trim());
          }
        }}
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {error && <p className="error">{error}</p>}
      <button className="btn full">Login</button>
      <p className="muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <span>New here? <Link to="/register">Create an account</Link></span>
        <Link
          to="/forgot-password"
          state={{ email: form.email.trim() }}
          onClick={() => {
            if (form.email.trim()) {
              localStorage.setItem('shopsphere_last_email', form.email.trim());
            }
          }}
        >
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
