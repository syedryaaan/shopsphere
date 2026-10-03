import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ForgotPassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve initial email from location state, auth user, or persisted storage
  const getInitialEmail = () => {
    if (location.state?.email) return location.state.email.trim();
    if (user?.email) return user.email.trim();
    const last = localStorage.getItem('shopsphere_last_email');
    if (last) return last.trim();
    try {
      const stored = localStorage.getItem('shopsphere_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) return parsed.email.trim();
      }
    } catch {
      // ignore parse errors
    }
    return '';
  };

  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [email, setEmail] = useState(getInitialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 30-second cooldown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Request or Resend OTP
  const handleRequestOtp = async (isResend = false) => {
    const targetEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!targetEmail) {
      setError('Please provide an email address.');
      return;
    }

    if (!emailRegex.test(targetEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setOtpLoading(true);
    setError('');
    if (!isResend) {
      setSuccess('');
    }

    try {
      const { data } = await api.post('/auth/forgot-password', { email: targetEmail });

      // Persist the email used so it stays pre-populated
      localStorage.setItem('shopsphere_last_email', targetEmail);

      setSuccess(`📬 A 4-digit verification code has been dispatched from ShopSphere to ${targetEmail}!`);
      if (isResend) {
        setOtp(''); // clear OTP input on resend so user enters the fresh code
      }

      setCountdown(30); // 30-second cooldown timer
      setStep('verify');
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      setCountdown(30);
    } finally {
      setOtpLoading(false);
    }
  };

  // Submit OTP and new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.trim().length !== 4) {
      return setError('Please enter the complete 4-digit OTP verification code received from ShopSphere in your email.');
    }

    if (password.length < 6) {
      return setError('New password must be at least 6 characters long.');
    }

    if (!confirmPassword) {
      return setError('Please confirm your new password.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please ensure both passwords are the same.');
    }

    setResetLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
        confirmPassword,
      });

      setSuccess(data.message || 'Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { email: email.trim().toLowerCase() } });
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="card form auth" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1>{step === 'request' ? 'Forgot Password' : 'Reset with 4-Digit OTP'}</h1>
      <p className="muted" style={{ margin: '0 0 16px' }}>
        {step === 'request'
          ? 'Enter your registered email address to receive your 4-digit verification code.'
          : 'Enter the 4-digit verification code sent to your email inbox and set your new password.'}
      </p>

      {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '12px' }}>{success}</div>}

      {step === 'verify' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
            <span>Target Email: <strong>{email}</strong></span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              onClick={() => {
                setStep('request');
                setError('');
                setSuccess('');
              }}
            >
              Change Email
            </button>
          </div>

          <div className="alert alert-info" style={{ fontSize: '0.88rem' }}>
            📬 ShopSphere has sent your 4-digit verification code to <strong>{email}</strong>. Please check your email inbox (and spam/junk folder) and enter the 4-digit code below.
          </div>
        </div>
      )}

      {step === 'request' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (countdown === 0 && !otpLoading) {
              handleRequestOtp(false);
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <label className="field-group">
            <span className="field-label">Email address</span>
            <input
              type="email"
              required
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              disabled={otpLoading}
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary full"
            disabled={otpLoading || countdown > 0}
          >
            {otpLoading
              ? 'Sending 4-Digit Code to Email...'
              : countdown > 0
              ? `Please wait ${countdown}s before retrying`
              : 'Send 4-Digit Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label className="field-group">
            <span className="field-label">4-Digit Verification Code (OTP from Email)</span>
            <input
              type="text"
              required
              maxLength={4}
              placeholder="0000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              style={{
                letterSpacing: '16px',
                fontSize: '1.6rem',
                textAlign: 'center',
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
            />
          </label>

          <label className="field-group">
            <span className="field-label">New Password (min 6 characters)</span>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label className="field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="field-label">Confirm New Password</span>
              {passwordsMatch && (
                <span style={{ color: '#16a34a', fontSize: '0.78rem', fontWeight: 600 }}>
                  ✓ Passwords match
                </span>
              )}
              {passwordsMismatch && (
                <span style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}>
                  ✗ Passwords do not match
                </span>
              )}
            </div>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={
                passwordsMismatch
                  ? { borderColor: '#ef4444' }
                  : passwordsMatch
                  ? { borderColor: '#22c55e' }
                  : {}
              }
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary full"
            disabled={
              resetLoading ||
              otpLoading ||
              Boolean(passwordsMismatch) ||
              Boolean(success && success.includes('Redirecting'))
            }
          >
            {resetLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div
            className="otp-resend-box"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={countdown > 0 || otpLoading}
              onClick={() => handleRequestOtp(true)}
            >
              {otpLoading
                ? 'Mailing 4-Digit OTP...'
                : countdown > 0
                ? `Resend OTP in ${countdown}s`
                : 'Request one more time for OTP'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStep('request');
                setOtp('');
                setError('');
                setSuccess('');
              }}
            >
              Change Email
            </button>
          </div>
        </form>
      )}

      <p className="muted" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        Remember your password? <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
}
