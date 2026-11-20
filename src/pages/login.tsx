import React, { useState, useEffect } from 'react';
import '../styles/login.css';
import logoimg from '../assets/img/logo_w.png';
import { CATEGORIES } from './home';
import { loginUser } from '../utils/auth';

interface LoginPageProps {
  onNavigateHome: () => void;
  onNavigateSelfVerify?: () => void;
  onNavigateServices?: (role?: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateHome,
  onNavigateSelfVerify,
  onNavigateServices,
  theme = 'light',
  onToggleTheme,
}) => {
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Google SSO Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleStep, setGoogleStep] = useState<'email' | 'otp' | 'success'>('email');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleOtp, setGoogleOtp] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleResendTimer, setGoogleResendTimer] = useState(30);

  // Countdown timer for Google OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGoogleModalOpen && googleStep === 'otp' && googleResendTimer > 0) {
      timer = setInterval(() => {
        setGoogleResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGoogleModalOpen, googleStep, googleResendTimer]);

  const handleOpenGoogleModal = () => {
    setIsGoogleModalOpen(true);
    setGoogleStep('email');
    setGoogleEmail('');
    setGoogleOtp('');
    setGoogleError(null);
    setGoogleLoading(false);
    setGoogleResendTimer(30);
  };

  const handleCloseGoogleModal = () => {
    setIsGoogleModalOpen(false);
    setGoogleStep('email');
    setGoogleError(null);
    setGoogleLoading(false);
  };

  const handleGoogleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = googleEmail.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setGoogleError('Please enter a valid Google email address.');
      return;
    }
    setGoogleError(null);
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      setGoogleStep('otp');
      setGoogleResendTimer(30);
    }, 600);
  };

  const handleResendGoogleOtp = () => {
    if (googleResendTimer > 0) return;
    setGoogleLoading(true);
    setGoogleError(null);
    setTimeout(() => {
      setGoogleLoading(false);
      setGoogleResendTimer(30);
    }, 500);
  };

  const handleGoogleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleOtp || googleOtp.trim().length < 4) {
      setGoogleError('Please enter the 6-digit verification code.');
      return;
    }
    setGoogleError(null);
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      loginUser({
        email: googleEmail,
        name: googleEmail.split('@')[0],
      });
      setGoogleStep('success');
      setTimeout(() => {
        setIsGoogleModalOpen(false);
        onNavigateHome();
      }, 2500);
    }, 800);
  };

  const slides = CATEGORIES && CATEGORIES.length > 0 ? CATEGORIES : [
    {
      id: 'driver',
      name: 'Driver & Security Guard',
      badgeTitle: 'Driver & Security Guard',
      checkSubtitle: 'Authenticated via Govt. & Police Databases',
      price: '₹299',
      image: '',
      imageAlt: 'Verified Staff',
    },
  ];

  // Auto-advance Carousel
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      loginUser({
        email: email || 'candidate@example.com',
      });
      setIsSubmitting(false);
      setLoginSuccess(true);
      setTimeout(() => {
        onNavigateHome();
      }, 1500);
    }, 800);
  };

  const activeCategory = slides[currentSlide] || slides[0];

  return (
    <div className="login-wrapper">
      {/* ========================================================
          LEFT COLUMN: MOVING CAROUSEL WITH HOME BANNER BACKGROUND
         ======================================================== */}
      <div
        className="login-carousel-side"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Banner Image Stack with Cross-Fade */}
        <div className="carousel-bg-container">
          {slides.map((slide, idx) => (
            <img
              key={slide.id || idx}
              src={slide.image}
              alt={slide.imageAlt || slide.name}
              className={`carousel-bg-img ${idx === currentSlide ? 'active' : ''}`}
            />
          ))}
          <div className="carousel-veil-overlay" aria-hidden="true"></div>
        </div>

        {/* Carousel Top Bar: Securitas Brand Logo & Return to Home */}
        <div className="carousel-top-bar">
          <a
            href="#home"
            className="carousel-brand-logo"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
            aria-label="Return to Securitas Home"
          >
            <img src={logoimg} alt="Securitas Logo" className="carousel-brand-img" />
          </a>

          <button
            type="button"
            className="carousel-return-btn"
            onClick={onNavigateHome}
          >
            <span>← Return to Home</span>
          </button>
        </div>

        {/* Carousel Content Box (Value Proposition & Trust Proof) */}
        <div className="carousel-content-box">
          <div className="carousel-badge-pill">
            <span>🛡️ {activeCategory.badgeTitle || 'Official Verified'}</span>
          </div>

          <h2 className="carousel-title">
            Verified Peace of Mind.<br />
            <span className="carousel-title-highlight">In Minutes, Not Days.</span>
          </h2>

          <p className="carousel-desc">
            {activeCategory.checkSubtitle ||
              'Access authentic criminal, police, court, address, and employment records across official national databases.'}
          </p>

          {/* Frosted Feature Snapshot Card */}
          <div className="carousel-snapshot-card">
            <div className="snapshot-icon">✓</div>
            <div className="snapshot-text-wrap">
              <span className="snapshot-title">
                {activeCategory.name} Verification
              </span>
              <span className="snapshot-sub">
                Pre-screened &amp; Audit-Ready • Starting at {activeCategory.price}
              </span>
            </div>
          </div>
        </div>

        {/* Carousel Bottom Controls: Dots, Counter, Arrows */}
        <div className="carousel-bottom-bar">
          <div className="carousel-indicators-group">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <span className="carousel-slide-counter">
            0{currentSlide + 1} / 0{slides.length}
          </span>

          <div className="carousel-nav-arrows">
            <button
              type="button"
              className="carousel-arrow-btn"
              onClick={handlePrevSlide}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="carousel-arrow-btn"
              onClick={handleNextSlide}
              aria-label="Next slide"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: LUXURY LOGIN FORM
         ======================================================== */}
      <div className="login-form-side">
        {/* Top Utility Row: Theme Switcher & Mobile Return Button */}
        <div className="login-form-top-row">
          <button
            type="button"
            className="login-mobile-return"
            onClick={onNavigateHome}
          >
            ← Back to Home
          </button>

          {/* Theme Switcher Toggle on Login Page */}
          <button
            type="button"
            className={`theme-toggle-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{ marginLeft: 'auto' }}
          >
            <span className="toggle-track">
              <span className="toggle-icon-wrap sun-wrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </span>
              <span className="toggle-icon-wrap moon-wrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
              <span className="toggle-thumb">
                {theme === 'dark' ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="5" />
                  </svg>
                )}
              </span>
            </span>
          </button>
        </div>

        {/* Center Box: Login Form */}
        <div className="login-form-center-box">
          <div className="login-header-area">
            <div className="login-portal-pill">
              <span>✨ Client Portal</span>
            </div>
            <h1 className="login-main-title">Welcome back</h1>
            <p className="login-main-subtext">
              Enter your credentials to access your verification reports and digital dossiers.
            </p>
          </div>

          {/* Form */}
          {loginSuccess ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎉</div>
              <h3 className="login-main-title" style={{ fontSize: '24px' }}>
                Authentication Successful!
              </h3>
              <p className="login-main-subtext">Redirecting you to your dashboard...</p>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="login-field-wrap">
                <label className="login-field-label">Email Address</label>
                <div className="login-input-box">
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="login-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="login-field-wrap">
                <label className="login-field-label">Password</label>
                <div className="login-input-box">
                  <span className="login-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Helper Row: Remember Me & Forgot Password */}
              <div className="login-helper-row">
                <label className="login-remember-label">
                  <input
                    type="checkbox"
                    className="login-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember this device</span>
                </label>

                <a
                  href="#forgot-password"
                  className="login-forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link sent to registered email.');
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button (Screen 1 Glowing Gradient) */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Securitas'}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          )}

          {/* Alternate SSO Logins */}
          <div className="login-divider-row">
            <div className="login-divider-line"></div>
            <span className="login-divider-text">Or continue with</span>
            <div className="login-divider-line"></div>
          </div>


    
          {/* Form Footer */}
          <div className="login-form-footer">
            <span style={{ display: 'block', marginBottom: '1rem' }}>Don&apos;t have an account? Registered With</span>
        

          <div className="login-sso-grid">
            <button
              type="button"
              className="login-sso-btn"
              onClick={handleOpenGoogleModal}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
            <div className="login-trust-footnote">
              <span>🔒 256-Bit SSL Encrypted • ISO 27001 Certified</span>
            </div>
          </div>
        </div>
          </div>

      </div>

      {/* ========================================================
          GOOGLE REGISTRATION & OTP VERIFICATION POPUP MODAL
         ======================================================== */}
      {isGoogleModalOpen && (
        <div className="google-auth-modal-overlay" onClick={handleCloseGoogleModal}>
          <div className="google-auth-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              type="button"
              className="google-modal-close-btn"
              onClick={handleCloseGoogleModal}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Google Brand Header */}
            <div className="google-modal-header">
              <div className="google-icon-disc">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="google-modal-title">
                {googleStep === 'email' && 'Sign in with Google'}
                {googleStep === 'otp' && 'Verify Your Email'}
                {googleStep === 'success' && 'Registered Successfully!'}
              </h3>
              <p className="google-modal-subtext">
                {googleStep === 'email' && 'Enter your Google email address to register or access your account.'}
                {googleStep === 'otp' && 'Enter the 6-digit verification code sent to your Google account.'}
                {googleStep === 'success' && 'Your account has been registered and verified successfully.'}
              </p>
            </div>

            {/* Error Alert */}
            {googleError && (
              <div className="google-modal-error">
                <span>⚠️</span>
                <span>{googleError}</span>
              </div>
            )}

            {/* STEP 1: EMAIL INPUT */}
            {googleStep === 'email' && (
              <form onSubmit={handleGoogleEmailSubmit} className="google-modal-form">
                <div className="login-field-wrap">
                  <label className="login-field-label">Google Email Address</label>
                  <div className="login-input-box">
                    <span className="login-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="login-input"
                      placeholder="yourname@gmail.com"
                      value={googleEmail}
                      onChange={(e) => {
                        setGoogleEmail(e.target.value);
                        if (googleError) setGoogleError(null);
                      }}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="google-modal-submit-btn"
                  disabled={googleLoading || !googleEmail.trim()}
                >
                  {googleLoading ? (
                    <span className="google-btn-spinner-wrap">
                      <span className="google-spinner" />
                      <span>Sending OTP...</span>
                    </span>
                  ) : (
                    <>
                      <span>Continue &amp; Send OTP</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP INPUT */}
            {googleStep === 'otp' && (
              <form onSubmit={handleGoogleOtpSubmit} className="google-modal-form">
                <div className="google-email-target-row">
                  <span className="google-target-pill">📧 {googleEmail}</span>
                  <button
                    type="button"
                    className="google-edit-email-btn"
                    onClick={() => {
                      setGoogleStep('email');
                      setGoogleError(null);
                    }}
                  >
                    Change
                  </button>
                </div>

                <div className="login-field-wrap" style={{ textAlign: 'center' }}>
                  <label className="login-field-label" style={{ textAlign: 'center' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="google-otp-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className="google-otp-field"
                      placeholder="123456"
                      value={googleOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setGoogleOtp(val);
                        if (googleError) setGoogleError(null);
                      }}
                      autoFocus
                      required
                    />
                  </div>
                  <span className="google-demo-hint">
                    💡 Demo OTP: Enter <strong>123456</strong> or any 6 digits
                  </span>
                </div>

                <div className="google-resend-row">
                  {googleResendTimer > 0 ? (
                    <span className="google-timer-text">Resend code in {googleResendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      className="google-resend-btn"
                      onClick={handleResendGoogleOtp}
                      disabled={googleLoading}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="google-modal-submit-btn"
                  disabled={googleLoading || googleOtp.length < 4}
                >
                  {googleLoading ? (
                    <span className="google-btn-spinner-wrap">
                      <span className="google-spinner" />
                      <span>Verifying &amp; Registering...</span>
                    </span>
                  ) : (
                    <>
                      <span>Verify &amp; Register</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {googleStep === 'success' && (
              <div className="google-success-box">
                <div className="google-success-disc">✓</div>
                <h4 className="google-success-title">You have registered successfully!</h4>
                <p className="google-success-desc">
                  Welcome to Securitas! Your Google account is now registered and verified.
                </p>
                <div className="google-success-user-card">
                  <span className="google-user-icon">👤</span>
                  <div className="google-user-info">
                    <span className="google-user-name">
                      {googleEmail.split('@')[0]}
                    </span>
                    <span className="google-user-email">{googleEmail}</span>
                  </div>
                  <span className="google-verified-badge">✓ Active</span>
                </div>
                <button
                  type="button"
                  className="google-modal-submit-btn"
                  onClick={() => {
                    setIsGoogleModalOpen(false);
                    onNavigateHome();
                  }}
                >
                  <span>Proceed to Dashboard</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
