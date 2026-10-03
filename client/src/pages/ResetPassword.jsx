import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      setSuccess(data.message || 'Password has been reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={handleSubmit}>
      <h1>Reset Password</h1>
      <p className="muted" style={{ margin: '0 0 12px' }}>
        Please enter and confirm your new password below.
      </p>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <input
        type="password"
        required
        minLength={6}
        placeholder="New password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button className="btn full" disabled={loading || Boolean(success)}>
        {loading ? 'Resetting password...' : 'Reset Password'}
      </button>
      <p className="muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Link to="/login">Back to Login</Link>
      </p>
    </form>
  );
}
