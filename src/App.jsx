import React, { useState, useEffect } from 'react';
import Header from './component/header';
import Home from './pages/home';
import SelfVerification from './pages/self-verification';
import RoleVerificationPage from './pages/role-verification';
import ServicesPage from './pages/services';
import LoginPage from './pages/login';
import Footer from './component/footer';
import Chatbot from './component/chatbot';
import './styles/App.css';

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('securitas_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  // Helper to parse route and role from hash
  const parseHashRoute = () => {
    const rawHash = window.location.hash || '';
    const hash = rawHash.toLowerCase();
    if (hash.includes('driververification') || hash.includes('driver')) {
      return { page: 'driver-verification', role: 'driver' };
    }
    if (hash.includes('maidverification') || hash.includes('maid') || hash.includes('domestic')) {
      return { page: 'maid-verification', role: 'maid' };
    }
    if (hash.includes('tenantverification') || hash.includes('tenant')) {
      return { page: 'tenant-verification', role: 'tenant' };
    }
    if (hash.includes('self-verification') || hash.includes('selfverification')) {
      return { page: 'self-verification', role: 'self' };
    }
    if (hash.includes('services')) {
      return { page: 'services', role: 'all' };
    }
    if (hash.includes('login')) {
      return { page: 'login', role: 'all' };
    }
    return { page: 'home', role: 'all' };
  };

  const initialRoute = parseHashRoute();
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [activeServiceRole, setActiveServiceRole] = useState(initialRoute.role);

  useEffect(() => {
    const handleHashChange = () => {
      const { page, role } = parseHashRoute();
      setCurrentPage(page);
      setActiveServiceRole(role);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    try {
      localStorage.setItem('securitas_theme', theme);
    } catch {
      // storage unavailable
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const navigateTo = (page, role = 'all') => {
    let targetPage = page;
    if (page === 'services' && role === 'driver') targetPage = 'driver-verification';
    else if (page === 'services' && role === 'maid') targetPage = 'maid-verification';
    else if (page === 'services' && role === 'tenant') targetPage = 'tenant-verification';

    setCurrentPage(targetPage);
    setActiveServiceRole(role);

    if (targetPage === 'driver-verification') {
      window.location.hash = '#driverVerification';
    } else if (targetPage === 'maid-verification') {
      window.location.hash = '#maidVerification';
    } else if (targetPage === 'tenant-verification') {
      window.location.hash = '#tenantVerification';
    } else if (targetPage === 'self-verification') {
      window.location.hash = '#selfVerification';
    } else if (targetPage === 'services') {
      window.location.hash = '#services';
    } else if (targetPage === 'login') {
      window.location.hash = '#login';
    } else {
      window.location.hash = '#home';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginClick = () => {
    navigateTo('login');
  };

  const handleVerifyClick = () => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      window.location.hash = '#home';
      setTimeout(() => {
        const el = document.querySelector('#verify-solutions');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector('#verify-solutions');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 500, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={`app-container ${theme === 'dark' ? 'dark-mode' : 'light-mode'}`}>
      {currentPage === 'login' ? (
        <LoginPage
          onNavigateHome={() => navigateTo('home')}
          onNavigateSelfVerify={() => navigateTo('self-verification')}
          onNavigateServices={(role) => navigateTo('services', role || 'all')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <>
          {/* Floating Pill Header with Theme Switcher & Page Navigation */}
          <Header
            onLoginClick={handleLoginClick}
            onVerifyClick={handleVerifyClick}
            theme={theme}
            onToggleTheme={toggleTheme}
            currentPage={currentPage}
            activeServiceRole={activeServiceRole}
            onNavigate={navigateTo}
          />

          {/* Dynamic View: Home, Self Verification, Dedicated Role Verifications, or Services */}
          {currentPage === 'self-verification' ? (
            <SelfVerification
              onNavigateHome={() => navigateTo('home')}
              onNavigateServices={() => navigateTo('services')}
            />
          ) : currentPage === 'driver-verification' ? (
            <RoleVerificationPage
              role="driver"
              onNavigateHome={() => navigateTo('home')}
              onNavigateServices={() => navigateTo('services')}
              onNavigateRole={(r) => navigateTo(`${r}-verification`)}
            />
          ) : currentPage === 'maid-verification' ? (
            <RoleVerificationPage
              role="maid"
              onNavigateHome={() => navigateTo('home')}
              onNavigateServices={() => navigateTo('services')}
              onNavigateRole={(r) => navigateTo(`${r}-verification`)}
            />
          ) : currentPage === 'tenant-verification' ? (
            <RoleVerificationPage
              role="tenant"
              onNavigateHome={() => navigateTo('home')}
              onNavigateServices={() => navigateTo('services')}
              onNavigateRole={(r) => navigateTo(`${r}-verification`)}
            />
          ) : currentPage === 'services' ? (
            <ServicesPage
              onNavigateHome={() => navigateTo('home')}
              onNavigateSelfVerify={() => navigateTo('self-verification')}
              onNavigateLogin={() => navigateTo('login')}
              roleFilter={activeServiceRole}
              onRoleChange={(newRole) => {
                if (newRole === 'driver') navigateTo('driver-verification');
                else if (newRole === 'maid') navigateTo('maid-verification');
                else if (newRole === 'tenant') navigateTo('tenant-verification');
                else navigateTo('services', 'all');
              }}
            />
          ) : (
            <Home
              onNavigateSelfVerify={() => navigateTo('self-verification')}
              onNavigateDriverVerify={() => navigateTo('driver-verification')}
              onNavigateMaidVerify={() => navigateTo('maid-verification')}
              onNavigateTenantVerify={() => navigateTo('tenant-verification')}
              onNavigateLogin={() => navigateTo('login')}
              onNavigateServices={(role) => navigateTo('services', role || 'all')}
            />
          )}

          {/* Modern Footer */}
          <Footer />
        </>
      )}

      {/* Floating Global Securitas Verification Assistant / Chatbot */}
      <Chatbot onNavigate={navigateTo} currentPage={currentPage} />
    </div>
  );
}

export default App;
