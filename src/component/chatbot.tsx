import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import '../styles/chatbot.css';
import { ALL_18_CHECKS, CheckService } from '../pages/services';

export interface ChatbotProps {
  onNavigate: (page: string, role?: string) => void;
  currentPage?: string;
}

interface BundleItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  checkIds: string[];
  rawPrice: number;
  discount: number;
  finalPrice: number;
  tat: string;
}

interface QuickRole {
  id: string;
  name: string;
  icon: string;
  price: number;
  bundleKey: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  bundle?: BundleItem;
  checks?: CheckService[];
  chips?: string[];
  showRoleCards?: boolean;
}

// O(1) Quick lookup Map for 18 Checks (avoids costly array find on every render/scroll)
const CHECKS_MAP = new Map<string, CheckService>(ALL_18_CHECKS.map((c) => [c.id, c]));

const BUNDLE_CATALOG: { [key: string]: BundleItem } = {
  officeBoy: {
    id: 'office-boy-pack',
    title: 'Office Boy & Workplace Staff Pack',
    badge: '15% Off Bundle',
    description: 'Essential verification for office boys, peons, and pantry staff to protect workplace premises and assets.',
    checkIds: ['identity-check', 'criminal-court-record-check', 'address-proof-check', 'reference-check'],
    rawPrice: 1196,
    discount: 179,
    finalPrice: 1017,
    tat: '⚡ Same Day',
  },
  maid: {
    id: 'maid-pack',
    title: 'Maid & Domestic Help Safety Pack',
    badge: 'Most Popular',
    description: 'Verify identity, nationwide court criminal records, and home address before hiring domestic help or cleaners.',
    checkIds: ['aadhar-check', 'criminal-court-record-check', 'address-proof-check'],
    rawPrice: 897,
    discount: 135,
    finalPrice: 762,
    tat: '⚡ Same Day',
  },
  guard: {
    id: 'guard-pack',
    title: 'Security Guard & Watchman Pack',
    badge: 'Society Protection',
    description: 'Police Clearance Certificate (PCC), 20,000+ court criminal records scan, and UIDAI Aadhaar verification.',
    checkIds: ['police-clearance-certificate', 'criminal-court-record-check', 'aadhar-check', 'address-proof-check'],
    rawPrice: 1196,
    discount: 179,
    finalPrice: 1017,
    tat: '⏱️ 1-2 Days',
  },
  roommate: {
    id: 'roommate-pack',
    title: 'Roommate & Flatmate Safety Pack',
    badge: 'Flat Sharing',
    description: 'Verify UIDAI Aadhaar identity, court criminal filings, and current GPS address before sharing your flat or PG.',
    checkIds: ['aadhar-check', 'criminal-court-record-check', 'digital-address-verification'],
    rawPrice: 897,
    discount: 135,
    finalPrice: 762,
    tat: '⚡ Same Day',
  },
  tenant: {
    id: 'tenant-pack',
    title: 'Tenant & Rental Background Pack',
    badge: 'For Landlords',
    description: 'Protect rental property from illegal occupancy and litigation with Police Clearance & court checks.',
    checkIds: ['police-clearance-certificate', 'criminal-court-record-check', 'digital-address-verification', 'identity-check'],
    rawPrice: 1196,
    discount: 179,
    finalPrice: 1017,
    tat: '⏱️ 2-3 Days',
  },
  driver: {
    id: 'driver-pack',
    title: 'Driver & Chauffeur Verification Pack',
    badge: 'Vehicle Safety',
    description: 'MoRTH Sarathi driving license authenticity scan with nationwide court and criminal background check.',
    checkIds: ['driving-license-check', 'criminal-court-record-check', 'aadhar-check'],
    rawPrice: 897,
    discount: 135,
    finalPrice: 762,
    tat: '⚡ Same Day',
  },
  employee: {
    id: 'employee-pack',
    title: 'Candidate & Employee Pack',
    badge: 'Corporate Grade',
    description: 'EPFO tenure audit, university degree verification, court litigation scan, and supervisor reference review.',
    checkIds: ['employment-check', 'academic-record-check', 'criminal-court-record-check', 'reference-check'],
    rawPrice: 1196,
    discount: 179,
    finalPrice: 1017,
    tat: '⏱️ 2-4 Days',
  },
  caregiver: {
    id: 'caregiver-pack',
    title: 'Caregiver & Baby/Elderly Care Pack',
    badge: 'High Trust',
    description: 'AI biometric face match, criminal court record clearance, and residential address tenure verification.',
    checkIds: ['identity-check', 'criminal-court-record-check', 'address-proof-check', 'face-match-check'],
    rawPrice: 1196,
    discount: 179,
    finalPrice: 1017,
    tat: '⚡ Same Day',
  },
};

const QUICK_ROLES: QuickRole[] = [
  { id: 'office-boy', name: 'Office Boy & Peon', icon: '🏢', price: 1017, bundleKey: 'officeBoy' },
  { id: 'cleaner', name: 'Maid & Cleaner', icon: '🧹', price: 762, bundleKey: 'maid' },
  { id: 'guard', name: 'Security Guard', icon: '🛡️', price: 1017, bundleKey: 'guard' },
  { id: 'roommate', name: 'Roommate & PG', icon: '🏠', price: 762, bundleKey: 'roommate' },
  { id: 'driver', name: 'Driver & Chauffeur', icon: '🚗', price: 762, bundleKey: 'driver' },
  { id: 'tenant', name: 'Tenant & Rental', icon: '🔑', price: 1017, bundleKey: 'tenant' },
];

const DEFAULT_CHIPS = [
  '🏢 Office Boy',
  '🧹 Maid & Cleaner',
  '🛡️ Security Guard',
  '🚗 Driver',
  '🔑 Tenant',
  '🏠 Roommate',
  '💰 Pricing & Discounts',
  '📋 All 18 Checks',
];

// Memoized helper to parse bold text
const parseInlineBold = (str: string) => {
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="chat-bold-highlight">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

// Memoized text renderer for zero performance overhead on re-renders
const FormattedMessageText = React.memo<{ text: string }>(({ text }) => {
  const lines = useMemo(() => text.split('\n'), [text]);
  return (
    <div className="chat-formatted-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="chat-line-break" />;
        }
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="chat-bullet-row">
              <span className="chat-bullet-dot">•</span>
              <span className="chat-bullet-text">{parseInlineBold(trimmed.substring(2))}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="chat-text-line">
            {parseInlineBold(line)}
          </p>
        );
      })}
    </div>
  );
});

export const Chatbot: React.FC<ChatbotProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [showTeaser, setShowTeaser] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Quick in-chat checkout drawer
  const [checkoutBundle, setCheckoutBundle] = useState<BundleItem | null>(null);
  const [drawerForm, setDrawerForm] = useState({ name: '', phone: '', email: '' });
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '👋 Hi there! I am your **Securitas Verification Assistant**.\n\nWho are you looking to verify? Choose a role below or type your question:',
      time: 'Just now',
      showRoleCards: true,
      chips: DEFAULT_CHIPS,
    },
  ]);

  // Auto-hide teaser after 12 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTeaser(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  // High-performance container scroll (zero page layout thrashing)
  const scrollToBottom = useCallback((smooth = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // When chat opens: scroll instantly (no laggy smooth-scroll battle) & focus input safely
  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      // preventScroll: true prevents window page jumping when focusing
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [isOpen, scrollToBottom]);

  // When new message arrives or typing state changes: smooth scroll container only
  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => scrollToBottom(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [messages.length, isTyping, isOpen, scrollToBottom]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const openChat = useCallback(() => {
    setIsOpen(true);
    setHasUnread(false);
    setShowTeaser(false);
  }, []);

  // Listen for global open chat triggers (e.g. from header Help Desk -> Instant Support)
  useEffect(() => {
    const handleGlobalOpen = () => {
      openChat();
    };
    window.addEventListener('securitas-open-chat', handleGlobalOpen);
    return () => window.removeEventListener('securitas-open-chat', handleGlobalOpen);
  }, [openChat]);

  const closeChat = () => {
    setIsOpen(false);
    setCheckoutBundle(null);
  };

  const resetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'bot',
        text: '👋 Conversation reset! Which role would you like to verify? Tap a role or type a message:',
        time: getCurrentTime(),
        showRoleCards: true,
        chips: DEFAULT_CHIPS,
      },
    ]);
    setCheckoutBundle(null);
    setOrderConfirmed(false);
  };

  const handleBotResponse = (userQuery: string) => {
    setIsTyping(true);
    const q = userQuery.toLowerCase().trim();

    setTimeout(() => {
      let botText = '';
      let bundle: BundleItem | undefined = undefined;
      let recommendedChecks: CheckService[] | undefined = undefined;
      let newChips: string[] = DEFAULT_CHIPS;

      // 1. Office Boy / Peon / Pantry Staff
      if (
        q.includes('office boy') ||
        q.includes('officeboy') ||
        q.includes('office-boy') ||
        q.includes('peon') ||
        q.includes('pantry') ||
        q.includes('delivery boy') ||
        q.includes('runner') ||
        q.includes('utility staff')
      ) {
        bundle = BUNDLE_CATALOG.officeBoy;
        botText =
          'For **Office Boys & Support Staff**, we recommend screening identity, court records, residential address, and supervisory references to protect workplace assets:';
        newChips = ['⚡ Buy Office Boy Pack', '🛡️ Security Guard', '🧹 Maid & Cleaner', '💰 Pricing & Discounts'];
      }
      // 2. Cleaner / Maid / Cook
      else if (
        q.includes('cleaner') ||
        q.includes('cleaning') ||
        q.includes('sweeper') ||
        q.includes('housekeeping') ||
        q.includes('maid') ||
        q.includes('cook') ||
        q.includes('helper') ||
        q.includes('bai') ||
        q.includes('nanny')
      ) {
        bundle = BUNDLE_CATALOG.maid;
        botText =
          'For **Maids, Cooks & Cleaners**, ensuring home and family safety is paramount. Our pack validates Aadhaar via UIDAI, scans 20,000+ courts for criminal filings, and verifies home address:';
        newChips = ['⚡ Buy Maid Pack', '🏢 Office Boy', '🛡️ Security Guard', '💰 Pricing & Discounts'];
      }
      // 3. Security Guard / Watchman
      else if (
        q.includes('gaurd') ||
        q.includes('guard') ||
        q.includes('watchman') ||
        q.includes('security') ||
        q.includes('chowkidar')
      ) {
        bundle = BUNDLE_CATALOG.guard;
        botText =
          'For **Security Guards & Watchmen**, we combine a jurisdictional Police Clearance Certificate (PCC) with nationwide court records, UIDAI Aadhaar, and physical address verification:';
        newChips = ['⚡ Buy Guard Pack', '🚗 Driver', '🏢 Office Boy', '💰 Pricing & Discounts'];
      }
      // 4. Roommate / Flatmate / PG
      else if (
        q.includes('roommate') ||
        q.includes('flatmate') ||
        q.includes('pg') ||
        q.includes('paying guest') ||
        q.includes('co-living') ||
        q.includes('sharing flat')
      ) {
        bundle = BUNDLE_CATALOG.roommate;
        botText =
          'For **Roommates & Flatmates**, protect your living space with instant UIDAI identity validation, 20,000+ court criminal docket scans, and GPS residential verification:';
        newChips = ['⚡ Buy Roommate Pack', '🔑 Tenant', '💰 Pricing & Discounts'];
      }
      // 5. Tenant / Rental
      else if (
        q.includes('tenant') ||
        q.includes('rent') ||
        q.includes('landlord') ||
        q.includes('flat') ||
        q.includes('lease')
      ) {
        bundle = BUNDLE_CATALOG.tenant;
        botText =
          'For **Tenants & Renters**, protect your property with a Police Clearance Certificate (PCC), Criminal Court Check, and digital address verification:';
        newChips = ['⚡ Buy Tenant Pack', '🏠 Roommate', '📋 All 18 Checks', '💰 Pricing & Discounts'];
      }
      // 6. Driver / Chauffeur
      else if (
        q.includes('driver') ||
        q.includes('chauffeur') ||
        q.includes('cab') ||
        q.includes('license') ||
        q.includes('dl')
      ) {
        bundle = BUNDLE_CATALOG.driver;
        botText =
          'For **Drivers & Chauffeurs**, we authenticate official driving licenses on MoRTH Sarathi, cross-check 20,000+ court registries, and verify Aadhaar biometrics:';
        newChips = ['⚡ Buy Driver Pack', '🛡️ Security Guard', '🏢 Office Boy', '📋 All 18 Checks'];
      }
      // 7. Pricing & Discounts
      else if (
        q.includes('price') ||
        q.includes('cost') ||
        q.includes('rate') ||
        q.includes('discount') ||
        q.includes('how much')
      ) {
        botText =
          '💡 **Securitas Pricing & Instant Volume Savings**:\n• Individual Checks: **₹299** each\n• Instant Self-KYC: From **₹199**\n• **15% Automatic Discount** when you select 3 to 5 checks\n• **25% Super Discount** when you select 6+ checks\nAll checks include official QR-certified PDF reports.';
        newChips = ['🏢 Office Boy Pack (₹1017)', '🧹 Maid Pack (₹762)', '🛡️ Security Guard (₹1017)'];
      }
      // 8. Turnaround Time
      else if (
        q.includes('tat') ||
        q.includes('time') ||
        q.includes('fast') ||
        q.includes('how long')
      ) {
        botText =
          '⚡ **Turnaround Time**:\n• **Instant Checks (Aadhaar, PAN, Face Match)**: Under 2 minutes\n• **Criminal Court Record**: Same Day turnaround\n• **PCC & Education**: 2 to 4 business days';
        newChips = ['🏢 Office Boy', '🧹 Maid & Cleaner', '📋 All 18 Checks'];
      }
      // 9. All 18 Checks
      else if (q.includes('all') || q.includes('18') || q.includes('catalog') || q.includes('service')) {
        recommendedChecks = ALL_18_CHECKS.slice(0, 3);
        botText =
          'We offer **18 specialized background checks** covering Identity, Criminal & Courts, Address, Employment, Education, and Health. Here are our most requested checks:';
        newChips = ['Open All 18 Services', '🏢 Office Boy', '🧹 Maid & Cleaner'];
      }
      // 10. Greetings / Fallback
      else if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
        botText =
          'Hello! I can help you select the exact background checks for your candidate. Which role would you like to verify?';
        newChips = DEFAULT_CHIPS;
      } else {
        botText = `I can help you verify anyone for "${userQuery}". Here is our recommended verification pack with a 15% bundle discount:`;
        bundle = BUNDLE_CATALOG.officeBoy;
        newChips = DEFAULT_CHIPS;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botText,
          time: getCurrentTime(),
          bundle,
          checks: recommendedChecks,
          chips: newChips,
        },
      ]);

      setIsTyping(false);
    }, 300);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    handleBotResponse(text);
  };

  const handleRoleClick = (role: QuickRole) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `${role.icon} Verify ${role.name}`,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    handleBotResponse(role.bundleKey);
  };

  const handleChipClick = (chip: string) => {
    if (chip === 'Open All 18 Services' || chip === '📋 All 18 Checks' || chip === '📋 View All 18 Checks') {
      onNavigate('services');
      return;
    }
    if (chip === '⚡ Buy Office Boy Pack' && BUNDLE_CATALOG.officeBoy) {
      handlePurchaseBundle(BUNDLE_CATALOG.officeBoy);
      return;
    }
    if (chip === '⚡ Buy Maid Pack' && BUNDLE_CATALOG.maid) {
      handlePurchaseBundle(BUNDLE_CATALOG.maid);
      return;
    }
    if (chip === '⚡ Buy Guard Pack' && BUNDLE_CATALOG.guard) {
      handlePurchaseBundle(BUNDLE_CATALOG.guard);
      return;
    }
    if (chip === '⚡ Buy Roommate Pack' && BUNDLE_CATALOG.roommate) {
      handlePurchaseBundle(BUNDLE_CATALOG.roommate);
      return;
    }
    if (chip === '⚡ Buy Tenant Pack' && BUNDLE_CATALOG.tenant) {
      handlePurchaseBundle(BUNDLE_CATALOG.tenant);
      return;
    }
    if (chip === '⚡ Buy Driver Pack' && BUNDLE_CATALOG.driver) {
      handlePurchaseBundle(BUNDLE_CATALOG.driver);
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: chip,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    handleBotResponse(chip);
  };

  const handlePurchaseBundle = (bundle: BundleItem) => {
    try {
      window.dispatchEvent(
        new CustomEvent('securitas-add-checks', {
          detail: {
            checkIds: bundle.checkIds,
            bundleTitle: bundle.title,
          },
        })
      );
    } catch {
      // Ignore
    }

    const confirmMsg: ChatMessage = {
      id: `bot-confirm-${Date.now()}`,
      sender: 'bot',
      text: `🎉 Selected **${bundle.title}**! You save **₹${bundle.discount}** with the bundle discount. Taking you to the services page to review...`,
      time: getCurrentTime(),
    };
    setMessages((prev) => [...prev, confirmMsg]);

    if (bundle.id.includes('driver')) onNavigate('driver-verification');
    else if (bundle.id.includes('maid') || bundle.id.includes('domestic')) onNavigate('maid-verification');
    else if (bundle.id.includes('tenant')) onNavigate('tenant-verification');
    else onNavigate('services');
  };

  const handleSelectSingleCheck = (check: CheckService) => {
    try {
      window.dispatchEvent(
        new CustomEvent('securitas-add-checks', {
          detail: {
            checkIds: [check.id],
            bundleTitle: check.name,
          },
        })
      );
    } catch {
      // Ignore
    }

    const confirmMsg: ChatMessage = {
      id: `bot-single-${Date.now()}`,
      sender: 'bot',
      text: `✅ Added **${check.name}** (₹${check.price}) to your cart. Taking you to review...`,
      time: getCurrentTime(),
    };
    setMessages((prev) => [...prev, confirmMsg]);

    onNavigate('services');
  };

  const handleDrawerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerForm.name || !drawerForm.phone) {
      alert('Please enter your name and phone number.');
      return;
    }

    setOrderConfirmed(true);
    setTimeout(() => {
      setCheckoutBundle(null);
      setOrderConfirmed(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-ordered-${Date.now()}`,
          sender: 'bot',
          text: `🎉 **Order Received for ${checkoutBundle?.title}!**\nOur verification desk will message **${drawerForm.phone}** on WhatsApp within 15 minutes to initiate candidate intake. Reference: **SEC-${Math.floor(100000 + Math.random() * 900000)}**.`,
          time: getCurrentTime(),
          chips: ['🏢 Office Boy', '🧹 Maid & Cleaner', '🛡️ Security Guard'],
        },
      ]);
    }, 800);
  };

  return (
    <div className="securitas-chatbot-wrapper" aria-label="Securitas Verification Assistant">
      {/* Floating Teaser Prompt */}
      {!isOpen && showTeaser && (
        <div className="chatbot-teaser" onClick={openChat}>
          <div className="chatbot-teaser-content">
            <span className="chatbot-teaser-badge">Quick Help</span>
            <span className="chatbot-teaser-text">Need background verification advice?</span>
          </div>
          <button
            className="chatbot-teaser-close"
            onClick={(e) => {
              e.stopPropagation();
              setShowTeaser(false);
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          className="chatbot-launcher-btn"
          onClick={openChat}
          title="Open Assistant"
          aria-label="Open Chatbot"
        >
          {hasUnread && <span className="chatbot-badge">1</span>}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span className="chatbot-status-dot" />
              </div>
              <div className="chatbot-header-text">
                <span className="chatbot-header-title">Securitas Assistant</span>
                <span className="chatbot-header-subtitle">Active · UIDAI &amp; e-Courts Verified</span>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                className="chatbot-header-btn"
                onClick={resetChat}
                title="Restart chat"
                aria-label="Restart chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              <button
                className="chatbot-header-btn"
                onClick={closeChat}
                title="Close chat"
                aria-label="Close chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body with optimized container scrolling */}
          <div ref={messagesContainerRef} className="chatbot-messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg-row ${msg.sender}`}>
                <div className="chat-bubble">
                  <FormattedMessageText text={msg.text} />

                  {/* Clean Role Buttons */}
                  {msg.showRoleCards && (
                    <div className="chat-role-pills-wrap">
                      {QUICK_ROLES.map((role) => (
                        <button
                          key={role.id}
                          className="chat-role-pill"
                          onClick={() => handleRoleClick(role)}
                          type="button"
                        >
                          <span className="chat-role-icon">{role.icon}</span>
                          <span className="chat-role-name">{role.name}</span>
                          {/* <span className="chat-role-price">₹{role.price}</span> */}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Clean Bundle Card */}
                  {msg.bundle && (
                    <div className="chat-bundle-card">
                      <div className="chat-bundle-header">
                        <span className="chat-bundle-badge">{msg.bundle.badge}</span>
                        <span className="chat-bundle-tat">{msg.bundle.tat}</span>
                      </div>
                      <h4 className="chat-bundle-title">{msg.bundle.title}</h4>
                      <p className="chat-bundle-desc">{msg.bundle.description}</p>

                      <ul className="chat-bundle-list">
                        {msg.bundle.checkIds.map((checkId) => {
                          const c = CHECKS_MAP.get(checkId);
                          return (
                            <li key={checkId} className="chat-bundle-list-item">
                              <span className="chat-check-bullet">✓</span>
                              <span className="chat-check-title">{c ? `${c.icon} ${c.name}` : checkId}</span>
                              <span className="chat-check-source">{c?.badge || ''}</span>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="chat-bundle-price-row">
                        <div className="chat-price-stack">
                          <span className="chat-final-price">₹{msg.bundle.finalPrice}</span>
                          <span className="chat-raw-price">₹{msg.bundle.rawPrice}</span>
                          <span className="chat-save-tag">Save ₹{msg.bundle.discount}</span>
                        </div>
                      </div>

                      <div className="chat-bundle-actions">
                        <button
                          className="chat-btn-primary"
                          onClick={() => handlePurchaseBundle(msg.bundle!)}
                        >
                          Order Pack (₹{msg.bundle.finalPrice})
                        </button>
                        <button
                          className="chat-btn-secondary"
                          onClick={() => setCheckoutBundle(msg.bundle!)}
                        >
                          Quick Book
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clean Individual Checks */}
                  {msg.checks && msg.checks.length > 0 && (
                    <div className="chat-checks-wrap">
                      {msg.checks.map((chk) => (
                        <div key={chk.id} className="chat-check-item-card">
                          <div className="chat-check-item-head">
                            <span className="chat-check-item-title">{chk.icon} {chk.name}</span>
                            <span className="chat-check-item-price">₹{chk.price}</span>
                          </div>
                          <p className="chat-check-item-desc">{chk.description}</p>
                          <button
                            className="chat-check-add-btn"
                            onClick={() => handleSelectSingleCheck(chk)}
                          >
                            + Select Check (₹{chk.price})
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="chat-time">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-msg-row bot">
                <div className="chat-bubble typing-bubble">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="chatbot-chips">
            {messages[messages.length - 1]?.chips?.map((chip) => (
              <button
                key={chip}
                className="chatbot-chip-item"
                onClick={() => handleChipClick(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form className="chatbot-input-bar" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input-field"
              placeholder="Ask a question or type a role..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            {inputValue && (
              <button
                type="button"
                className="chatbot-clear-btn"
                onClick={() => setInputValue('')}
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="chatbot-submit-btn"
              disabled={!inputValue.trim()}
              aria-label="Send"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          {/* In-Chat Quick Checkout Drawer */}
          {checkoutBundle && (
            <div className="chatbot-drawer">
              <div className="chatbot-drawer-header">
                <div>
                  <h4 className="chatbot-drawer-title">Quick Booking</h4>
                  <span className="chatbot-drawer-subtitle">{checkoutBundle.title}</span>
                </div>
                <button
                  className="chatbot-drawer-close"
                  onClick={() => setCheckoutBundle(null)}
                >
                  ✕
                </button>
              </div>

              {orderConfirmed ? (
                <div className="chatbot-drawer-success">
                  <span className="success-icon">✓</span>
                  <h3>Order Confirmed!</h3>
                  <p>Our verification desk will message you via WhatsApp to initiate candidate intake.</p>
                </div>
              ) : (
                <form className="chatbot-drawer-form" onSubmit={handleDrawerSubmit}>
                  <div className="drawer-price-card">
                    <span>Total ({checkoutBundle.checkIds.length} Checks):</span>
                    <strong>₹{checkoutBundle.finalPrice}</strong>
                  </div>

                  <div className="drawer-input-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={drawerForm.name}
                      onChange={(e) => setDrawerForm({ ...drawerForm, name: e.target.value })}
                    />
                  </div>

                  <div className="drawer-input-group">
                    <label>WhatsApp Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={drawerForm.phone}
                      onChange={(e) => setDrawerForm({ ...drawerForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="drawer-input-group">
                    <label>Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={drawerForm.email}
                      onChange={(e) => setDrawerForm({ ...drawerForm, email: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="drawer-confirm-btn">
                    Confirm &amp; Proceed (₹{checkoutBundle.finalPrice})
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
