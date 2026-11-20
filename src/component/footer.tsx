import React from 'react';
import '../styles/footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <div className="logo-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <span className="brand-name">Securitas</span>
            </div>
            <p className="footer-description">
              India&apos;s trusted digital verification and background screening platform.
              Delivering instant, tamper-proof checks for domestic workers, drivers, tenants, and personal safety.
            </p>
            <div className="compliance-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>100% Data Privacy &amp; ISO 27001 Certified</span>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Verifications</h4>
              <ul>
                <li><a href="#driver">Driver &amp; Security Guard</a></li>
                <li><a href="#maid">House Help &amp; Maid</a></li>
                <li><a href="#caregiver">Caregiver &amp; Nanny</a></li>
                <li><a href="#tenant">Tenant Screening</a></li>
                <li><a href="#matrimonial">Matrimonial Verification</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Checks Included</h4>
              <ul>
                <li><a href="#services">All 18 Individual Checks</a></li>
                <li><a href="#court">Court Litigation Screening</a></li>
                <li><a href="#police">Police Station Records</a></li>
                <li><a href="#aadhaar">Aadhaar &amp; Govt ID Auth</a></li>
                <li><a href="#dl">Driving License Validation</a></li>
                <li><a href="#address">Physical Address Verification</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Support &amp; Legal</h4>
              <ul>
                <li><a href="#helpdesk">Help Desk &amp; FAQs</a></li>
                <li><a href="#track">Track Verification Status</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#contact">Contact Support</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Securitas Verification Services Ltd. All rights reserved.</p>
          <div className="footer-bottom-badges">
            <span>Govt. Database Integrated</span>
            <span className="separator">•</span>
            <span>Bank-Grade 256-Bit SSL</span>
            <span className="separator">•</span>
            <span>Zero Data Leakage Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
