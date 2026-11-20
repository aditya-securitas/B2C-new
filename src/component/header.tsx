import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/header.css';
import logoimg from '../assets/img/securitas_ab_logo.png';
import { useAuth } from '../utils/auth';

interface HeaderProps {
  onLoginClick?: () => void;
  onVerifyClick?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  currentPage?: string;
  activeServiceRole?: string;
  onNavigate?: (page: string, role?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoginClick,
  onVerifyClick,
  theme = 'light',
  onToggleTheme,
  currentPage = 'home',
  activeServiceRole = 'all',
  onNavigate,
}) => {
  const { isLoggedIn, user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'verify' | 'help' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileVerifyOpen, setMobileVerifyOpen] = useState(false);
  const [mobileHelpOpen, setMobileHelpOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Smooth hover support with anti-flicker delay
  const handleMouseEnter = (menu: 'verify' | 'help') => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 300);
  };

  // Toggle on click for touch screens and click users
  const handleToggleDropdown = (menu: 'verify' | 'help') => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  // Reliable navigation and target scrolling across pages
  const handleDropdownItemClick = useCallback(
    (targetHash?: string) => {
      setOpenDropdown(null);
      setMobileMenuOpen(false);

      if (targetHash === 'chatbot') {
        window.dispatchEvent(new CustomEvent('securitas-open-chat'));
        return;
      }

      if (targetHash) {
        if (currentPage !== 'home' && onNavigate) {
          onNavigate('home');
          // Allow React component to mount before querying DOM
          setTimeout(() => {
            const el = document.querySelector(targetHash);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 160);
        } else {
          const el = document.querySelector(targetHash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    },
    [currentPage, onNavigate]
  );

  return (
    <header ref={headerRef} className={`header-wrapper ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="header-nav" aria-label="Main Navigation">
        {/* Brand Logo matching Screen 1 */}
        <a
          href="#home"
          className="brand-logo"
          onClick={(e) => {
            e.preventDefault();
            setOpenDropdown(null);
            if (onNavigate) {
              onNavigate('home');
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          aria-label="Securitas Home"
        >
          <img src={logoimg} alt="Securitas Logo" className="brand-logo-img" />
        </a>

        {/* Desktop Navigation Links */}
        <div className="nav-links">
          <a
            href="#home"
            className={`nav-item ${currentPage === 'home' && !openDropdown ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setOpenDropdown(null);
              if (onNavigate) {
                onNavigate('home');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <span>Home</span>
          </a>

          {/* Services (All 18 Checks) Page Link */}
          <a
            href="#services"
            className={`nav-item ${currentPage === 'services' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setOpenDropdown(null);
              if (onNavigate) {
                onNavigate('services');
              } else {
                window.location.hash = '#services';
              }
            }}
          >
            <span>Services</span>
          </a>

          {/* Verify Now Dropdown (Hover + Click supported) */}
          <div
            className={`nav-dropdown-wrapper ${openDropdown === 'verify' ? 'is-open' : ''}`}
            onMouseEnter={() => handleMouseEnter('verify')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`nav-item dropdown-toggle ${
                openDropdown === 'verify'
                  ? 'dropdown-active'
                  : ['self-verification', 'driver-verification', 'maid-verification', 'tenant-verification'].includes(currentPage)
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleToggleDropdown('verify')}
              aria-expanded={openDropdown === 'verify'}
              aria-haspopup="true"
            >
              <span>Verify Now</span>
              <svg
                className={`dropdown-chevron ${openDropdown === 'verify' ? 'chevron-up' : ''}`}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div
              className={`dropdown-panel ${openDropdown === 'verify' ? 'is-open' : ''}`}
              role="menu"
              aria-hidden={openDropdown !== 'verify'}
              onMouseEnter={() => handleMouseEnter('verify')}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href="#driverVerification"
                className={`dropdown-item ${currentPage === 'driver-verification' ? 'item-active' : ''}`}
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenDropdown(null);
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('driver-verification');
                  } else {
                    window.location.hash = '#driverVerification';
                  }
                }}
              >
                <span className="item-icon">🚗</span>
                <div className="item-content">
                  <span className="item-title">Driver &amp; Security Guard</span>
                  <span className="item-desc">DL, Police, Criminal Litigations</span>
                </div>
              </a>

              <a
                href="#maidVerification"
                className={`dropdown-item ${currentPage === 'maid-verification' ? 'item-active' : ''}`}
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenDropdown(null);
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('maid-verification');
                  } else {
                    window.location.hash = '#maidVerification';
                  }
                }}
              >
                <span className="item-icon">🏠</span>
                <div className="item-content">
                  <span className="item-title">Domestic Help &amp; Maid</span>
                  <span className="item-desc">Aadhaar, Address &amp; Police Verification</span>
                </div>
              </a>

              <a
                href="#tenantVerification"
                className={`dropdown-item ${currentPage === 'tenant-verification' ? 'item-active' : ''}`}
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenDropdown(null);
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('tenant-verification');
                  } else {
                    window.location.hash = '#tenantVerification';
                  }
                }}
              >
                <span className="item-icon">🔑</span>
                <div className="item-content">
                  <span className="item-title">Tenant Background</span>
                  <span className="item-desc">Court Litigation, Rental History</span>
                </div>
              </a>

              <a
                href="#selfVerification"
                className={`dropdown-item ${currentPage === 'self-verification' ? 'item-active' : ''}`}
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenDropdown(null);
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('self-verification');
                  } else {
                    window.location.hash = '#selfVerification';
                  }
                }}
              >
                <span className="item-icon">👤</span>
                <div className="item-content">
                  <span className="item-title">Self Verification</span>
                  <span className="item-desc">Personal Audit-Ready Digital Dossier</span>
                </div>
              </a>

              {/* All 18 Checks Link in Dropdown */}
              <a
                href="#services"
                className={`dropdown-item ${currentPage === 'services' ? 'item-active' : ''}`}
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenDropdown(null);
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('services');
                  } else {
                    window.location.hash = '#services';
                  }
                }}
              >
                <span className="item-icon">📋</span>
                <div className="item-content">
                  <span className="item-title">All 18 Verification Checks</span>
                  <span className="item-desc">Aadhaar, PAN, Address, Police &amp; Criminal scan</span>
                </div>
              </a>
            </div>
          </div>

          {/* Help Desk Dropdown (Hover + Click supported) */}
          <div
            className={`nav-dropdown-wrapper ${openDropdown === 'help' ? 'is-open' : ''}`}
            onMouseEnter={() => handleMouseEnter('help')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`nav-item dropdown-toggle ${openDropdown === 'help' ? 'dropdown-active' : ''}`}
              onClick={() => handleToggleDropdown('help')}
              aria-expanded={openDropdown === 'help'}
              aria-haspopup="true"
            >
              <span>Help Desk</span>
              <svg
                className={`dropdown-chevron ${openDropdown === 'help' ? 'chevron-up' : ''}`}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div
              className={`dropdown-panel dropdown-panel-sm ${openDropdown === 'help' ? 'is-open' : ''}`}
              role="menu"
              aria-hidden={openDropdown !== 'help'}
              onMouseEnter={() => handleMouseEnter('help')}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href="#how-it-works"
                className="dropdown-item"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  handleDropdownItemClick('#how-it-works');
                }}
              >
                <span className="item-icon">⚡</span>
                <div className="item-content">
                  <span className="item-title">How It Works</span>
                  <span className="item-desc">5-step fast digital check</span>
                </div>
              </a>

              <a
                href="#chatbot"
                className="dropdown-item"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  handleDropdownItemClick('chatbot');
                }}
              >
                <span className="item-icon">💬</span>
                <div className="item-content">
                  <span className="item-title">Instant Support</span>
                  <span className="item-desc">24/7 dedicated AI verification help</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Header Right Action: Theme Switcher, Screen 1 Glowing Pill Login Button, & Mobile Hamburger */}
        <div className="nav-actions">
          {/* Modern Theme Toggle Switch (Sun / Moon) */}
          <button
            type="button"
            className={`theme-toggle-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
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

          {isLoggedIn && user ? (
            <div className="header-user-profile-wrap">
              <button
                type="button"
                className="header-user-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
                title={`Signed in as ${user.name}`}
              >
                <span className="header-user-avatar">{user.avatar || '👤'}</span>
                <span className="header-user-name">{user.name.split(' ')[0]}</span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div className="header-user-dropdown">
                  <div className="header-user-meta">
                    <span className="header-user-fullname">{user.name}</span>
                    <span className="header-user-email">{user.email || user.phone}</span>
                  </div>
                  <button
                    type="button"
                    className="header-user-logout-btn"
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn-login"
              onClick={onLoginClick}
              aria-label="Login to Securitas"
            >
              <span>Login</span>
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className={`bar ${mobileMenuOpen ? 'open-1' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open-2' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open-3' : ''}`}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer with Accordion Sub-Menus */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <a
            href="#home"
            className={currentPage === 'home' ? 'mobile-nav-active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              if (onNavigate) {
                onNavigate('home');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            Home
          </a>

          {/* Mobile Accordion: Verify Now */}
          <button
            type="button"
            className={`mobile-accordion-toggle ${mobileVerifyOpen ? 'expanded' : ''}`}
            onClick={() => setMobileVerifyOpen(!mobileVerifyOpen)}
            aria-expanded={mobileVerifyOpen}
          >
            <span>🛡️ Verify Now</span>
            <svg
              className={`mobile-accordion-chevron ${mobileVerifyOpen ? 'up' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {mobileVerifyOpen && (
            <div className="mobile-accordion-content">
              <a
                href="#driverVerification"
                className={`mobile-sub-link ${currentPage === 'driver-verification' ? 'mobile-nav-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('driver-verification');
                  } else {
                    window.location.hash = '#driverVerification';
                  }
                }}
              >
                <span>🚗</span>
                <span>Driver &amp; Security Guard</span>
              </a>
              <a
                href="#maidVerification"
                className={`mobile-sub-link ${currentPage === 'maid-verification' ? 'mobile-nav-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('maid-verification');
                  } else {
                    window.location.hash = '#maidVerification';
                  }
                }}
              >
                <span>🏠</span>
                <span>Domestic Help &amp; Maid</span>
              </a>
              <a
                href="#tenantVerification"
                className={`mobile-sub-link ${currentPage === 'tenant-verification' ? 'mobile-nav-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('tenant-verification');
                  } else {
                    window.location.hash = '#tenantVerification';
                  }
                }}
              >
                <span>🔑</span>
                <span>Tenant Background</span>
              </a>
              <a
                href="#selfVerification"
                className={`mobile-sub-link ${currentPage === 'self-verification' ? 'mobile-nav-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('self-verification');
                  } else {
                    window.location.hash = '#selfVerification';
                  }
                }}
              >
                <span>👤</span>
                <span>Self Verification (Instant Dossier)</span>
              </a>
              <a
                href="#services"
                className={`mobile-sub-link ${currentPage === 'services' ? 'mobile-nav-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  if (onNavigate) {
                    onNavigate('services', 'all');
                  } else {
                    window.location.hash = '#services';
                  }
                }}
              >
                <span>📋</span>
                <span>All 18 Verification Checks</span>
              </a>
            </div>
          )}

          {/* Direct link to Services Page */}
          <a
            href="#services"
            className={currentPage === 'services' ? 'mobile-nav-active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              if (onNavigate) {
                onNavigate('services');
              } else {
                window.location.hash = '#services';
              }
            }}
          >
            📋 All Services &amp; 18 Checks
          </a>

          {/* Mobile Accordion: Help Desk */}
          <button
            type="button"
            className={`mobile-accordion-toggle ${mobileHelpOpen ? 'expanded' : ''}`}
            onClick={() => setMobileHelpOpen(!mobileHelpOpen)}
            aria-expanded={mobileHelpOpen}
          >
            <span>💬 Help Desk</span>
            <svg
              className={`mobile-accordion-chevron ${mobileHelpOpen ? 'up' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {mobileHelpOpen && (
            <div className="mobile-accordion-content">
              <a
                href="#how-it-works"
                className="mobile-sub-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleDropdownItemClick('#how-it-works');
                }}
              >
                <span>⚡</span>
                <span>How It Works (5-step process)</span>
              </a>
              <a
                href="#chatbot"
                className="mobile-sub-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleDropdownItemClick('chatbot');
                }}
              >
                <span>💬</span>
                <span>Instant Support (24/7 AI Chat)</span>
              </a>
            </div>
          )}

          {/* Mobile Drawer Theme Row */}
          <div className="mobile-theme-row">
            <span className="mobile-theme-label">
              <span>Theme Mode:</span>
              <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
            </span>
            <button
              type="button"
              className={`theme-toggle-switch ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
              onClick={onToggleTheme}
              aria-label="Toggle theme mode"
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

          {isLoggedIn && user ? (
            <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span className="header-user-avatar">{user.avatar || '👤'}</span>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{user.name}</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{user.email || user.phone}</span>
                </div>
              </div>
              <button
                type="button"
                className="header-user-logout-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                <span>🚪 Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-login mobile-login"
              onClick={() => {
                onLoginClick?.();
                setMobileMenuOpen(false);
              }}
            >
              <span>Login</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
