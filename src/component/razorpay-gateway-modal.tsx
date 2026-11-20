import React, { useState, useEffect } from 'react';
import '../styles/razorpay-gateway.css';

export interface RazorpayGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // in Rupees
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  checksCount?: number;
  checksSummary?: string;
  onPaymentSuccess: (details: { paymentId: string; method: string; amount: number }) => void;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'instant';

export const RazorpayGatewayModal: React.FC<RazorpayGatewayModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerName = 'Valued Client',
  customerEmail = 'client@example.com',
  customerPhone = '+91 98765 43210',
  checksCount = 1,
  checksSummary = 'Verification Package',
  onPaymentSuccess,
}) => {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('upi');
  const [selectedUPIApp, setSelectedUPIApp] = useState<string>('gpay');
  const [customVpa, setCustomVpa] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>(customerName);
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');

  // Stage: 'idle' | 'processing' | 'success'
  const [paymentStage, setPaymentStage] = useState<'idle' | 'processing' | 'success'>('idle');
  const [generatedPayId, setGeneratedPayId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPaymentStage('idle');
      setGeneratedPayId('');
      setCardHolder(customerName);
    }
  }, [isOpen, customerName]);

  if (!isOpen) return null;

  const triggerPaymentSuccess = (method: string) => {
    setPaymentStage('processing');

    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const payId = `pay_${randomSuffix}`;
    setGeneratedPayId(payId);

    setTimeout(() => {
      setPaymentStage('success');

      // Auto proceed after brief celebration
      setTimeout(() => {
        onPaymentSuccess({
          paymentId: payId,
          method,
          amount,
        });
      }, 1100);
    }, 1200);
  };

  const handleFillTestCard = () => {
    setCardNumber('4111 2222 3333 4444');
    setCardExpiry('12/28');
    setCardCvv('789');
    setCardHolder(customerName || 'Test Cardholder');
  };

  return (
    <div className="rzp-overlay" onClick={paymentStage === 'idle' ? onClose : undefined}>
      <div className="rzp-modal" onClick={(e) => e.stopPropagation()}>
        {/* Razorpay Authentic Header */}
        <div className="rzp-header">
          <div className="rzp-header-left">
            <div className="rzp-logo-badge">🛡️</div>
            <div className="rzp-merchant-info">
              <div className="rzp-merchant-title-row">
                <span className="rzp-merchant-name">Securitas Verification</span>
                <span className="rzp-test-tag">Test Mode</span>
              </div>
              <span className="rzp-order-subtitle">
                {checksCount} {checksCount === 1 ? 'Check' : 'Checks'} • {customerPhone}
              </span>
            </div>
          </div>

          <div className="rzp-header-right">
            <span style={{ fontSize: '11px', opacity: 0.75 }}>Total Amount</span>
            <span className="rzp-header-amount">₹{amount.toLocaleString('en-IN')}</span>
          </div>

          {paymentStage === 'idle' && (
            <button
              type="button"
              className="rzp-close-btn"
              onClick={onClose}
              title="Close payment window"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Payment Processing State */}
        {paymentStage === 'processing' && (
          <div className="rzp-state-container">
            <div className="rzp-spinner"></div>
            <h3 className="rzp-state-title">Authorizing Payment...</h3>
            <p className="rzp-state-desc">
              Securely connecting with Razorpay gateway and UPI/Bank servers. Please do not refresh.
            </p>
          </div>
        )}

        {/* Payment Success State */}
        {paymentStage === 'success' && (
          <div className="rzp-state-container">
            <div className="rzp-success-checkmark">✓</div>
            <h3 className="rzp-state-title" style={{ color: '#10b981' }}>
              Payment Successful!
            </h3>
            <p className="rzp-state-desc">
              Your transaction has been confirmed. Launching document scanner &amp; extraction...
            </p>

            <div className="rzp-tx-details-box">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment ID:</span>
                <strong>{generatedPayId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount Paid:</span>
                <strong style={{ color: '#10b981' }}>₹{amount.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <button
              type="button"
              className="rzp-instant-test-btn"
              style={{ padding: '10px 24px', fontSize: '13.5px' }}
              onClick={() => {
                onPaymentSuccess({
                  paymentId: generatedPayId,
                  method: activeMethod,
                  amount,
                });
              }}
            >
              Proceed to Document Scanner →
            </button>
          </div>
        )}

        {/* Interactive Payment Methods Form */}
        {paymentStage === 'idle' && (
          <>
            <div className="rzp-body">
              {/* Left Method Switcher */}
              <div className="rzp-sidebar">
                <span className="rzp-sidebar-section-title">Payment Options</span>

                <button
                  type="button"
                  className={`rzp-method-btn ${activeMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setActiveMethod('upi')}
                >
                  <span className="rzp-method-icon">📱</span>
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  className={`rzp-method-btn ${activeMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setActiveMethod('card')}
                >
                  <span className="rzp-method-icon">💳</span>
                  <span>Cards</span>
                </button>

                <button
                  type="button"
                  className={`rzp-method-btn ${activeMethod === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setActiveMethod('netbanking')}
                >
                  <span className="rzp-method-icon">🏦</span>
                  <span>Net Banking</span>
                </button>

                <button
                  type="button"
                  className={`rzp-method-btn ${activeMethod === 'instant' ? 'active' : ''}`}
                  onClick={() => setActiveMethod('instant')}
                  style={{
                    color: activeMethod === 'instant' ? '#10b981' : undefined,
                    fontWeight: activeMethod === 'instant' ? 800 : undefined,
                  }}
                >
                  <span className="rzp-method-icon">⚡</span>
                  <span>1-Click Test</span>
                </button>
              </div>

              {/* Right Method Workspace */}
              <div className="rzp-content-area">
                {/* 1. UPI Payment Option */}
                {activeMethod === 'upi' && (
                  <div>
                    <div className="rzp-test-prompt-banner">
                      <span className="rzp-test-prompt-text">
                        ⚡ Simulator: Click any UPI app below or enter any virtual ID to pay.
                      </span>
                      <button
                        type="button"
                        className="rzp-instant-test-btn"
                        onClick={() => triggerPaymentSuccess('UPI Instant')}
                      >
                        ⚡ 1-Click Pay
                      </button>
                    </div>

                    <h4 className="rzp-method-heading">Pay via UPI Apps</h4>
                    <p className="rzp-method-subtext">Choose your preferred UPI application or QR</p>

                    <div className="rzp-upi-apps-row">
                      {[
                        { id: 'gpay', label: 'Google Pay', icon: '🟢' },
                        { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
                        { id: 'paytm', label: 'Paytm', icon: '🔵' },
                        { id: 'bhim', label: 'BHIM UPI', icon: '🟠' },
                      ].map((app) => (
                        <div
                          key={app.id}
                          className={`rzp-upi-app-card ${selectedUPIApp === app.id ? 'selected' : ''}`}
                          onClick={() => setSelectedUPIApp(app.id)}
                        >
                          <span className="rzp-upi-icon">{app.icon}</span>
                          <span>{app.label}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '14px' }}>
                      <label className="rzp-input-label">Or enter UPI ID / VPA</label>
                      <input
                        type="text"
                        placeholder="e.g. mobile@upi or username@okhdfcbank"
                        value={customVpa}
                        onChange={(e) => setCustomVpa(e.target.value)}
                        className="rzp-text-input"
                      />
                    </div>

                    <button
                      type="button"
                      className="rzp-pay-cta-btn"
                      onClick={() => triggerPaymentSuccess(`UPI (${selectedUPIApp})`)}
                    >
                      <span>Pay ₹{amount.toLocaleString('en-IN')} via UPI</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

                {/* 2. Card Payment Option */}
                {activeMethod === 'card' && (
                  <div>
                    <div className="rzp-test-prompt-banner">
                      <span className="rzp-test-prompt-text">
                        💳 Fill dummy test card numbers with 1-click.
                      </span>
                      <button
                        type="button"
                        className="rzp-instant-test-btn"
                        onClick={handleFillTestCard}
                      >
                        Auto-Fill Test Card
                      </button>
                    </div>

                    <h4 className="rzp-method-heading">Credit or Debit Card</h4>
                    <p className="rzp-method-subtext">Visa, MasterCard, RuPay, Maestro accepted</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label className="rzp-input-label">Card Number</label>
                        <input
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="rzp-text-input"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label className="rzp-input-label">Expires (MM/YY)</label>
                          <input
                            type="text"
                            placeholder="12/28"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="rzp-text-input"
                          />
                        </div>
                        <div>
                          <label className="rzp-input-label">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="rzp-text-input"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="rzp-input-label">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="Full Name as on card"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="rzp-text-input"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rzp-pay-cta-btn"
                      onClick={() => triggerPaymentSuccess('Card Payment')}
                    >
                      <span>Pay ₹{amount.toLocaleString('en-IN')}</span>
                      <span>🔒</span>
                    </button>
                  </div>
                )}

                {/* 3. Net Banking Option */}
                {activeMethod === 'netbanking' && (
                  <div>
                    <h4 className="rzp-method-heading">Net Banking</h4>
                    <p className="rzp-method-subtext">Choose your bank to initiate internet banking</p>

                    <div className="rzp-banks-grid">
                      {[
                        { name: 'HDFC Bank', icon: '🏛️' },
                        { name: 'State Bank of India', icon: '🏢' },
                        { name: 'ICICI Bank', icon: '🏦' },
                        { name: 'Axis Bank', icon: '🏪' },
                        { name: 'Kotak Bank', icon: '🏛️' },
                        { name: 'Punjab National Bank', icon: '🏢' },
                      ].map((bank) => (
                        <div
                          key={bank.name}
                          className={`rzp-bank-card ${selectedBank === bank.name ? 'selected' : ''}`}
                          onClick={() => setSelectedBank(bank.name)}
                        >
                          <span>{bank.icon}</span>
                          <span style={{ fontSize: '11px' }}>{bank.name}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="rzp-pay-cta-btn"
                      onClick={() => triggerPaymentSuccess(`NetBanking (${selectedBank})`)}
                    >
                      <span>Pay ₹{amount.toLocaleString('en-IN')} via {selectedBank}</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

                {/* 4. Instant 1-Click Test Option */}
                {activeMethod === 'instant' && (
                  <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '14px' }}>⚡</div>
                    <h4 className="rzp-method-heading" style={{ fontSize: '18px' }}>
                      Instant Verification Simulator
                    </h4>
                    <p className="rzp-method-subtext" style={{ maxWidth: '340px', margin: '0 auto 20px' }}>
                      Simulates a 100% successful Razorpay payment response instantly and opens the OCR document scanner pop-up without requiring actual bank credentials.
                    </p>

                    <button
                      type="button"
                      className="rzp-pay-cta-btn"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                        maxWidth: '320px',
                        margin: '0 auto',
                      }}
                      onClick={() => triggerPaymentSuccess('1-Click Test Pass')}
                    >
                      <span>✓ Simulate Success &amp; Open OCR</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Razorpay Trust Footer */}
            <div className="rzp-footer-trust">
              <div className="rzp-trust-badges">
                <span className="rzp-trust-badge-item">
                  <span>🔒</span>
                  <span>Razorpay Trusted Business</span>
                </span>
                <span>•</span>
                <span className="rzp-trust-badge-item">
                  <span>🛡️</span>
                  <span>256-bit Encrypted</span>
                </span>
              </div>
              <span style={{ fontWeight: 600 }}>Securitas Safe Pay</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RazorpayGatewayModal;

