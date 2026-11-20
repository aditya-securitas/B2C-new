import React, { useState, useEffect } from 'react';
import '../styles/login-modal.css';
import { loginUser } from '../utils/auth';

export interface PendingCheckInfo {
  id: string;
  name: string;
  price?: number | string;
  icon?: string;
}

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCheck?: PendingCheckInfo | null;
  onLoginSuccess: (checkToSelect?: PendingCheckInfo | null) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  pendingCheck,
  onLoginSuccess,
}) => {
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('vsm-locked');
      document.documentElement.classList.add('vsm-locked');
      return () => {
        document.body.classList.remove('vsm-locked');
        document.documentElement.classList.remove('vsm-locked');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePerformLogin = (userData?: { name?: string; phone?: string; email?: string }) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const session = loginUser(userData || {
        phone: phone || '+91 98765 43210',
        email: email || 'candidate@example.com',
      });
      setIsSubmitting(false);
      onLoginSuccess(pendingCheck || null);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'otp') {
      if (!phone || phone.length < 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }
      handlePerformLogin({ phone });
    } else {
      if (!email || !password) {
        alert('Please enter both email and password.');
        return;
      }
      handlePerformLogin({ email });
    }
  };

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      alert('Please enter a 10-digit mobile number to receive OTP.');
      return;
    }
    setOtpSent(true);
  };

  const handleQuickDemoLogin = () => {
    handlePerformLogin({
      name: 'Aditya Raghav',
      phone: '+91 98765 43210',
      email: 'Aditya.raghav@example.com',
    });
  };

  return (
    <div className="login-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Glow Strip */}
        <div className="login-modal-glow-top" />

        {/* Close Button */}
        <button
          type="button"
          className="login-modal-close-btn"
          onClick={onClose}
          aria-label="Close login dialog"
        >
          ✕
        </button>

        {/* Header */}
        <div className="login-modal-header">
          <div className="login-modal-icon-badge">
            <span>🛡️</span>
          </div>
          <div className="login-modal-titles">
            <span className="login-modal-pill-tag">AUTHENTICATION REQUIRED</span>
            <h3 className="login-modal-title">Sign In to Continue</h3>
            <p className="login-modal-sub">
              Please sign in to select and configure this verification check.
            </p>
          </div>
        </div>

        {/* Pending Check Banner */}
        {pendingCheck && (
          <div className="login-pending-check-banner">
            <span className="login-pending-icon">{pendingCheck.icon || '🪪'}</span>
            <div className="login-pending-meta">
              <span className="login-pending-label">Selected Check</span>
              <span className="login-pending-name">{pendingCheck.name}</span>
              <span className="login-pending-auto-note">
                Will be automatically added to your cart immediately upon login
              </span>
            </div>
            {pendingCheck.price && (
              <span className="login-pending-badge">₹{pendingCheck.price}</span>
            )}
          </div>
        )}

        {/* Quick Demo 1-Click Login */}
        <div className="login-demo-action-box">
          <button
            type="button"
            className="login-demo-btn"
            onClick={handleQuickDemoLogin}
            disabled={isSubmitting}
          >
            <span>⚡ Quick 1-Click Login &amp; Select Check</span>
          </button>
        </div>

        <div className="login-or-divider">
          <span>or sign in with credentials</span>
        </div>

        {/* Tabs: Mobile OTP vs Email/Password */}
        <div className="login-modal-tabs" role="tablist">
          <button
            type="button"
            className={`login-modal-tab-btn ${loginMode === 'otp' ? 'active' : ''}`}
            onClick={() => setLoginMode('otp')}
          >
            📱 Mobile OTP
          </button>
          <button
            type="button"
            className={`login-modal-tab-btn ${loginMode === 'password' ? 'active' : ''}`}
            onClick={() => setLoginMode('password')}
          >
            ✉️ Email &amp; Password
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="login-modal-form">
          {loginMode === 'otp' ? (
            <>
              <div className="login-modal-field">
                <label>10-Digit Mobile Number</label>
                <div className="login-input-row">
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="login-modal-input"
                    required
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      className="login-otp-send-btn"
                      onClick={handleSendOtp}
                    >
                      Send OTP
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="login-modal-field">
                  <label>Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    placeholder="Enter OTP (or leave default 123456)"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className="login-modal-input"
                    autoFocus
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="login-modal-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-modal-input"
                  required
                />
              </div>

              <div className="login-modal-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-modal-input"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="login-modal-submit-btn"
            disabled={isSubmitting}
          >
            <span>
              {isSubmitting
                ? 'Authenticating...'
                : pendingCheck
                ? `Login & Select "${pendingCheck.name}"`
                : 'Login & Continue'}
            </span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        {/* Trust Badges Footer */}
        <div className="login-modal-trust-footer">
          <span className="login-modal-trust-item">🔒 256-Bit SSL Secured</span>
          <span>•</span>
          <span className="login-modal-trust-item">🏛️ Official Central Trust Portal</span>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

