import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data.message || 'If an account exists, a password reset link has been sent to your email.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={handleSubmit}>
      <h1>Forgot Password</h1>
      <p className="muted" style={{ margin: '0 0 12px' }}>
        Enter your email address to receive a password reset link.
      </p>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <input
        type="email"
        required
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn full" disabled={loading}>
        {loading ? 'Sending link...' : 'Send Reset Link'}
      </button>
      <p className="muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
        Remembered your password? <Link to="/login">Login</Link>
      </p>
    </form>
  );
}
