import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/self-verification.css';

export interface ProcessStage {
  id: string;
  tabLabel: string;
  badgeLabel: string;
  icon: string;
  stageNumber: string;
  title: string;
  authority: string;
  tat: string;
  confidence: string;
  details: {
    label: string;
    value: string;
    status: string;
  }[];
  consoleLog: {
    command: string;
    result: string;
  };
}

const STAGES: ProcessStage[] = [
  {
    id: 'identity',
    tabLabel: 'Identity',
    badgeLabel: 'Aadhaar & PAN Match',
    icon: '🪪',
    stageNumber: '01',
    title: 'Aadhaar & PAN Direct Authentication',
    authority: 'UIDAI e-KYC & NSDL Direct Ledger',
    tat: '⚡ 42 Milliseconds',
    confidence: '99.9% Match',
    details: [
      { label: 'Aadhaar Number', value: 'XXXX XXXX 1928', status: '✓ Active & Validated' },
      { label: 'Permanent Account Number', value: 'BPMPK••••F', status: '✓ ITD Operational' },
      { label: 'Biometric Face & Name Match', value: 'Algorithmic 99.4% Match', status: '✓ 100% Authentic' },
    ],
    consoleLog: {
      command: 'POST https://api.uidai.gov.in/v2.5/kyc_match',
      result: '200 OK • Aadhaar + PAN Biometrics Verified [42ms]',
    },
  },
  {
    id: 'court',
    tabLabel: 'Court & Police',
    badgeLabel: '3,400+ Court Search',
    icon: '⚖️',
    stageNumber: '02',
    title: 'Judicial & Police Record Screening',
    authority: 'e-Courts National Grid & CCTNS Police Matrix',
    tat: '⚡ 78 Milliseconds',
    confidence: 'Zero Record',
    details: [
      { label: 'National e-Courts Benches', value: '3,420 District & High Courts Scanned', status: '✓ 0 Litigations' },
      { label: 'CCTNS Police Database', value: 'National Crime Matrix (All States)', status: '✓ 0 Warrants / FIRs' },
      { label: 'Insolvency & Debt Tribunals', value: 'NCLT & DRT Registries Checked', status: '✓ Fully Cleared' },
    ],
    consoleLog: {
      command: 'QUERY e-Courts_National_Bench [3,420 courts]',
      result: 'CLEARED: 0 Pending Warrants • Clean Legal Profile [78ms]',
    },
  },
  {
    id: 'career',
    tabLabel: 'Career & EPFO',
    badgeLabel: 'Service History',
    icon: '💼',
    stageNumber: '03',
    title: 'Employment & EPFO Service Ledger',
    authority: 'EPFO Unified Portal & Ministry of Corporate Affairs',
    tat: '⚡ 64 Milliseconds',
    confidence: 'Verified Tenures',
    details: [
      { label: 'EPFO Member Service Ledger', value: 'UAN #100849204 Verified', status: '✓ Active Contributions' },
      { label: 'Corporate Entity Registration', value: 'MCA CIN Registry Cross-Matched', status: '✓ Genuine Employer' },
      { label: 'Dual-Employment & Moonlighting', value: 'Overlapping Tenures Analysis', status: '✓ Clean Track Record' },
    ],
    consoleLog: {
      command: 'AUTH EPFO_UAN_REGISTRY --uan=100849204',
      result: 'MATCH: 48 Mo. Contributions • Dual Employment: NONE [64ms]',
    },
  },
  {
    id: 'education',
    tabLabel: 'Academic',
    badgeLabel: 'University Roll Auth',
    icon: '🎓',
    stageNumber: '04',
    title: 'University Degree & Digilocker Audit',
    authority: 'National Academic Depository (NAD) & Digilocker',
    tat: '⚡ 55 Milliseconds',
    confidence: 'Degree Validated',
    details: [
      { label: 'Graduation Degree', value: 'Bachelor of Technology (Computer Eng.)', status: '✓ First Class Honors' },
      { label: 'University Depository Registry', value: 'Enrollment Roll #BE/2019/84920', status: '✓ Authenticated' },
      { label: 'Tamper-Proof Digital Transcript', value: 'Digilocker Digital Stamp', status: '✓ Cryptographically Verified' },
    ],
    consoleLog: {
      command: 'SCAN NAD_NATIONAL_DEP --reg=BE/2019/84920',
      result: '200 OK • Degree Certificate & Grade Sheet Authenticated [55ms]',
    },
  },
  {
    id: 'certified',
    tabLabel: 'Dossier',
    badgeLabel: '100% Cleared',
    icon: '🛡️',
    stageNumber: '05',
    title: 'Audit-Ready Cryptographic Dossier',
    authority: 'Securitas Central Trust Bureau',
    tat: '⚡ Instant Issue',
    confidence: '99.8% Trust Score',
    details: [
      { label: 'Trust Index Score', value: '99.8 / 100 Central Security Rating', status: '✓ Top 1% Cleared' },
      { label: 'Cryptographic Hash Digest', value: 'SHA-256 e3b0c44298fc1c14...', status: '✓ Tamper Evident' },
      { label: 'Personal Privacy Standard', value: 'Zero Third-Party Sharing Without Consent', status: '✓ 100% Encrypted' },
    ],
    consoleLog: {
      command: 'MINT_CERTIFICATE --id=SEC-ID-849204-IN',
      result: 'DOSSIER READY: 100% Cleared • Shareable QR Minted',
    },
  },
];

interface SelfVerificationProcessVisualProps {
  onStartVerification?: () => void;
}

export const SelfVerificationProcessVisual: React.FC<SelfVerificationProcessVisualProps> = ({
  onStartVerification,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const stageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const STEP_DURATION_MS = 3800; // time per step in ms
  const PROGRESS_TICK_MS = 50;

  // Progress bar animation
  const resetProgress = useCallback(() => {
    setProgressPercent(0);
  }, []);

  // Advance to next stage
  const nextStage = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % STAGES.length);
    resetProgress();
  }, [resetProgress]);

  // Handle stage selection by clicking tab
  const handleSelectStage = (idx: number) => {
    setActiveStep(idx);
    resetProgress();
  };

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying || isHovered) {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const startTime = Date.now();
    const startProgress = progressPercent;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const additional = (elapsed / STEP_DURATION_MS) * 100;
      const total = Math.min(100, startProgress + additional);
      setProgressPercent(total);

      if (total >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        nextStage();
      }
    }, PROGRESS_TICK_MS);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
    };
  }, [isPlaying, isHovered, nextStage, activeStep, progressPercent]);

  const currentStage = STAGES[activeStep];

  return (
    <div
      className="sv-animated-process-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Interactive Self-Verification Process Simulator"
    >
      {/* Floating Glassmorphic Orbit Badges (User-Friendly Reassurance) */}
      <div
        className="sv-orbit-badge sv-orbit-badge-top"
        title="Your official background report is generated in real-time and ready in under 2 minutes"
      >
        <div className="sv-orbit-icon-disc sv-orbit-icon-instant">
          <span className="sv-orbit-icon">⚡</span>
        </div>
        <div className="sv-orbit-texts">
          <div className="sv-orbit-chip-row">
            <span className="sv-orbit-chip sv-orbit-chip-instant">
              <span className="sv-orbit-live-dot" />
              READY IN 2 MINS
            </span>
          </div>
          <span className="sv-orbit-title">Instant Digital Report</span>
          <span className="sv-orbit-sub">Official verified PDF with QR code</span>
        </div>
      </div>

      <div
        className="sv-orbit-badge sv-orbit-badge-bottom"
        title="Bank-grade encryption ensures your documents and verification data remain 100% private to you"
      >
        <div className="sv-orbit-icon-disc sv-orbit-icon-shield">
          <span className="sv-orbit-icon">🛡️</span>
        </div>
        <div className="sv-orbit-texts">
          <div className="sv-orbit-chip-row">
            <span className="sv-orbit-chip sv-orbit-chip-shield">
              <span className="sv-orbit-shield-dot">✓</span>
              100% PRIVATE &amp; SAFE
            </span>
          </div>
          <span className="sv-orbit-title">Your Data Stays Protected</span>
          <span className="sv-orbit-sub">Never shared without your explicit OTP</span>
        </div>
      </div>

      {/* Main Glassmorphic Animated Hologram Card */}
      <div className="sv-animated-holo-card">
        {/* Top Glowing Laser Gradient Strip */}
        <div className="sv-holo-glow-top" />

        {/* Header Strip with Live Simulation Status & Controls */}
        <div className="sv-process-header">
          <div className="sv-process-brand">
            <div className="sv-process-pulse-indicator">
              <span className="sv-pulse-beacon" />
              <span className="sv-pulse-core" />
            </div>
            <div className="sv-process-header-info">
              <span className="sv-process-eyebrow">AUTOMATED VERIFICATION PIPELINE</span>
              <h3 className="sv-process-title">
                Live Verification <span className="sv-emerald-text">Simulation</span>
              </h3>
            </div>
          </div>

          <div className="sv-process-controls">
            <button
              type="button"
              className={`sv-process-toggle-btn ${isPlaying && !isHovered ? 'active' : ''}`}
              onClick={() => setIsPlaying((p) => !p)}
              title={isPlaying ? 'Pause Auto-Simulation' : 'Resume Auto-Simulation'}
            >
              <span>{isPlaying && !isHovered ? '⏸️ Auto' : '▶️ Resume'}</span>
            </button>
          </div>
        </div>

        {/* Pipeline Stage Navigation Tabs */}
        <div className="sv-pipeline-stepper" role="tablist">
          {STAGES.map((stage, idx) => {
            const isCurrent = idx === activeStep;
            const isCompleted = idx < activeStep;

            return (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                className={`sv-step-tab ${isCurrent ? 'sv-step-tab-active' : ''} ${
                  isCompleted ? 'sv-step-tab-completed' : ''
                }`}
                onClick={() => handleSelectStage(idx)}
              >
                <div className="sv-step-tab-top">
                  <span className="sv-step-tab-icon">{stage.icon}</span>
                  <span className="sv-step-tab-num">{stage.stageNumber}</span>
                </div>
                <span className="sv-step-tab-label">{stage.tabLabel}</span>

                {/* Progress Underline for Active Step */}
                {isCurrent && (
                  <div className="sv-step-progress-track">
                    <div
                      className="sv-step-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Stage Dynamic Interactive Visual Stage */}
        <div className="sv-active-stage-viewport">
          {/* Cyber Scanning Laser Line */}
          <div className="sv-stage-laser-sweep" aria-hidden="true" />

          {/* Top Banner of Active Stage */}
          <div className="sv-stage-meta-strip">
            <div className="sv-stage-left-meta">
              <span className="sv-stage-pill-tag">
                STAGE {currentStage.stageNumber} / 05 • {currentStage.badgeLabel}
              </span>
              <h4 className="sv-stage-headline">{currentStage.title}</h4>
              <p className="sv-stage-authority">
                Verified via <strong>{currentStage.authority}</strong>
              </p>
            </div>

            <div className="sv-stage-score-badge">
              <span className="sv-score-val">{currentStage.confidence}</span>
              <span className="sv-score-tat">{currentStage.tat}</span>
            </div>
          </div>

          {/* Stage Core Visualization Cards */}
          <div className="sv-stage-display-matrix">
            {activeStep === 0 && (
              /* STAGE 0: IDENTITY OCR & MATCH CARD */
              <div className="sv-matrix-card sv-card-identity">
                <div className="sv-id-badge-preview">
                  <div className="sv-id-badge-header">
                    <span className="sv-id-emblem">🏛️ GOVT OF INDIA • UIDAI / ITD</span>
                    <span className="sv-id-chip">⚡ LIVE MATCH</span>
                  </div>
                  <div className="sv-id-badge-body">
                    <div className="sv-id-avatar-box">
                      <span className="sv-id-avatar-icon">👤</span>
                      <div className="sv-face-scan-grid" />
                    </div>
                    <div className="sv-id-fields-col">
                      <div className="sv-id-row">
                        <span className="sv-id-lbl">FULL NAME</span>
                        <span className="sv-id-val">CANDIDATE CLEARED</span>
                      </div>
                      <div className="sv-id-row">
                        <span className="sv-id-lbl">AADHAAR / PAN</span>
                        <span className="sv-id-val sv-mono-highlight">XXXX XXXX 1928 • BPMPK••••F</span>
                      </div>
                      <div className="sv-id-row">
                        <span className="sv-id-lbl">BIOMETRIC MATCH</span>
                        <span className="sv-id-val sv-emerald-text">✓ 99.4% Face &amp; Demographic Match</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              /* STAGE 1: COURT & CRIMINAL RADAR */
              <div className="sv-matrix-card sv-card-court">
                <div className="sv-court-radar-grid">
                  <div className="sv-radar-disc">
                    <div className="sv-radar-circle circle-1" />
                    <div className="sv-radar-circle circle-2" />
                    <div className="sv-radar-circle circle-3" />
                    <div className="sv-radar-scanner-sweep" />
                    <span className="sv-radar-center-shield">⚖️</span>
                  </div>

                  <div className="sv-court-stats-list">
                    <div className="sv-court-stat-row">
                      <span className="sv-court-stat-icon">🏛️</span>
                      <div className="sv-court-stat-texts">
                        <span className="sv-court-stat-name">3,420 e-Courts &amp; Tribunals</span>
                        <span className="sv-court-stat-sub">Supreme, High &amp; District Benches</span>
                      </div>
                      <span className="sv-court-badge-cleared">✓ 0 Records</span>
                    </div>

                    <div className="sv-court-stat-row">
                      <span className="sv-court-stat-icon">🚔</span>
                      <div className="sv-court-stat-texts">
                        <span className="sv-court-stat-name">CCTNS National Crime Grid</span>
                        <span className="sv-court-stat-sub">All 28 States &amp; 8 UT Police Stations</span>
                      </div>
                      <span className="sv-court-badge-cleared">✓ Clean Profile</span>
                    </div>

                    <div className="sv-court-stat-row">
                      <span className="sv-court-stat-icon">📜</span>
                      <div className="sv-court-stat-texts">
                        <span className="sv-court-stat-name">Insolvency &amp; Cheque Bounce</span>
                        <span className="sv-court-stat-sub">Sec. 138 NI Act &amp; NCLT Benches</span>
                      </div>
                      <span className="sv-court-badge-cleared">✓ Fully Clear</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              /* STAGE 2: CAREER & EPFO SERVICE LEDGER */
              <div className="sv-matrix-card sv-card-career">
                <div className="sv-career-timeline">
                  <div className="sv-career-item">
                    <div className="sv-career-node node-active">
                      <span className="sv-node-dot" />
                    </div>
                    <div className="sv-career-content">
                      <div className="sv-career-top">
                        <span className="sv-career-role">Senior Technology Specialist</span>
                        <span className="sv-career-tag">EPFO ACTIVE</span>
                      </div>
                      <span className="sv-career-company">Tier-1 Technology Enterprise</span>
                      <span className="sv-career-tenure">2022 – Present • 36 Contributions Matched</span>
                    </div>
                    <span className="sv-career-match-badge">✓ Verified</span>
                  </div>

                  <div className="sv-career-item">
                    <div className="sv-career-node">
                      <span className="sv-node-dot" />
                    </div>
                    <div className="sv-career-content">
                      <div className="sv-career-top">
                        <span className="sv-career-role">Associate Software Engineer</span>
                        <span className="sv-career-tag">CONFIRMED</span>
                      </div>
                      <span className="sv-career-company">Digital Solutions India Ltd</span>
                      <span className="sv-career-tenure">2019 – 2022 • Relieving Letter Authenticated</span>
                    </div>
                    <span className="sv-career-match-badge">✓ Verified</span>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              /* STAGE 3: ACADEMIC & DEGREE AUDIT */
              <div className="sv-matrix-card sv-card-education">
                <div className="sv-degree-certificate-preview">
                  <div className="sv-degree-header">
                    <span className="sv-degree-crest">🎓</span>
                    <div className="sv-degree-headings">
                      <span className="sv-degree-univ">NATIONAL UNIVERSITY REGISTRY</span>
                      <span className="sv-degree-dep">National Academic Depository (NAD) &amp; Digilocker</span>
                    </div>
                    <span className="sv-degree-stamp">✓ SEALED</span>
                  </div>

                  <div className="sv-degree-body">
                    <span className="sv-degree-title">Bachelor of Technology (Computer Engineering)</span>
                    <div className="sv-degree-details-row">
                      <div className="sv-degree-pill">
                        <span className="sv-degree-pill-label">Roll No:</span>
                        <span className="sv-degree-pill-val">BE/2019/84920</span>
                      </div>
                      <div className="sv-degree-pill">
                        <span className="sv-degree-pill-label">Division:</span>
                        <span className="sv-degree-pill-val">First Class with Distinction</span>
                      </div>
                      <div className="sv-degree-pill">
                        <span className="sv-degree-pill-label">Digital Hash:</span>
                        <span className="sv-degree-pill-val">Digilocker #DL-918204</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              /* STAGE 4: COMPLETED CERTIFIED DOSSIER */
              <div className="sv-matrix-card sv-card-certified">
                <div className="sv-dossier-success-wrap">
                  <div className="sv-dossier-trust-dial">
                    <div className="sv-trust-dial-ring">
                      <svg width="84" height="84" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="transparent"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeDasharray="264"
                          strokeDashoffset="8"
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="sv-trust-dial-inner">
                        <span className="sv-dial-num">99.8%</span>
                        <span className="sv-dial-sub">TRUST</span>
                      </div>
                    </div>

                    <div className="sv-dossier-meta">
                      <span className="sv-dossier-id">DOSSIER #SEC-ID-849204-IN</span>
                      <h5 className="sv-dossier-status-text">100% Cleared &amp; Audit-Ready</h5>
                      <p className="sv-dossier-sub-note">
                        Cryptographically signed with tamper-evident QR code. Share securely with recruiters,
                        landlords, and embassies with zero third-party disclosure.
                      </p>
                    </div>
                  </div>

                  <div className="sv-dossier-qr-strip">
                    <div className="sv-dossier-qr-box">
                      <span className="sv-qr-symbol">📱</span>
                      <span>Scan QR Verified</span>
                    </div>
                    <span className="sv-dossier-hash">
                      SHA-256: <code>e3b0c44298fc1c14...</code>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Checkpoints Matrix */}
          <div className="sv-stage-checkpoints-grid">
            {currentStage.details.map((detail, idx) => (
              <div key={idx} className="sv-checkpoint-pill">
                <div className="sv-checkpoint-info">
                  <span className="sv-checkpoint-label">{detail.label}</span>
                  <span className="sv-checkpoint-value">{detail.value}</span>
                </div>
                <span className="sv-checkpoint-status">{detail.status}</span>
              </div>
            ))}
          </div>

          {/* Live Cyber Console Terminal Log */}
          <div className="sv-stage-cyber-console">
            <div className="sv-console-header">
              <span className="sv-console-dot red" />
              <span className="sv-console-dot yellow" />
              <span className="sv-console-dot green" />
              <span className="sv-console-title">REAL-TIME API DISPATCH LOG</span>
            </div>
            <div className="sv-console-content">
              <div className="sv-console-line">
                <span className="sv-console-prompt">&gt;</span>
                <span className="sv-console-cmd">{currentStage.consoleLog.command}</span>
              </div>
              <div className="sv-console-line sv-console-res">
                <span className="sv-console-arrow">↳</span>
                <span className="sv-console-text">{currentStage.consoleLog.result}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Strip */}
        <div className="sv-process-footer">
          <div className="sv-footer-progress-info">
            <span className="sv-footer-step-counter">
              Step <strong>{activeStep + 1}</strong> of <strong>{STAGES.length}</strong>
            </span>
            <div className="sv-footer-dots-row">
              {STAGES.map((_, i) => (
                <span
                  key={i}
                  className={`sv-footer-dot ${i === activeStep ? 'active' : ''} ${
                    i < activeStep ? 'done' : ''
                  }`}
                  onClick={() => handleSelectStage(i)}
                />
              ))}
            </div>
          </div>

          <div className="sv-footer-actions">
            <button
              type="button"
              className="sv-btn-next-step"
              onClick={nextStage}
            >
              <span>Next Stage ›</span>
            </button>

            {onStartVerification && (
              <button
                type="button"
                className="sv-btn-start-now"
                onClick={onStartVerification}
              >
                <span>Verify Yourself Now ⚡</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfVerificationProcessVisual;

