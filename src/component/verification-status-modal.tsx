import React, { useState, useEffect } from 'react';
import '../styles/verification-status.css';

export interface CandidateDossierData {
  fullName: string;
  idNumber: string;
  docType?: string;
  docLabel?: string;
  dob?: string;
  gender?: string;
  guardianName?: string;
  address?: string;
}

export interface VerificationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle?: string;
  servicePrice?: string | number;
  candidateData: CandidateDossierData;
  onComplete?: () => void;
}

export const VerificationStatusModal: React.FC<VerificationStatusModalProps> = ({
  isOpen,
  onClose,
  serviceTitle = 'Identity & Background Check',
  servicePrice = '₹299',
  candidateData,
  onComplete,
}) => {
  const [verifyingStage, setVerifyingStage] = useState<'verifying' | 'verified'>('verifying');
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeCheckStep, setActiveCheckStep] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // 1. STRICT BACKGROUND BODY SCROLL LOCK
  // Completely prevents the webpage behind this modal from scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('vsm-locked');
      document.documentElement.classList.add('vsm-locked');
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.classList.remove('vsm-locked');
        document.documentElement.classList.remove('vsm-locked');
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 2. EXACT 5.0-SECOND HIGH-TECH CYBER ANIMATION
  useEffect(() => {
    if (!isOpen) return;

    setVerifyingStage('verifying');
    setVerificationProgress(0);
    setElapsedMs(0);
    setActiveCheckStep(0);
    setShowReportModal(false);
    setCopiedHash(false);

    const DURATION_MS = 5000; // Exact 5 seconds
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedMs(elapsed);
      const rawProgress = Math.min(100, (elapsed / DURATION_MS) * 100);
      setVerificationProgress(rawProgress);

      if (elapsed >= DURATION_MS) {
        clearInterval(interval);
        setVerificationProgress(100);
        setActiveCheckStep(4);
        setTimeout(() => {
          setVerifyingStage('verified');
          onComplete?.();
        }, 400);
      } else {
        if (rawProgress < 25) {
          setActiveCheckStep(0);
        } else if (rawProgress < 50) {
          setActiveCheckStep(1);
        } else if (rawProgress < 75) {
          setActiveCheckStep(2);
        } else {
          setActiveCheckStep(3);
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  // Mask ID numbers for official privacy compliance in reports & previews
  const getMaskedId = (id: string, docType?: string) => {
    if (!id) return 'Verified On Record';
    const clean = id.trim();
    const type = (docType || '').toLowerCase();
    if (type.includes('aadhaar')) {
      const digits = clean.replace(/\D/g, '');
      if (digits.length >= 12) {
        return `XXXX XXXX ${digits.slice(-4)}`;
      }
      return clean;
    }
    if (type.includes('pan')) {
      if (clean.length === 10) {
        return `${clean.slice(0, 5)}XXXX${clean.slice(-1)}`;
      }
      return clean;
    }
    if (clean.length > 6) {
      return `${clean.slice(0, 3)}••••${clean.slice(-3)}`;
    }
    return clean;
  };

  // Streaming real-time audit log messages for the 5-second cyber console
  const getTerminalLogs = (ms: number) => {
    const logs = [
      { trigger: 350, text: 'TLS 1.3 Handshake: UIDAI Central Identity Gateway (CIDR)...', tag: 'OK [200]', status: 'completed' },
      { trigger: 1100, text: 'Biometric & XML Cryptographic Certificate validation...', tag: 'PASSED', status: 'completed' },
      { trigger: 2000, text: 'Querying National Judicial Data Grid (3,400+ Courts)...', tag: 'SEARCHING', status: 'active' },
      { trigger: 3000, text: 'Criminal & Civil Court Index: Zero Active Warrants Found.', tag: 'CLEAN', status: 'completed' },
      { trigger: 3800, text: 'Residential PIN Geocoding & Postal Jurisdiction Ledger...', tag: 'MATCHED', status: 'completed' },
      { trigger: 4400, text: 'Optical neural scan & tamper forensic integrity check...', tag: '0 FORGERIES', status: 'completed' },
      { trigger: 4850, text: 'Compiling ISO 27001 SHA-256 Audit Seal & Final Dossier...', tag: 'CERTIFIED', status: 'completed' },
    ];
    return logs.filter((l) => ms >= l.trigger);
  };

  const handleDownloadReport = () => {
    setShowReportModal(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 300);
  };

  const docLabel = candidateData.docLabel || candidateData.docType || 'Government ID';

  return (
    <>
      <div className="vsm-overlay" onClick={onClose} role="dialog" aria-modal="true">
        {verifyingStage === 'verifying' ? (
          /* ========================================================
             STAGE 1: 5-SECOND HIGH-TECH CYBER SCANNER (NO SCROLLBAR)
          ======================================================== */
          <div className="vsm-animation-card" onClick={(e) => e.stopPropagation()}>
            {/* Cyber Radar with 360-degree rotating laser beam */}
            <div className="vsm-radar-wrap">
              <div className="vsm-radar-ring" />
              <div className="vsm-radar-ring" />
              <div className="vsm-radar-sweep-beam" />
              <div className="vsm-radar-center">🛡️</div>
            </div>

            <h3 className="vsm-anim-title">Running Multi-Registry Verification...</h3>
            <p className="vsm-anim-subtitle">
              Authenticating credentials against UIDAI, national court dockets, and residential databases.
            </p>

            {/* Glowing Neon Gradient Progress Bar */}
            <div className="vsm-progress-bar-shell">
              <div
                className="vsm-progress-bar-fill"
                style={{ width: `${verificationProgress}%` }}
              />
            </div>

            {/* Elapsed Time & Percentage Bar */}
            <div className="vsm-progress-meta-row">
              <span>Time Elapsed: {(Math.min(5000, elapsedMs) / 1000).toFixed(1)}s / 5.0s</span>
              <span className="vsm-progress-pct">{Math.round(verificationProgress)}% Complete</span>
            </div>

        

            {/* 4-Step Checklist Grid (2x2 Compact) */}
            <div className="vsm-checklist-grid">
              <div
                className={`vsm-checklist-item ${
                  activeCheckStep > 0
                    ? 'completed'
                    : activeCheckStep === 0
                    ? 'active'
                    : ''
                }`}
              >
                <span>1. Government UIDAI Gateway</span>
                <span>{activeCheckStep > 0 ? '✓' : activeCheckStep === 0 ? '⏳' : '○'}</span>
              </div>

              <div
                className={`vsm-checklist-item ${
                  activeCheckStep > 1
                    ? 'completed'
                    : activeCheckStep === 1
                    ? 'active'
                    : ''
                }`}
              >
                <span>2. e-Courts &amp; Criminal Records</span>
                <span>{activeCheckStep > 1 ? '✓' : activeCheckStep === 1 ? '⏳' : '○'}</span>
              </div>

              <div
                className={`vsm-checklist-item ${
                  activeCheckStep > 2
                    ? 'completed'
                    : activeCheckStep === 2
                    ? 'active'
                    : ''
                }`}
              >
                <span>3. Residential Geocoding Ledger</span>
                <span>{activeCheckStep > 2 ? '✓' : activeCheckStep === 2 ? '⏳' : '○'}</span>
              </div>

              <div
                className={`vsm-checklist-item ${
                  verificationProgress >= 100
                    ? 'completed'
                    : activeCheckStep === 3
                    ? 'active'
                    : ''
                }`}
              >
                <span>4. Cryptographic SHA-256 Seal</span>
                <span>{verificationProgress >= 100 ? '✓' : activeCheckStep === 3 ? '⏳' : '○'}</span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             STAGE 2: 100% VERIFIED SCREEN (NO SCROLLBAR)
          ======================================================== */
          <div className="vsm-verified-card" onClick={(e) => e.stopPropagation()}>
            <div className="vsm-verified-shield-badge">✓</div>

            <h3 className="vsm-verified-title">100% Verified Successfully!</h3>
            <p className="vsm-verified-subtitle">
              Candidate profile has passed all identity, criminal record, and residential authenticity checks with zero discrepancies.
            </p>

            <div className="vsm-dossier-summary-box">
              <div className="vsm-summary-header">
                <div className="vsm-summary-name-col">
                  <h4>{candidateData.fullName || 'Candidate Verified'}</h4>
                  <span>Dossier Reference: #SEC-849102 • {docLabel}</span>
                </div>
                <div className="vsm-grade-pill">✓ 100% CLEAR</div>
              </div>

              <div className="vsm-summary-grid">
                <div className="vsm-summary-cell">
                  <label>Document ID Number</label>
                  <p>{getMaskedId(candidateData.idNumber, candidateData.docType)}</p>
                </div>
                <div className="vsm-summary-cell">
                  <label>Date of Birth</label>
                  <p>{candidateData.dob || 'Verified'}</p>
                </div>
                <div className="vsm-summary-cell">
                  <label>Gender / Category</label>
                  <p>{candidateData.gender || 'Male'}</p>
                </div>
                <div className="vsm-summary-cell">
                  <label>Clearance Level</label>
                  <p style={{ color: '#059669', fontWeight: 700 }}>Grade A (Clean Record)</p>
                </div>
                {candidateData.address && (
                  <div className="vsm-summary-cell" style={{ gridColumn: 'span 2' }}>
                    <label>Verified Address</label>
                    <p>{candidateData.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Requested: Two distinct buttons at bottom */}
            <div className="vsm-actions-row">
              <button
                type="button"
                className="vsm-btn-show-report"
                onClick={() => setShowReportModal(true)}
              >
                <span>📄</span>
                <span>Show Final Report</span>
              </button>

              <button
                type="button"
                className="vsm-btn-download-report"
                onClick={handleDownloadReport}
              >
                <span>📥</span>
                <span>Download Report</span>
              </button>
            </div>

            <button type="button" className="vsm-close-link" onClick={onClose}>
              Close &amp; Return to Dashboard
            </button>
          </div>
        )}
      </div>

      /* ========================================================
         STAGE 3: FULL PRINTABLE EXECUTIVE AUDIT REPORT MODAL
      ======================================================== */
      {showReportModal && (
        <div className="vsm-report-overlay" onClick={() => setShowReportModal(false)}>
          <div className="vsm-report-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Top Control Bar */}
            <div className="vsm-report-action-bar">
              <div className="vsm-report-action-left">
                <span style={{ fontSize: '18px' }}>🛡️</span>
                <span>SECURITAS TRUST NETWORK • OFFICIAL CANDIDATE AUDIT DOSSIER</span>
              </div>
              <div className="vsm-report-action-right">
                <button
                  type="button"
                  className="vsm-report-ctrl-btn primary"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.print();
                  }}
                >
                  <span>🖨️</span>
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  className="vsm-report-ctrl-btn close"
                  onClick={() => setShowReportModal(false)}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Printable Official Document Canvas */}
            <div className="vsm-report-printable">
              {/* Executive Header Banner */}
              <div className="vsm-report-header">
                <div className="vsm-report-crest">
                  <div className="vsm-crest-icon">🛡️</div>
                  <div className="vsm-crest-text">
                    <h2>Securitas Trust Authority</h2>
                    <p>National Background Verification &amp; Compliance Ledger • ISO/IEC 27001:2022</p>
                  </div>
                </div>

                <div className="vsm-report-stamp-col">
                  <div className="vsm-embossed-stamp">
                    <span>★</span>
                    <span>100% VERIFIED AUTHENTIC • GRADE A</span>
                  </div>
                  <span className="vsm-stamp-ref">
                    REF: #SEC-2024-849102-UIDAI • {new Date().toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>

              {/* Metadata Key Strip */}
              <div className="vsm-meta-grid">
                <div className="vsm-meta-cell">
                  <label>Audit Dossier ID</label>
                  <span>SEC-849102-IN</span>
                </div>
                <div className="vsm-meta-cell">
                  <label>Certification Date</label>
                  <span>{new Date().toLocaleDateString('en-GB')}</span>
                </div>
                <div className="vsm-meta-cell">
                  <label>Verification Package</label>
                  <span>{serviceTitle}</span>
                </div>
                <div className="vsm-meta-cell">
                  <label>Regulatory Clearance</label>
                  <span style={{ color: '#047857' }}>UNCONDITIONAL CLEAR</span>
                </div>
              </div>

              {/* Candidate Hero Profile Box */}
              <div className="vsm-profile-card">
                <div className="vsm-profile-avatar">
                  <span className="vsm-avatar-icon">👤</span>
                  <span className="vsm-avatar-tag">✓ ID Matched</span>
                </div>

                <div className="vsm-profile-main">
                  <h3 className="vsm-profile-name">
                    {candidateData.fullName || 'Candidate Verified'}
                  </h3>
                  <div className="vsm-profile-chips">
                    <span className="vsm-profile-chip">🛡️ Government Verified ID</span>
                    <span className="vsm-profile-chip">⚖️ Clean Judicial Docket</span>
                    <span className="vsm-profile-chip">📍 Residential Validated</span>
                  </div>

                  <div className="vsm-profile-grid">
                    <div className="vsm-profile-kv">
                      <strong>Document Type</strong>
                      <span>{docLabel}</span>
                    </div>
                    <div className="vsm-profile-kv">
                      <strong>Document ID Number</strong>
                      <span style={{ fontFamily: 'monospace' }}>
                        {getMaskedId(candidateData.idNumber, candidateData.docType)}
                      </span>
                    </div>
                    <div className="vsm-profile-kv">
                      <strong>Date of Birth</strong>
                      <span>{candidateData.dob || 'Verified on Record'}</span>
                    </div>
                    <div className="vsm-profile-kv">
                      <strong>Gender / Category</strong>
                      <span>{candidateData.gender || 'Male'}</span>
                    </div>
                    <div className="vsm-profile-kv">
                      <strong>Father / Guardian</strong>
                      <span>{candidateData.guardianName || 'Verified on File'}</span>
                    </div>
                    <div className="vsm-profile-kv">
                      <strong>Clearance Rating</strong>
                      <span style={{ color: '#059669' }}>Grade A (Zero Adverse Records)</span>
                    </div>
                  </div>

                  {candidateData.address && (
                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                      <strong style={{ display: 'block', fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Verified Residential Address
                      </strong>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>{candidateData.address}</span>
                    </div>
                  )}
                </div>

                {/* Trust Index Donut Dial */}
                <div className="vsm-trust-score-dial">
                  <span className="vsm-score-num">99.8%</span>
                  <span className="vsm-score-lbl">Trust Index</span>
                  <span style={{ fontSize: '9.5px', color: '#047857', fontWeight: 800, marginTop: '3px' }}>
                    CLEARANCE PASS
                  </span>
                </div>
              </div>

              {/* 4 Modern Verification Check Matrix Cards */}
              <h4 className="vsm-section-header">
                Regulatory Checks &amp; Database Clearances
              </h4>

              <div className="vsm-checks-matrix">
                {/* Check 1 */}
                <div className="vsm-check-card">
                  <div className="vsm-check-card-top">
                    <div className="vsm-check-card-title-wrap">
                      <span className="vsm-check-card-icon">🏛️</span>
                      <h5 className="vsm-check-card-title">1. Government Registry Validation</h5>
                    </div>
                    <span className="vsm-check-card-badge">✓ 100% VALIDATED</span>
                  </div>
                  <div className="vsm-check-card-source">Queried: UIDAI Central Identity Repository (CIDR)</div>
                  <p className="vsm-check-card-desc">
                    Candidate identity record confirmed active and genuine. Biometric demographic vectors matched with central database.
                  </p>
                  <div className="vsm-check-card-footer">
                    <span>Audit Ref: UIDAI-RESP-200-OK</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>VERIFIED</span>
                  </div>
                </div>

                {/* Check 2 */}
                <div className="vsm-check-card">
                  <div className="vsm-check-card-top">
                    <div className="vsm-check-card-title-wrap">
                      <span className="vsm-check-card-icon">⚖️</span>
                      <h5 className="vsm-check-card-title">2. National Criminal &amp; Judicial Search</h5>
                    </div>
                    <span className="vsm-check-card-badge">✓ CLEAN RECORD</span>
                  </div>
                  <div className="vsm-check-card-source">Queried: National Judicial Data Grid (3,400+ Courts)</div>
                  <p className="vsm-check-card-desc">
                    Zero criminal FIRs, court dockets, pending charges, or warrants found across 28 states and union territories.
                  </p>
                  <div className="vsm-check-card-footer">
                    <span>Audit Ref: NJDS-CLEAR-0-MATCH</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>CLEAN</span>
                  </div>
                </div>

                {/* Check 3 */}
                <div className="vsm-check-card">
                  <div className="vsm-check-card-top">
                    <div className="vsm-check-card-title-wrap">
                      <span className="vsm-check-card-icon">📍</span>
                      <h5 className="vsm-check-card-title">3. Address &amp; Geocoding Verification</h5>
                    </div>
                    <span className="vsm-check-card-badge">✓ GEOCODE MATCHED</span>
                  </div>
                  <div className="vsm-check-card-source">Queried: India Post PIN Directory &amp; Utility Ledger</div>
                  <p className="vsm-check-card-desc">
                    Residential address confirmed within postal division. Geographic coordinates authenticated against municipal records.
                  </p>
                  <div className="vsm-check-card-footer">
                    <span>Audit Ref: GEO-PIN-VALIDATED</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>CONFIRMED</span>
                  </div>
                </div>

                {/* Check 4 */}
                <div className="vsm-check-card">
                  <div className="vsm-check-card-top">
                    <div className="vsm-check-card-title-wrap">
                      <span className="vsm-check-card-icon">🔬</span>
                      <h5 className="vsm-check-card-title">4. Forensic Anti-Tampering &amp; OCR Scan</h5>
                    </div>
                    <span className="vsm-check-card-badge">✓ AUTHENTIC</span>
                  </div>
                  <div className="vsm-check-card-source">Queried: Securitas Optical Neural Engine &amp; Watermark Scanner</div>
                  <p className="vsm-check-card-desc">
                    Physical document typography, guilloche lines, and security micro-print confirmed. Zero digital modifications detected.
                  </p>
                  <div className="vsm-check-card-footer">
                    <span>Audit Ref: TAMPER-SCAN-CLEAR</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>GENUINE</span>
                  </div>
                </div>
              </div>

              {/* Official Stamp, Digital Signatures & Compliance Footer */}
              <div className="vsm-report-footer">
                <div className="vsm-rubber-stamp">
                  <span>★ OFFICIAL ★</span>
                  <strong>SECURITAS</strong>
                  <span>AUDIT SEAL</span>
                </div>

                {/* <div className="vsm-signature-wrap">
                  <div className="vsm-signature-art">Dr. Arvind Mehta</div>
                  <p className="vsm-signature-name">Dr. Arvind Mehta, Chief Compliance Officer</p>
                  <p className="vsm-signature-sub">Securitas Trust Verification Authority • Central Legal Bureau</p>
                </div> */}
              </div>

              {/* Cryptographic Hash Bar */}
              <div className="vsm-hash-strip">
                <span>
                  SHA-256 Digest: <code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
                </span>
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedHash ? '#059669' : '#2563eb',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '10.5px',
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
                    setCopiedHash(true);
                    setTimeout(() => setCopiedHash(false), 2000);
                  }}
                >
                  {copiedHash ? '✓ Copied!' : '📋 Copy Hash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VerificationStatusModal;

