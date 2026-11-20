  import React, { useState, useEffect } from 'react';
  import '../styles/self-verification.css';
  import { CATEGORIES } from './home';
  import selfVerifyHumanImg from '../assets/img/self-verification.jpg';
  import OCRModal, { DocumentType } from '../component/ocr-modal';
  import RazorpayGatewayModal from '../component/razorpay-gateway-modal';
  import SelfVerificationProcessVisual from '../component/self-verification-process-visual';
  import { useAuth } from '../utils/auth';
  import LoginModal, { PendingCheckInfo } from '../component/login-modal';

  interface CheckItem {
    id: string;
    name: string;
    type: 'instant' | 'recommended';
    price: number;
    tat: string;
    icon: string;
    description: string;
    tags: string[];
  }

  const INSTANT_CHECKS: CheckItem[] = [
    {
      id: 'id-check',
      name: 'Identity Check',
      type: 'instant',
      price: 249,
      tat: '⚡ < 2 Mins',
      icon: '🪪',
      description: 'Instant algorithmic cross-check against official UIDAI & NSDL government databases.',
      tags: ['Aadhaar & PAN', 'NSDL API', 'Instant Match'],
    },
    {
      id: 'address-proof',
    name: 'Address Proof Check',
    type: 'instant',
    price: 299,
    tat: '⚡ Instant',
    icon: '🏠',
    description: 'Cross-verification of permanent and current address with utility & public records.',
    tags: ['Voter ID', 'Electricity Reg', 'Address Match'],
  },
  {
    id: 'digital-address',
    name: 'Digital Address Verification',
    type: 'instant',
    price: 349,
    tat: '⏱️ < 2 Hours',
    icon: '📍',
    description: 'Automated geo-stamped photo capture, physical GPS radius, and cellular validation.',
    tags: ['Geo-Tagging', 'Physical Lat-Long', 'Photo Proof'],
  },
];

const RECOMMENDED_CHECKS: CheckItem[] = [
  {
    id: 'id-verification',
    name: 'Identity Verification',
    type: 'recommended',
    price: 199,
    tat: '⏱️ Same Day',
    icon: '🛡️',
    description: 'Comprehensive multi-document identity authentication across 5 national repositories.',
    tags: ['Driving License', 'Passport', 'Aadhaar'],
  },
  {
    id: 'criminal-check',
    name: 'Criminal Check',
    type: 'recommended',
    price: 799,
    tat: '⏱️ 3-5 Days',
    icon: '⚖️',
    description: 'Comprehensive civil and criminal record scan across 20,000+ e-Courts and High Courts.',
    tags: ['Court Litigations', 'FIR Scan', 'Police Database'],
  },
  {
    id: 'employment-history',
    name: 'Employment History',
    type: 'recommended',
    price: 649,
    tat: '⏱️ 3-5 Days',
    icon: '💼',
    description: 'Validation of past designations, EPFO salary contributions, tenure, and exit feedback.',
    tags: ['EPFO Verified', 'HR Authentication', 'Past Tenure'],
  },
  {
    id: 'education-credentials',
    name: 'Education Credentials',
    type: 'recommended',
    price: 499,
    tat: '⏱️ 3-5 Days',
    icon: '🎓',
    description: 'Official verification of degrees and marksheets directly with accredited universities.',
    tags: ['UGC Verified', 'Roll No Check', 'Mark Sheet'],
  },
];

const getDocsForSelfCheck = (id: string): DocumentType[] => {
  switch (id) {
    case 'id-check':
      return ['aadhaar', 'pan'];
    case 'address-proof':
      return ['utility_bill', 'aadhaar', 'voter_id'];
    case 'digital-address':
      return ['utility_bill', 'aadhaar'];
    case 'id-verification':
      return ['driving_license', 'passport', 'aadhaar'];
    case 'criminal-check':
      return ['aadhaar', 'pan', 'voter_id'];
    case 'employment-history':
      return ['pan', 'aadhaar'];
    case 'education-credentials':
      return ['academic_cert'];
    default:
      return ['aadhaar'];
  }
};

interface SelfVerificationProps {
  onNavigateHome: () => void;
  onNavigateServices?: (role?: string) => void;
}

export const SelfVerification: React.FC<SelfVerificationProps> = ({ onNavigateHome, onNavigateServices }) => {
  const [selectedChecks, setSelectedChecks] = useState<{ [id: string]: number }>({});
  const [showModal, setShowModal] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);

  // OCR Pop-up State
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrCheckDetails, setOcrCheckDetails] = useState<{
    title: string;
    price: string | number;
    docType: DocumentType;
    allowedDocTypes?: DocumentType[];
  }>({
    title: 'Self Verification Check',
    price: '₹ 249',
    docType: 'aadhaar',
    allowedDocTypes: ['aadhaar'],
  });

  const handleOpenOCR = (
    title: string,
    price: string | number,
    docType: DocumentType = 'aadhaar',
    allowedDocTypes?: DocumentType[]
  ) => {
    setOcrCheckDetails({
      title,
      price,
      docType,
      allowedDocTypes: allowedDocTypes || [docType],
    });
    setOcrModalOpen(true);
  };

  const heroImage = (CATEGORIES && CATEGORIES.find((c) => c.id === 'self-check')?.image) || selfVerifyHumanImg;

  // Authentication State & Check Selection Guard
  const { isLoggedIn } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingCheckToSelect, setPendingCheckToSelect] = useState<PendingCheckInfo | null>(null);
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  const allChecks = [...INSTANT_CHECKS, ...RECOMMENDED_CHECKS];

  const requestLoginForCheck = (id: string, name?: string, price?: number, icon?: string) => {
    const item = allChecks.find((c) => c.id === id);
    setPendingCheckToSelect({
      id,
      name: name || (item ? item.name : 'Verification Check'),
      price: price || item?.price,
      icon: icon || item?.icon || '🪪',
    });
    setLoginModalOpen(true);
  };

  const handleIncrement = (id: string) => {
    if (!isLoggedIn) {
      requestLoginForCheck(id);
      return;
    }
    setSelectedChecks((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleDecrement = (id: string) => {
    setSelectedChecks((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const handleToggleAdd = (id: string) => {
    if (!isLoggedIn && !selectedChecks[id]) {
      requestLoginForCheck(id);
      return;
    }
    setSelectedChecks((prev) => {
      if (prev[id]) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const totalCount = Object.values(selectedChecks).reduce((acc, count) => acc + count, 0);

  const totalPrice = Object.entries(selectedChecks).reduce((acc, [id, count]) => {
    const item = allChecks.find((c) => c.id === id);
    return acc + (item ? item.price * count : 0);
  }, 0);

  const handleSelectAllBundle = () => {
    if (!isLoggedIn) {
      setPendingCheckToSelect({
        id: 'bundle-all',
        name: 'All Self-Verification Checks Bundle',
        icon: '⚡',
        price: totalPrice || 899,
      });
      setLoginModalOpen(true);
      return;
    }
    const bundle: { [id: string]: number } = {};
    allChecks.forEach((c) => {
      bundle[c.id] = 1;
    });
    setSelectedChecks(bundle);
  };

  const handleLoginModalSuccess = (checkToSelect?: PendingCheckInfo | null) => {
    setLoginModalOpen(false);
    if (checkToSelect) {
      if (checkToSelect.id === 'bundle-all') {
        const bundle: { [id: string]: number } = {};
        allChecks.forEach((c) => {
          bundle[c.id] = 1;
        });
        setSelectedChecks(bundle);
        setAuthSuccessToast(`✓ Logged in! Selected All ${allChecks.length} Checks Bundle.`);
      } else {
        setSelectedChecks((prev) => ({
          ...prev,
          [checkToSelect.id]: (prev[checkToSelect.id] || 0) + 1,
        }));
        setAuthSuccessToast(`✓ Logged in! Added "${checkToSelect.name}" to your order.`);
      }
      setTimeout(() => setAuthSuccessToast(null), 4000);
    }
  };

  const scrollToChecks = () => {
    const el = document.getElementById('checks-selection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Check Link Sharing
  const [copiedCheckId, setCopiedCheckId] = useState<string | null>(null);

  const handleCopyCheckLink = (checkId: string, checkName: string) => {
    const url = `${window.location.origin}${window.location.pathname}#selfVerification?check=${checkId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedCheckId(checkId);
        setAuthSuccessToast(`🔗 Share link for "${checkName}" copied! Ready to send.`);
        setTimeout(() => setCopiedCheckId(null), 2500);
        setTimeout(() => setAuthSuccessToast(null), 3500);
      });
    } else {
      prompt('Copy this check link:', url);
    }
  };

  // Auto-scroll and highlight check if present in URL parameter
  useEffect(() => {
    const hash = window.location.hash || '';
    const match = hash.match(/check[=-]([a-zA-Z0-9_-]+)/i) || window.location.search.match(/check=([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      const targetId = match[1];
      setTimeout(() => {
        const el = document.getElementById(`check-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('sv-check-card-highlighted');
          setTimeout(() => el.classList.remove('sv-check-card-highlighted'), 3500);
        }
      }, 400);
    }
  }, []);

  const handlePaymentSuccess = (details: { paymentId: string; method: string }) => {
    setRazorpayModalOpen(false);

    const selectedIds = Object.keys(selectedChecks);
    const selectedItems = allChecks.filter((c) => selectedChecks[c.id]);

    // Aggregate all required/allowed docs across all selected checks
    const allowedDocs: DocumentType[] = [];
    selectedIds.forEach((id) => {
      const docs = getDocsForSelfCheck(id);
      docs.forEach((d) => {
        if (!allowedDocs.includes(d)) allowedDocs.push(d);
      });
    });

    if (allowedDocs.length === 0) allowedDocs.push('aadhaar');

    const title =
      selectedItems.length === 1
        ? selectedItems[0].name
        : `${selectedItems.length} Checks Selected (${selectedItems.map((c) => c.name).join(', ')})`;
    const price = `₹ ${totalPrice.toLocaleString('en-IN')}`;

    handleOpenOCR(title, price, allowedDocs[0], allowedDocs);
  };

  return (
    <div className="self-verify-container">
      {/* Breadcrumb Navigation Strip */}
      <div className="sv-breadcrumb-wrap">
        <nav className="sv-breadcrumb" aria-label="Breadcrumb">
          <a
            href="#home"
            className="sv-breadcrumb-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
          >
            <span>Home</span>
          </a>
          <span className="sv-breadcrumb-sep">›</span>
          <span className="sv-breadcrumb-link" onClick={scrollToChecks}>
            <span>Verify Services</span>
          </span>
          <span className="sv-breadcrumb-sep">›</span>
          <span className="sv-breadcrumb-current">
            <span className="sv-breadcrumb-dot"></span>
            <span>Self Verification</span>
          </span>
        </nav>
      </div>

      {/* ========================================================
          HERO STAGE CANVAS CARD
         ======================================================== */}
      <section className="sv-hero-section">
        <div className="sv-hero-stage-card">
          <div className="sv-hero-ambient-glow" aria-hidden="true"></div>

          <div className="sv-hero-grid">
            {/* Left Column: Headline & Action */}
            <div className="sv-hero-left">
              <div className="sv-eyebrow-badge">
                <span>🛡️ Official Audit-Ready Dossier • 100% Private</span>
              </div>

              <h1 className="sv-hero-title">
                Verify Yourself.<br />
                <span className="sv-emerald-text">In Minutes, Not Days.</span>
              </h1>

              <p className="sv-hero-subtitle">
                Verify your identity, employment, court records, address, credit history, and more,
                so you can spot fraud, uncover identity misuse, and stay in control with confidence.
              </p>

              {/* Trust Pill Highlights Strip */}
              <div className="sv-trust-pills-row">
                <div className="sv-trust-pill">
                  <span className="sv-pill-icon">⚡</span>
                  <span>&lt; 2 Min TAT</span>
                </div>
                <div className="sv-trust-pill">
                  <span className="sv-pill-icon">🔒</span>
                  <span>Bank-Grade 256-bit SSL</span>
                </div>
                <div className="sv-trust-pill">
                  <span className="sv-pill-icon">🏛️</span>
                  <span>Govt. Database Verified</span>
                </div>
                <div className="sv-trust-pill">
                  <span className="sv-pill-icon">🤫</span>
                  <span>100% Confidential</span>
                </div>
              </div>

              <div className="sv-hero-actions">
                <button type="button" className="sv-btn-primary" onClick={scrollToChecks}>
                  <span>Select Checks Below</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </button>

                <button type="button" className="sv-btn-secondary" onClick={handleSelectAllBundle}>
                  <span>⚡ Bundle All Checks (Save 35%)</span>
                </button>
              </div>
            </div>

            {/* Right Column: Visual Stage with Portrait and Floating Glass Badge */}
            <div className="sv-hero-right">
              <div className="sv-showcase-frame">
                <div className="sv-showcase-halo"></div>

                <div className="sv-showcase-img-wrap">
                  <img
                    src={heroImage || '/self-verification.jpg'}
                    alt="Self Verification Portrait"
                    className="sv-showcase-img"
                    onError={(e) => {
                      e.currentTarget.src = '/self-verification.jpg';
                    }}
                  />
                </div>

                {/* Floating Glassmorphic Feature Badge */}
                <div className="sv-floating-glass-badge">
                  <div className="sv-badge-icon-disc">✓</div>
                  <div className="sv-badge-content">
                    <span className="sv-badge-title">Personal Audit Dossier</span>
                    <span className="sv-badge-desc">Zero Third-Party Disclosure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION: WHY SELF VERIFICATION MATTERS?
         ======================================================== */}
      <section className="sv-section">
        <div className="sv-why-grid">
          {/* Left Visual: Holographic Animated Process Simulator */}
          <div className="sv-why-visual isv-why-visual">
            <SelfVerificationProcessVisual onStartVerification={scrollToChecks} />
          </div>

          {/* Right Content: 5 Benefits */}
          <div className="sv-why-content">
            <div className="sv-section-pill-tag">
              <span>PEACE OF MIND &amp; CAREER CONFIDENCE</span>
            </div>

            <h2 className="sv-section-title">
              Why Self Verification <span className="sv-emerald-text">Matters?</span>
            </h2>

            <p className="sv-section-desc">
              Empower your life, rent with confidence, and ace background checks before anyone asks.
              Here is how self-verification puts you in the driver&apos;s seat:
            </p>

            <div className="sv-benefits-list">
              <div className="sv-benefit-card">
                <div className="sv-benefit-check-disc">✓</div>
                <div className="sv-benefit-text-wrap">
                  <span className="sv-benefit-title">Spot Issues Early</span>
                  <span className="sv-benefit-desc">
                    Identify and dispute inaccuracies in public court records or identity databases before recruiters run a check.
                  </span>
                </div>
              </div>

              <div className="sv-benefit-card">
                <div className="sv-benefit-check-disc">✓</div>
                <div className="sv-benefit-text-wrap">
                  <span className="sv-benefit-title">Prepare for Screening</span>
                  <span className="sv-benefit-desc">
                    Walk into corporate interviews, visa appointments, and promotions with a pre-cleared, audit-ready profile.
                  </span>
                </div>
              </div>

              <div className="sv-benefit-card">
                <div className="sv-benefit-check-disc">✓</div>
                <div className="sv-benefit-text-wrap">
                  <span className="sv-benefit-title">Build Trust with Employers &amp; Landlords</span>
                  <span className="sv-benefit-desc">
                    Fast-track rental lease signings and job offers by presenting an official, tamper-proof verification dossier.
                  </span>
                </div>
              </div>

              <div className="sv-benefit-card">
                <div className="sv-benefit-check-disc">✓</div>
                <div className="sv-benefit-text-wrap">
                  <span className="sv-benefit-title">Reduce Onboarding Delays</span>
                  <span className="sv-benefit-desc">
                    Cut corporate background verification wait times from 3 weeks down to zero delay on your joining day.
                  </span>
                </div>
              </div>

              <div className="sv-benefit-card">
                <div className="sv-benefit-check-disc">✓</div>
                <div className="sv-benefit-text-wrap">
                  <span className="sv-benefit-title">Protect Against Identity Misuse</span>
                  <span className="sv-benefit-desc">
                    Uncover fraudulent loan applications, duplicate SIM registrations, or address tampering in your name.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION: HOW IT WORKS (3 STEPS)
         ======================================================== */}
      <section className="sv-section sv-how-section">
        <div className="sv-section-pill-tag">
          <span>STREAMLINED 3-STEP FLOW</span>
        </div>

        <h2 className="sv-section-title">
          How It <span className="sv-emerald-text">Works</span>
        </h2>

        <p className="sv-section-desc">
          Fast, paperless, and 100% integrated with verified government and institutional databases.
        </p>

        <div className="sv-steps-grid">
          {/* Step 1 */}
          <div className="sv-step-card">
            <div className="sv-step-glow-line"></div>
            <div className="sv-step-header">
              <div className="sv-step-num-pill">01</div>
              <div className="sv-step-icon-disc">📋</div>
            </div>
            <h3 className="sv-step-title">Select Required Checks &amp; Submit Details</h3>
            <p className="sv-step-desc">
              Choose the individual checks or bundle packages you need. Provide basic personal details in under 60 seconds.
            </p>
          </div>

          {/* Step 2 */}
          <div className="sv-step-card">
            <div className="sv-step-glow-line"></div>
            <div className="sv-step-header">
              <div className="sv-step-num-pill">02</div>
              <div className="sv-step-icon-disc">📤</div>
            </div>
            <h3 className="sv-step-title">Upload Documents &amp; Complete Digital Process</h3>
            <p className="sv-step-desc">
              Upload required identity documents securely or authenticate through DigiLocker with bank-grade encryption.
            </p>
          </div>

          {/* Step 3 */}
          <div className="sv-step-card">
            <div className="sv-step-glow-line"></div>
            <div className="sv-step-header">
              <div className="sv-step-num-pill">03</div>
              <div className="sv-step-icon-disc">📑</div>
            </div>
            <h3 className="sv-step-title">Access and Download Your Report Instantly</h3>
            <p className="sv-step-desc">
              Receive your official digital dossier with tamper-proof QR code directly in your email and customer dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION: CHECKS SELECTION (INSTANT & RECOMMENDED)
         ======================================================== */}
      <section id="checks-selection" className="sv-section sv-checks-section">
        {/* Mobile Quick Category Switcher (Flipkart App Style) */}
        <div className="sv-mobile-category-chips" role="navigation" aria-label="Quick Category Jump">
          <a
            href="#instant-checks"
            className="sv-mobile-chip active"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('instant-checks');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span>⚡ Instant Checks (3)</span>
          </a>
          <a
            href="#recommended-checks"
            className="sv-mobile-chip"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('recommended-checks');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span>🛡️ Recommended (4)</span>
          </a>
          <button
            type="button"
            className="sv-mobile-chip sv-mobile-chip-bundle"
            onClick={handleSelectAllBundle}
          >
            <span>⚡ Bundle All (Save 35%)</span>
          </button>
        </div>

        {/* Instant Checks Header */}
        <div id="instant-checks" className="sv-checks-section-head">
          <div className="sv-section-pill-tag">
            <span>REAL-TIME ALGORITHMIC VERIFICATION</span>
          </div>
          <h2 className="sv-section-title">
            Instant <span className="sv-emerald-text">Checks</span>
          </h2>
          <p className="sv-section-desc">Select checks to add to your order. Delivered immediately in under 2 minutes.</p>
        </div>

        {/* 3 Instant Checks Grid */}
        <div className="sv-checks-grid sv-grid-3">
          {INSTANT_CHECKS.map((item) => {
            const count = selectedChecks[item.id] || 0;
            const isSelected = count > 0;

            return (
              <div key={item.id} id={`check-${item.id}`} className={`sv-check-card ${isSelected ? 'is-selected' : ''}`}>
                <div className="sv-card-top-row">
                  <div className="sv-card-icon-disc">{item.icon}</div>
                  <div className="sv-card-top-actions">
                    <button
                      type="button"
                      className={`sv-copy-link-btn ${copiedCheckId === item.id ? 'copied' : ''}`}
                      title={`Copy direct link for ${item.name} to share`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCheckLink(item.id, item.name);
                      }}
                      aria-label={`Copy link for ${item.name}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span>{copiedCheckId === item.id ? '✓ Copied' : 'Share'}</span>
                    </button>

                    <div className="sv-card-pricing-badge">
                      <span className="sv-card-price">₹ {item.price}</span>
                      <span className="sv-card-tat-tag">{item.tat}</span>
                    </div>
                  </div>
                </div>

                <div className="sv-card-middle">
                  <div className="sv-card-title-row">
                    <h3 className="sv-card-title">{item.name}</h3>
                  </div>
                  <p className="sv-card-desc">{item.description}</p>
                  <div className="sv-card-tags-cloud">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="sv-tag-pill">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sv-card-bottom-actions">
                  <div className="sv-card-price-block">
                    <span className="sv-price-main">₹ {item.price}</span>
                    <span className="sv-tat-micro">{item.tat}</span>
                  </div>

                  <div className="sv-card-action-slot">
                    {isSelected ? (
                      <div className="sv-counter-wrap">
                        <button
                          type="button"
                          className="sv-counter-btn"
                          onClick={() => handleDecrement(item.id)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="sv-counter-val">{count}</span>
                        <button
                          type="button"
                          className="sv-counter-btn"
                          onClick={() => handleIncrement(item.id)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="sv-card-add-toggle"
                        onClick={() => handleToggleAdd(item.id)}
                      >
                        <span className="sv-add-icon">+</span>
                        <span>ADD</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommended Checks Header */}
        <div id="recommended-checks" className="sv-checks-section-head">
          <div className="sv-section-pill-tag">
            <span>DEEP COMPLIANCE SCREENING</span>
          </div>
          <h2 className="sv-section-title">
            Recommended <span className="sv-purple-text">Checks</span>
          </h2>
          <p className="sv-section-desc">Select checks to add to your order. Certified by compliance and law enforcement databases.</p>
        </div>

        {/* 4 Recommended Checks Grid */}
        <div className="sv-checks-grid sv-grid-4">
          {RECOMMENDED_CHECKS.map((item) => {
            const count = selectedChecks[item.id] || 0;
            const isSelected = count > 0;

            return (
              <div key={item.id} id={`check-${item.id}`} className={`sv-check-card ${isSelected ? 'is-selected' : ''}`}>
                <div className="sv-card-top-row">
                  <div className="sv-card-icon-disc">{item.icon}</div>
                  <div className="sv-card-top-actions">
                    <button
                      type="button"
                      className={`sv-copy-link-btn ${copiedCheckId === item.id ? 'copied' : ''}`}
                      title={`Copy direct link for ${item.name} to share`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCheckLink(item.id, item.name);
                      }}
                      aria-label={`Copy link for ${item.name}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span>{copiedCheckId === item.id ? '✓ Copied' : 'Share'}</span>
                    </button>

                    <div className="sv-card-pricing-badge">
                      <span className="sv-card-price">₹ {item.price}</span>
                      <span className="sv-card-tat-tag">{item.tat}</span>
                    </div>
                  </div>
                </div>

                <div className="sv-card-middle">
                  <div className="sv-card-title-row">
                    <h3 className="sv-card-title">{item.name}</h3>
                    <span className="sv-card-verified-shield" title="Official Verified">✓</span>
                  </div>
                  <p className="sv-card-desc">{item.description}</p>
                  <div className="sv-card-tags-cloud">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="sv-tag-pill">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sv-card-bottom-actions">
                  <div className="sv-card-price-block">
                    <span className="sv-price-main">₹ {item.price}</span>
                    <span className="sv-tat-micro">{item.tat}</span>
                  </div>

                  <div className="sv-card-action-slot">
                    {isSelected ? (
                      <div className="sv-counter-wrap">
                        <button
                          type="button"
                          className="sv-counter-btn"
                          onClick={() => handleDecrement(item.id)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="sv-counter-val">{count}</span>
                        <button
                          type="button"
                          className="sv-counter-btn"
                          onClick={() => handleIncrement(item.id)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="sv-card-add-toggle"
                        onClick={() => handleToggleAdd(item.id)}
                      >
                        <span className="sv-add-icon">+</span>
                        <span>ADD</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          STICKY BOTTOM CART BAR (Active when 1 or more items selected)
         ======================================================== */}
      {totalCount > 0 && (
        <div className="sv-sticky-cart-bar" role="region" aria-label="Selected Checks Summary">
          <div className="sv-cart-info-group">
            <div className="sv-cart-badge">{totalCount}</div>
            <div className="sv-cart-text-wrap">
              <span className="sv-cart-title">
                {totalCount} {totalCount === 1 ? 'Check' : 'Checks'} Selected
              </span>
              <span className="sv-cart-subtext">Instant digital dossier generation</span>
            </div>
          </div>

          <div className="sv-cart-action-group">
            <div className="sv-cart-total-box">
              <span className="sv-cart-total-label">Total Amount</span>
              <span className="sv-cart-total-amount">₹ {totalPrice}</span>
            </div>

            <button
              type="button"
              className="sv-cart-checkout-btn"
              onClick={() => setShowModal(true)}
            >
              <span>Proceed to Verify</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CHECKOUT CONFIRMATION MODAL
         ======================================================== */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sv-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="sv-modal-close"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            {orderComplete ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                <h3 className="sv-modal-title">Verification Initiated!</h3>
                <p className="sv-modal-sub" style={{ marginBottom: '20px' }}>
                  Thank you! Your self-verification request for {totalCount} checks has been initialized.
                  You will receive an email link to securely verify your identity credentials.
                </p>
                <button
                  type="button"
                  className="sv-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setShowModal(false);
                    setOrderComplete(false);
                    setSelectedChecks({});
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="sv-modal-header">
                  <h3 className="sv-modal-title">Order Summary</h3>
                  <p className="sv-modal-sub">Review your selected self-verification checks</p>
                </div>

                <div className="sv-modal-items-list">
                  {Object.entries(selectedChecks).map(([id, count]) => {
                    const item = allChecks.find((c) => c.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="sv-modal-item-row">
                        <span className="sv-modal-item-name">
                          {item.name} {count > 1 ? `(x${count})` : ''}
                        </span>
                        <span className="sv-modal-item-price">₹ {item.price * count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="sv-modal-total-row">
                  <span className="sv-modal-total-label">Total Payable:</span>
                  <span className="sv-modal-total-val">₹ {totalPrice}</span>
                </div>

                <button
                  type="button"
                  className="sv-modal-submit-btn"
                  onClick={() => {
                    setShowModal(false);
                    setRazorpayModalOpen(true);
                  }}
                >
                  Confirm &amp; Pay (₹ {totalPrice})
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Authentic Interactive Razorpay Payment Gateway Modal */}
      <RazorpayGatewayModal
        isOpen={razorpayModalOpen}
        onClose={() => setRazorpayModalOpen(false)}
        amount={totalPrice}
        customerName="Self Verification Candidate"
        checksCount={Object.keys(selectedChecks).length}
        checksSummary={`Self Verification Package (${totalPrice})`}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Interactive OCR Document Scanner & Extraction Pop-up Modal */}
      <OCRModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        serviceTitle={ocrCheckDetails.title}
        servicePrice={ocrCheckDetails.price}
        initialDocType={ocrCheckDetails.docType}
        allowedDocTypes={ocrCheckDetails.allowedDocTypes}
      />

      {/* Floating Auth Success Toast */}
      {authSuccessToast && (
        <div className="auth-toast-notification">
          <span>{authSuccessToast}</span>
        </div>
      )}

      {/* Login Authentication Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        pendingCheck={pendingCheckToSelect}
        onLoginSuccess={handleLoginModalSuccess}
      />
    </div>
  );
};

export default SelfVerification;
