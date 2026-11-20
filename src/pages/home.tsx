import React, { useState, useEffect, useRef } from 'react';
import '../styles/home.css';
import selfVerifyHumanImg from '../assets/img/self-verification.jpg';
import caregiverImg from '../assets/img/image/caregiver.jpg';
import OCRModal, { DocumentType } from '../component/ocr-modal';

// Automatically import all images placed in src/assets/img/image/ (filtering by image extensions)
let customImages: Record<string, string> = {};
try {
  customImages =
    import.meta.glob<string>(
      '../assets/img/image/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG,SVG,WEBP}',
      { eager: true, import: 'default' }
    ) || {};
} catch {
  customImages = {};
}

// Fallback SVG data URI in case no matching image is available
const FALLBACK_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23131d2e"/><circle cx="300" cy="180" r="60" fill="%231e293b"/><path d="M220 310c0-44 36-80 80-80s80 36 80 80" fill="%231e293b"/><text x="50%" y="350" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="system-ui,-apple-system,sans-serif" font-size="16" font-weight="600">SECURITAS VERIFIED</text></svg>';

/**
 * Intelligent helper to resolve images from src/assets/img/image/ by name, keyword, or section.
 * - Prioritizes exact name matches (e.g. "driver.png", "instant.jpg", "maid.webp")
 * - Handles section prefixes (e.g. "banner-driver.png", "card_tenant.png")
 * - Handles numeric names (e.g. "1.png", "card1.png", "banner2.png")
 * - Distinguishes between banner and card sections
 */
function resolveImage(
  keywords: string[],
  section: 'banner' | 'card',
  index: number,
  fallback?: string
): string {
  const entries = customImages ? Object.entries(customImages) : [];
  if (entries.length === 0) return fallback || FALLBACK_PLACEHOLDER;

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  let bestUrl: string | null = null;
  let bestScore = -999;

  const num = String(index + 1);
  const numPad = num.padStart(2, '0');

  entries.forEach(([path, url], entryIdx) => {
    if (!url || typeof url !== 'string') return;

    // Get clean basename without extension: e.g. "banner-driver.png" -> "bannerdriver"
    const rawFilename = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    const cleanFilename = clean(rawFilename);
    if (!cleanFilename) return;

    let score = 0;

    // Section bias: boost matching section, penalize opposite section
    const hasBannerTag = cleanFilename.includes('banner');
    const hasCardTag = cleanFilename.includes('card') || cleanFilename.includes('service');

    if (section === 'banner') {
      if (hasBannerTag) score += 30;
      if (hasCardTag) score -= 50;
    } else if (section === 'card') {
      if (hasCardTag) score += 30;
      if (hasBannerTag) score -= 50;
    }

    // Stripped of section prefix for pure name matching
    const strippedName = cleanFilename.replace(/^(banner|card|service|hero|sec)/, '');

    // 1. Exact name match (highest priority)
    for (const kw of keywords) {
      const cleanKw = clean(kw);
      if (!cleanKw) continue;

      if (cleanFilename === cleanKw || strippedName === cleanKw) {
        score += 100;
        break;
      }
    }

    // 2. Starts with / Ends with / Includes keyword
    for (const kw of keywords) {
      const cleanKw = clean(kw);
      if (!cleanKw || cleanKw.length < 3) continue;

      if (strippedName.startsWith(cleanKw) || strippedName.endsWith(cleanKw)) {
        score += 60;
        break;
      } else if (cleanFilename.includes(cleanKw) || cleanKw.includes(cleanFilename)) {
        score += 40;
        break;
      }
    }

    // 3. Numeric match (e.g. "1.png", "banner1.png", "card2.png")
    if (
      cleanFilename === num ||
      cleanFilename === numPad ||
      cleanFilename === `${section}${num}` ||
      cleanFilename === `${section}${numPad}` ||
      cleanFilename === `image${num}` ||
      strippedName === num ||
      strippedName === numPad
    ) {
      score += 55;
    }

    // 4. Positional match as mild tie-breaker
    if (entryIdx === index) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestUrl = url;
    }
  });

  // If a good match with positive score was found, return it
  if (bestUrl && bestScore > 0) {
    return bestUrl;
  }

  // Positional fallback: map index into available entries in src/assets/img/image/
  if (entries[index % entries.length]) {
    const [, url] = entries[index % entries.length];
    if (typeof url === 'string') return url;
  }

  return fallback || (entries[0] && typeof entries[0][1] === 'string' ? entries[0][1] : FALLBACK_PLACEHOLDER);
}

export interface VerificationCategory {
  id: string;
  name: string;
  badgeTitle: string;
  checkType: string;
  checkSubtitle: string;
  verifiedLabel: string;
  price: string;
  image: string;
  imageAlt: string;
}

interface ProcessStep {
  id: string;
  stepNumber: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  headline: string;
  description: string;
  shortDesc: string;
  color: string;
  rgb: string;
  isElevated: boolean;
  duration: string;
  features: string[];
  samplePreview: {
    tag: string;
    detail: string;
    subtext: string;
    verifiedText: string;
  };
}

interface VerificationService {
  id: string;
  category: 'home' | 'property' | 'personal' | 'business';
  badge: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  features: string[];
  btnText: string;
  image: string;
  fadeColor: string;
  themeGradient: string;
  tags: string[];
}

export const CATEGORIES: VerificationCategory[] = [
  {
    id: 'self-check',
    name: 'Self-Check',
    badgeTitle: 'Self Verification Profile',
    checkType: 'Identity & Background Report',
    checkSubtitle: 'Govt.-Verified Instant Digital Report',
    verifiedLabel: 'VERIFIED',
    price: '₹199',
    image: selfVerifyHumanImg || '/self-verification.jpg',
    imageAlt: 'Self verification check profile - professional individual portrait',
  },
  {
    id: 'driver',
    name: 'Driver & Guard',
    badgeTitle: 'Driver & Security Guard',
    checkType: 'License & Criminal Check',
    checkSubtitle: 'Authenticated Drivers, Guards & Watchmen via Sarathi & Police Records',
    verifiedLabel: 'VERIFIED',
    price: '₹299',
    image: resolveImage(
      ['driver', 'guard', 'security', 'driver-guard', 'driverguard', 'driver & guard', 'driver & security guard', 'peaked-cap'],
      'banner',
      1
    ),
    imageAlt: 'Driver and Security Guard in uniform with peaked cap and tie',
  },
  {
    id: 'house-help',
    name: 'House Help & Maid',
    badgeTitle: 'Domestic Help, Maid & Cleaner',
    checkType: 'Identity & Address Verification',
    checkSubtitle: 'Authenticated Maids, Cleaners, Cooks & House Staff via Aadhaar & Police Records',
    verifiedLabel: 'VERIFIED',
    price: '₹249',
    image: resolveImage(
      ['house-help', 'househelp', 'house', 'maid', 'domestic', 'help', 'maid-help', 'house help', 'cleaning', 'domestic help', 'domestic help & maid'],
      'banner',
      2
    ),
    imageAlt: 'Verified House Help, maid and cleaner domestic worker',
  },
  {
    id: 'caregiver',
    name: 'Caregiver',
    badgeTitle: 'Caregiver & Nurse',
    checkType: 'Medical Cert. & Background Check',
    checkSubtitle: 'Verified Certification & Crime Records',
    verifiedLabel: 'VERIFIED',
    price: '₹349',
    image: caregiverImg || resolveImage(
      ['caregiver', 'nurse', 'nanny', 'care', 'care-giver', 'care_giver', 'elderly', 'baby', 'caregiver & nurse'],
      'banner',
      3
    ),
    imageAlt: 'Verified Indian caregiver assisting elderly grandmother in modern home setting',
  },
  {
    id: 'tenant',
    name: 'Tenant & Roommate',
    badgeTitle: 'Tenant & Roommate Background',
    checkType: 'Police Verification & Litigation',
    checkSubtitle: 'Rental Agreement, Roommate Screening & Court Litigation Scan',
    verifiedLabel: 'VERIFIED',
    price: '₹299',
    image: resolveImage(
      ['tenant', 'rental', 'tenant-check', 'tenantcheck', 'property', 'lease', 'tenant check', 'flat', 'tenant & rental background'],
      'banner',
      4
    ),
    imageAlt: 'Verified Tenant background profile',
  },
  {
    id: 'matrimonial',
    name: 'Matrimonial',
    badgeTitle: 'Matrimonial Candidate',
    checkType: 'Marital, Financial & Education Check',
    checkSubtitle: '100% Confidential Verification',
    verifiedLabel: 'VERIFIED',
    price: '₹499',
    image: resolveImage(
      ['matrimonial', 'matchmaking', 'marriage', 'bride', 'groom', 'matrimony', 'wedding', 'matrimonial candidate'],
      'banner',
      5
    ),
    imageAlt: 'Verified Matrimonial candidate profile',
  },
];

const VERIFICATION_SERVICES: VerificationService[] = [
  {
    id: 'yourself',
    category: 'personal',
    badge: '👤 SELF-CHECK & REPORT',
    title: 'Verify Yourself',
    description: 'Pre-verify your own background to build trust with prospective employers or landlords.',
    price: '₹199',
    duration: 'Instant Report',
    features: ['Credit & identity credentials', 'Shareable QR-authenticated PDF', 'Complete tamper-proof record'],
    btnText: 'Get Verified',
    image: selfVerifyHumanImg || '/self-verification.jpg',
    fadeColor: '#151130',
    themeGradient: 'linear-gradient(180deg, #221c4a 0%, #151130 50%, #080614 100%)',
    tags: ['Self-Check', 'QR Verified', 'Instant Report'],
  },
  {
    id: 'instant',
    category: 'personal',
    badge: '⚡ INSTANT 2-MIN CHECK',
    title: 'Instant Verification',
    description: 'Fast automated check of identity and criminal records across central government databases.',
    price: '₹199',
    duration: 'Instant < 2 mins',
    features: ['Govt ID & Driving License match', 'Real-time police record check', 'Instant verifiable PDF report'],
    btnText: 'Verify Now',
    image: resolveImage(
      ['instant-verify', 'instant', 'instantcheck', 'instant-check', 'fast', 'quick', 'instant verification', '2-min'],
      'card',
      0
    ),
    fadeColor: '#092019',
    themeGradient: 'linear-gradient(180deg, #103328 0%, #092019 50%, #040e0b 100%)',
    tags: ['Instant < 2 mins', 'Govt ID Match', 'Verifiable PDF'],
  },
  {
    id: 'domestic-help',
    category: 'home',
    badge: '🏠 HOME & MAID SAFETY',
    title: 'Verify Domestic Help, Maid & Cleaner',
    description: 'Ensure complete family and home safety before welcoming maids, cleaners, cooks, or caregivers.',
    price: '₹249',
    duration: 'Same-Day Report',
    features: ['Aadhaar & permanent address check', 'Police Station criminal dossier scan', 'Past workplace reference review'],
    btnText: 'Verify Maid & Cleaner',
    image: resolveImage(
      ['domestic-help', 'domestichelp', 'maid-verify', 'domestic', 'maid', 'house-help', 'home', 'family', 'verify domestic help'],
      'card',
      1
    ),
    fadeColor: '#082029',
    themeGradient: 'linear-gradient(180deg, #0e303d 0%, #082029 50%, #030d11 100%)',
    tags: ['Maid & Cleaner', 'Home Safety', 'Police Dossier', 'Same-Day'],
  },
  {
    id: 'tenant',
    category: 'property',
    badge: '🔑 RENTAL & ROOMMATE',
    title: 'Verify Tenant & Roommate',
    description: 'Protect rental property from default, civil disputes, and screen flatmates or roommates before sharing keys.',
    price: '₹299',
    duration: 'Instant Delivery',
    features: ['Civil litigation & tribunal history', 'Permanent address validation', 'Criminal court record check'],
    btnText: 'Verify Tenant & Roommate',
    image: resolveImage(
      ['tenant-verify', 'tenantverify', 'tenant', 'rental', 'property', 'lease', 'rental protection', 'verify tenant'],
      'card',
      2
    ),
    fadeColor: '#0c1b30',
    themeGradient: 'linear-gradient(180deg, #132a4a 0%, #0c1b30 50%, #050c17 100%)',
    tags: ['Tenant & Roommate', 'Rental Safety', 'Court Scan', 'Fast Delivery'],
  },
  {
    id: 'matchmaking',
    category: 'home',
    badge: '💍 MATRIMONIAL',
    title: 'Matrimonial Background Check',
    description: '100% discreet and confidential candidate screening for lifelong personal decisions.',
    price: '₹499',
    duration: '100% Confidential',
    features: ['Marital status & court litigation scan', 'Employment & education authenticity', 'Zero disclosure to candidate'],
    btnText: 'Verify Match',
    image: resolveImage(
      ['matchmaking', 'matrimonial', 'matrimony', 'marriage', 'bride', 'groom', 'wedding', 'verify matchmaking'],
      'card',
      4
    ),
    fadeColor: '#1a0f2b',
    themeGradient: 'linear-gradient(180deg, #2c1a45 0%, #1a0f2b 50%, #0c0616 100%)',
    tags: ['100% Confidential', 'Court Scan', 'Discreet'],
  },
  {
    id: 'workplace',
    category: 'business',
    badge: '💼 WORKPLACE & STAFF',
    title: 'Office Boy, Staff & Guard Verification',
    description: 'Professional background screening for office boys, security guards, cleaners, peons, and contract staff.',
    price: '₹399',
    duration: 'Bulk API Ready',
    features: ['Central police & court litigation check', 'Commercial driving license check', 'Instant GST invoice & bulk portal'],
    btnText: 'Verify Staff & Office Boy',
    image: resolveImage(
      ['workplace', 'workplace-shield', 'business', 'work', 'corporate', 'staff', 'office', 'derisk', 'derisk your workplace'],
      'card',
      5
    ),
    fadeColor: '#0f1a26',
    themeGradient: 'linear-gradient(180deg, #18283a 0%, #0f1a26 50%, #070c12 100%)',
    tags: ['Office Boy & Staff', 'Security Guard', 'Corporate Shield', 'Bulk API'],
  },
];

interface MarqueeItem {
  name: string;
  icon: string;
  badge: string;
}

const GREEN_TICKER_ITEMS: MarqueeItem[] = [
  { name: 'Nanny & Babysitter', icon: '👶', badge: 'VERIFIED' },
  { name: 'Private Driver', icon: '🚗', badge: 'DL MATCHED' },
  { name: 'Elder Caregiver', icon: '🩺', badge: 'AUTHENTIC' },
  { name: 'Plumber & Technician', icon: '🔧', badge: 'VERIFIED' },
  { name: 'Corporate Staff', icon: '💼', badge: 'B2B CHECK' },
  { name: 'Individual Self-Check', icon: '👤', badge: 'INSTANT QR' },
  { name: 'Domestic Maid', icon: '🧹', badge: 'POLICE PASS' },
  { name: 'Home Nurse', icon: '🏥', badge: 'CERTIFIED' },
  { name: 'Matrimonial Match', icon: '💍', badge: 'DISCREET' },
  { name: 'Society Watchman', icon: '🛡️', badge: 'POLICE DB' },
  { name: 'House Cook & Chef', icon: '🍳', badge: 'CLEARED' },
  { name: 'Electrician', icon: '⚡', badge: 'VERIFIED' },
  { name: 'Security Guard', icon: '👮', badge: 'BACKGROUND OK' },
  { name: 'Private Tutor', icon: '📚', badge: 'ID MATCHED' },
];

const PURPLE_TICKER_ITEMS: MarqueeItem[] = [
  { name: 'Rental Tenant', icon: '🔑', badge: 'COURT SCAN' },
  { name: 'Housekeeper', icon: '🏠', badge: 'AUTHENTICATED' },
  { name: 'Daycare Nanny', icon: '🧸', badge: 'POLICE PASS' },
  { name: 'Workforce Staff', icon: '🏢', badge: 'VERIFIED' },
  { name: 'Private Chauffeur', icon: '🚘', badge: 'RTO VALID' },
  { name: 'Assisted Living Aide', icon: '❤️', badge: 'VERIFIED' },
  { name: 'Catering Cook', icon: '🥗', badge: 'RECORD CLEAR' },
  { name: 'Groom Prospect', icon: '🤵', badge: 'CONFIDENTIAL' },
  { name: 'Bride Prospect', icon: '👰', badge: 'CONFIDENTIAL' },
  { name: 'Perimeter Guard', icon: '💂', badge: 'VERIFIED' },
  { name: 'Academic Instructor', icon: '🎓', badge: 'CLEARED' },
  { name: 'Delivery Partner', icon: '📦', badge: 'AUTHENTIC' },
];

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'register',
    stepNumber: '01',
    title: 'Register',
    shortTitle: 'REGISTER',
    subtitle: 'Easy Sign-Up',
    headline: 'Quick OTP Setup in 30 Seconds',
    description: 'Get started instantly with just your phone number. No lengthy paperwork, complex forms, or passwords to remember.',
    shortDesc: 'Instant phone OTP sign-up in 30s. Zero setup fees & 100% data encryption.',
    color: '#10b981',
    rgb: '16, 185, 129',
    isElevated: false,
    duration: '30 Seconds',
    features: ['Instant SMS OTP Verification', 'No Registration Fee', '100% Privacy & Data Encryption'],
    samplePreview: {
      tag: 'Secure Authentication',
      detail: '+91 98765 •••••',
      subtext: 'OTP Verified • Live Session Active',
      verifiedText: 'PHONE VERIFIED',
    },
  },
  {
    id: 'product',
    stepNumber: '02',
    title: 'Choose Check',
    shortTitle: 'CHOOSE CHECK',
    subtitle: 'Choose Your Check',
    headline: 'Select Targeted Screening Packages',
    description: 'Pick from tailored checks engineered specifically for Drivers, Domestic Help, Caregivers, Tenants, or Matrimonial candidates.',
    shortDesc: 'Select from verified checks for Maids, Drivers, Tenants, or Matrimony.',
    color: '#0ea5e9',
    rgb: '14, 165, 233',
    isElevated: true,
    duration: '1 Click Select',
    features: ['Customized Verification Scope', 'Govt ID + Court Record Bundles', 'Transparent Flat-Rate Pricing'],
    samplePreview: {
      tag: 'Selected Scope',
      detail: 'Driver & Security Guard Check',
      subtext: 'Aadhaar + DL + Court Records + Police',
      verifiedText: 'PACKAGE ACTIVE',
    },
  },
  {
    id: 'payment',
    stepNumber: '03',
    title: 'Secure Payment',
    shortTitle: 'SECURE PAYMENT',
    subtitle: 'Fast & Encrypted Checkout',
    headline: 'Encrypted & Flexible Checkout',
    description: 'Pay seamlessly via any UPI app (GPay, PhonePe, Paytm), Credit/Debit cards, or NetBanking with zero hidden charges and instant GST invoice.',
    shortDesc: 'Quick checkout via UPI, GPay, PhonePe, or cards with instant tax invoice.',
    color: '#8b5cf6',
    rgb: '139, 92, 246',
    isElevated: false,
    duration: 'Instant UPI',
    features: ['UPI QR / Cards / NetBanking', '256-Bit Bank Grade Encryption', 'Instant Tax Invoice & Receipt'],
    samplePreview: {
      tag: 'Encrypted Checkout',
      detail: '₹299 Paid Securely',
      subtext: 'Txn ID: SEC-89421 • Bank Verified',
      verifiedText: 'PAYMENT SUCCESS',
    },
  },
  {
    id: 'details',
    stepNumber: '04',
    title: 'Provide Details',
    shortTitle: 'PROVIDE DETAILS',
    subtitle: 'Takes less than 2 minutes',
    headline: 'Submit Basic Candidate Details',
    description: 'Simply input the candidate’s full name, mobile number, and identity ID (Aadhaar number, Driving License, or Voter ID).',
    shortDesc: 'Input candidate name, mobile, and ID proof with 256-bit bank-grade encryption.',
    color: '#ec4899',
    rgb: '236, 72, 153',
    isElevated: true,
    duration: '< 2 Minutes',
    features: ['Direct Govt Database Query', 'Real-time Name & Face Match', 'Court Registry Litigation Scan'],
    samplePreview: {
      tag: 'Data Verification',
      detail: 'DL-14201100XXXXX / Aadhaar',
      subtext: 'Authenticated with Central Transport & UIDAI',
      verifiedText: 'DATA MATCHED',
    },
  },
  {
    id: 'download',
    stepNumber: '05',
    title: 'Download Report',
    shortTitle: 'DOWNLOAD REPORT',
    subtitle: 'Get detailed, reliable report',
    headline: 'Official Tamper-Proof Verification Report',
    description: 'Download an authenticated, audit-ready PDF background report equipped with cryptographic QR verification for print or instant sharing.',
    shortDesc: 'Download official tamper-proof PDF report with verifiable digital QR code.',
    color: '#f43f5e',
    rgb: '244, 63, 94',
    isElevated: false,
    duration: 'Instant Download',
    features: ['Official PDF Background Dossier', 'Verifiable QR Security Code', 'Instant WhatsApp & Email Copy'],
    samplePreview: {
      tag: 'Verification Dossier',
      detail: 'Status: 100% CLEAR & AUTHENTICATED',
      subtext: 'Securitas Trust Index: 98/100 • ISO Certified',
      verifiedText: 'REPORT READY',
    },
  },
];

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  avatarText: string;
  avatarBg: string;
  rating: number;
  date: string;
  category: 'domestic' | 'tenant' | 'driver' | 'personal';
  serviceUsed: string;
  serviceBadge: string;
  headline: string;
  quote: string;
  verificationBadge: string;
  tatTime: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Ananya Deshmukh',
    role: 'Homeowner & Mother of 2',
    location: 'Indiranagar, Bengaluru',
    avatarText: 'AD',
    avatarBg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    rating: 5,
    date: 'Verified 2 days ago',
    category: 'domestic',
    serviceUsed: 'Domestic Help & Maid Verification',
    serviceBadge: '🏠 Domestic Help',
    headline: 'Saved our family from a fake Aadhaar agency candidate',
    quote: 'We were about to hire a full-time live-in nanny referred by a local agency. Running a quick check on Securitas revealed the Aadhaar number provided had mismatched biometric photo records and past police dispute reports. The peace of mind this ₹249 check gave us is invaluable.',
    verificationBadge: 'Police & Aadhaar Matched',
    tatTime: 'Report in 90 secs',
  },
  {
    id: 'test-2',
    name: 'Vikramaditya Oberoi',
    role: 'Property Investor (4 Flats)',
    location: 'Bandra West, Mumbai',
    avatarText: 'VO',
    avatarBg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    rating: 5,
    date: 'Verified 4 days ago',
    category: 'tenant',
    serviceUsed: 'Tenant Rental & Court Litigation Check',
    serviceBadge: '🔑 Tenant Check',
    headline: 'Identified a commercial eviction litigation before lease signing',
    quote: 'As a landlord, rental defaults and court stays are my biggest nightmare. Securitas pulled a civil tribunal court history where the prospective tenant had two ongoing default proceedings. Saved me months of legal headaches and rent loss.',
    verificationBadge: 'High Court & e-Courts Scan',
    tatTime: 'Instant Delivery',
  },
  {
    id: 'test-3',
    name: 'Col. Rajesh Malhotra (Retd.)',
    role: 'RWA President',
    location: 'Golf Course Road, Gurugram',
    avatarText: 'RM',
    avatarBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    rating: 5,
    date: 'Verified 1 week ago',
    category: 'driver',
    serviceUsed: 'Driver License & Criminal Record Check',
    serviceBadge: '🚗 Driver & Security',
    headline: 'Every driver and guard in our society is now 100% verified',
    quote: 'We mandated Securitas screening for all private drivers and perimeter security staff in our gated society. The commercial driving license validity check and criminal court query are thorough, tamper-proof, and delivered directly with a verifiable QR report.',
    verificationBadge: 'Central Transport Registry',
    tatTime: 'TAT < 2 mins',
  },
  {
    id: 'test-4',
    name: 'Dr. Meenakshi Sundaram',
    role: 'Senior Consultant & Cardiologist',
    location: 'Alwarpet, Chennai',
    avatarText: 'MS',
    avatarBg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    rating: 5,
    date: 'Verified 1 week ago',
    category: 'domestic',
    serviceUsed: 'Caregiver Medical Cert. & Background',
    serviceBadge: '🩺 Caregiver Check',
    headline: 'Trusted companion for my 82-year-old mother',
    quote: 'When you are trusting someone with elderly parents requiring continuous medication, basic trust isn’t enough. Securitas verified past nursing credential certifications and permanent address authenticity in under two minutes.',
    verificationBadge: 'Permanent Address Verified',
    tatTime: 'Same-Day Report',
  },
  {
    id: 'test-5',
    name: 'Aditya Raghav',
    role: 'Independent Architect & Consultant',
    location: 'Koregaon Park, Pune',
    avatarText: 'RM',
    avatarBg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    rating: 5,
    date: 'Verified 2 weeks ago',
    category: 'personal',
    serviceUsed: 'Individual Self-Check Dossier',
    serviceBadge: '👤 Self-Check',
    headline: 'Shared my QR verified dossier with high-net-worth clients',
    quote: 'I got myself verified through Securitas and attached the tamper-proof QR background dossier with my high-value design proposals. Clients loved the transparency and professional integrity it demonstrated right at kickoff.',
    verificationBadge: 'Tamper-Proof QR Dossier',
    tatTime: 'Instant Download',
  },
  {
    id: 'test-6',
    name: 'Pooja Singhania',
    role: 'Parent & Business Owner',
    location: 'Jubilee Hills, Hyderabad',
    avatarText: 'PS',
    avatarBg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    rating: 5,
    date: 'Verified 3 weeks ago',
    category: 'personal',
    serviceUsed: 'Confidential Candidate Background Check',
    serviceBadge: '💍 Matrimonial',
    headline: '100% discreet verification for lifelong personal peace',
    quote: 'Zero disclosure to candidate, completely confidential litigation and financial background check. It verified employment authenticity and court registry scans seamlessly. Highly recommend for any family making serious life decisions.',
    verificationBadge: '100% Confidential Dossier',
    tatTime: '100% Discreet',
  },
];

interface HomeProps {
  onNavigateSelfVerify?: () => void;
  onNavigateDriverVerify?: () => void;
  onNavigateMaidVerify?: () => void;
  onNavigateTenantVerify?: () => void;
  onNavigateLogin?: () => void;
  onNavigateServices?: (role?: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  onNavigateSelfVerify,
  onNavigateDriverVerify,
  onNavigateMaidVerify,
  onNavigateTenantVerify,
  onNavigateLogin,
  onNavigateServices,
}) => {
  // Default to 0 -> Driver & Guard as in the screenshot
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSolutionCategory, setActiveSolutionCategory] = useState<string>('all');
  const [activeTestimonialCategory, setActiveTestimonialCategory] = useState<string>('all');
  const [cardsVisible, setCardsVisible] = useState(3);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const heroCardRef = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  // OCR Pop-up State
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrCheckDetails, setOcrCheckDetails] = useState<{
    title: string;
    price: string | number;
    docType: DocumentType;
    allowedDocTypes?: DocumentType[];
  }>({
    title: 'Instant Identity & Background Check',
    price: '₹299',
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


  // Inquiry Form State
  const [inquiryForm, setInquiryForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInquiryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.firstName || !inquiryForm.email || !inquiryForm.phone) {
      alert('Please fill in all required fields.');
      return;
    }
    setIsSubmitted(true);
  };

  const activeCategory =
    (CATEGORIES && CATEGORIES[activeCategoryIndex]) ||
    CATEGORIES[0] || {
      id: 'driver',
      name: 'Driver & Guard',
      badgeTitle: 'Driver & Security Guard',
      checkType: 'License & Criminal Check',
      checkSubtitle: 'Authenticated via Govt. & Police Databases',
      verifiedLabel: 'VERIFIED',
      price: '₹299',
      image: selfVerifyHumanImg,
      imageAlt: 'Driver and Security Guard in uniform',
    };
  const activeStep = (PROCESS_STEPS && PROCESS_STEPS[activeStepIndex]) || PROCESS_STEPS[0];

  const filteredServices =
    activeSolutionCategory === 'all'
      ? VERIFICATION_SERVICES
      : VERIFICATION_SERVICES.filter((s) => s.category === activeSolutionCategory);

  const filteredTestimonials =
    activeTestimonialCategory === 'all'
      ? TESTIMONIALS
      : TESTIMONIALS.filter((t) => t.category === activeTestimonialCategory);

  const maxTestimonialIndex = Math.max(0, filteredTestimonials.length - cardsVisible);

  // Responsive cards-per-view detection
  useEffect(() => {
    const updateCards = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 682) {
        setCardsVisible(1);
      } else if (window.innerWidth < 1024) {
        setCardsVisible(2);
      } else {
        setCardsVisible(3);
      }
    };
    updateCards();
    window.addEventListener('resize', updateCards);
    return () => window.removeEventListener('resize', updateCards);
  }, []);

  // Reset slide index when category filter or responsive layout changes
  useEffect(() => {
    setCurrentTestimonialIndex(0);
  }, [activeTestimonialCategory, cardsVisible]);

  // Smooth auto-play slider every 4.5s (pauses on hover)
  useEffect(() => {
    if (isTestimonialHovered || maxTestimonialIndex <= 0) return;
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev >= maxTestimonialIndex ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [isTestimonialHovered, maxTestimonialIndex]);

  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev >= maxTestimonialIndex ? 0 : prev + 1));
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev <= 0 ? maxTestimonialIndex : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      handleNextTestimonial();
    } else if (diff < -45) {
      handlePrevTestimonial();
    }
    setTouchStartX(null);
  };

  // Auto-running flow: transitions every 3.0 seconds, pauses smoothly on user hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % PROCESS_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-cycle banner image every 2.5 seconds
  useEffect(() => {
    const bannerInterval = setInterval(() => {
      setActiveCategoryIndex((prev) => (prev + 1) % CATEGORIES.length);
    }, 3500);
    return () => clearInterval(bannerInterval);
  }, []);

  const handleNextStep = () => {
    setActiveStepIndex((prev) => (prev + 1) % PROCESS_STEPS.length);
  };

  const handlePrevStep = () => {
    setActiveStepIndex((prev) => (prev === 0 ? PROCESS_STEPS.length - 1 : prev - 1));
  };

  return (
    <div className="home-container">
      {/* Dynamic Background Parallax Atmospheric Orbs */}
      <div className="parallax-ambient-orb orb-1" aria-hidden="true" />
      <div ref={orb2Ref} className="parallax-ambient-orb orb-2" aria-hidden="true" />
      <div className="parallax-ambient-orb orb-3" aria-hidden="true" />

      {/* ========================================================
          HERO SECTION - LUXURY ARCHITECTURAL STAGE (Ref: Traveluxe & CleanSpace)
          - Rounded Stage Container Frame
          - Multi-plane Interactive 3D Cursor and Scroll Parallax
          - Left: Preserved content, high-contrast typography, trust features row,
            and floating category thumbnails switcher
          - Right: Architectural halo arch, circular pedestal platform,
            seamless visual subject, floating frosted glass badge,
            and vertical slide indicator
         ======================================================== */}
      <main className="hero-section">
        <div
          ref={heroCardRef}
          className="hero-stage-card"
        >
          {/* Immersive Photo Background Layer with Scroll & Cursor Parallax */}
          <div
            className="hero-stage-backdrop-wrap"
            aria-hidden="true"
          >
            <img
              key={activeCategory.id}
              src={activeCategory.image}
              alt=""
              className="hero-stage-backdrop-img"
              onError={(e) => {
                e.currentTarget.src = '/self-verification.jpg';
              }}
            />
            {/* Smooth Clean Gradient Veil (Pure white fade on left, rich image on right) */}
            <div className="hero-stage-backdrop-veil"></div>
          </div>

          {/* Subtle Ambient Background Glows with Parallax */}
          <div
            className="hero-stage-ambient-glow"
            aria-hidden="true"

          ></div>

          <div
            className="hero-stage-grid"
    
          >
            {/* Left Column: Typography, Action Group, Trust Metrics & Collection Switcher */}
            <div className="hero-left">
            

              {/* Preserved Headline in 'Sora' Font */}
              <h1 className="hero-title">
                Verify Anyone Before<br />
                <span className="purple-gradient-text">You Bring Them Home.</span>
              </h1>

              {/* Preserved Crisp Subtitle */}
              <p className="hero-subtitle">
                Instant, tamper-proof background screening for domestic staff, tenants, and drivers — authenticated via Central Police &amp; Court registries in under 2 minutes.
              </p>

              {/* Preserved Action Group */}
              <div className="hero-action-bar">
                <button
                  className="start-verification-btn"
                  type="button"
                  onClick={() => {
                    let docType: DocumentType = 'aadhaar';
                    let allowed: DocumentType[] = ['aadhaar'];
                    if (activeCategory.id === 'driver') {
                      docType = 'driving_license';
                      allowed = ['driving_license'];
                    } else if (activeCategory.id === 'tenant') {
                      docType = 'pan';
                      allowed = ['pan'];
                    } else if (activeCategory.id === 'matrimonial') {
                      docType = 'passport';
                      allowed = ['passport', 'aadhaar'];
                    } else if (activeCategory.id === 'caregiver') {
                      docType = 'aadhaar';
                      allowed = ['aadhaar', 'academic_cert', 'pan'];
                    }
                    handleOpenOCR(`${activeCategory.name} Check`, activeCategory.price, docType, allowed);
                  }}
                >
                  <span>Start Verification</span>
                  <svg className="arrow-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div
                  className="price-tag-capsule"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (activeCategory.id === 'driver' && onNavigateDriverVerify) onNavigateDriverVerify();
                    else if (activeCategory.id === 'house-help' && onNavigateMaidVerify) onNavigateMaidVerify();
                    else if (activeCategory.id === 'tenant' && onNavigateTenantVerify) onNavigateTenantVerify();
                    else if (activeCategory.id === 'self-check' && onNavigateSelfVerify) onNavigateSelfVerify();
                  }}
                  title="View Dedicated Verification Page"
                >
                  <span className="price-tag-prefix">Starts at</span>
                  <span className="price-tag-value">{activeCategory.price}</span>
                  <span className="price-tag-tagline">• Instant Digital Report →</span>
                </div>
              </div>

              {/* Trust Feature Highlights Row (Inspired by Traveluxe & CleanSpace references) */}
              <div className="hero-trust-features-row">
                <div className="hero-trust-feat-item">
                  <div className="feat-icon-disc">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="feat-text-wrap">
                    <span className="feat-title">Police &amp; Court</span>
                    <span className="feat-sub">Official Records</span>
                  </div>
                </div>

                <div className="hero-trust-feat-item">
                  <div className="feat-icon-disc">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="feat-text-wrap">
                    <span className="feat-title">&lt; 2-Minute Speed</span>
                    <span className="feat-sub">Instant Digital Report</span>
                  </div>
                </div>  

                <div className="hero-trust-feat-item">
                  <div className="feat-icon-disc">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="feat-text-wrap">
                    <span className="feat-title">Tamper-Proof</span>
                    <span className="feat-sub">QR-Authenticated</span>
                  </div>
                 </div>

                <div className="hero-trust-feat-item">
                  <div className="feat-icon-disc">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <div className="feat-text-wrap">
                    <span className="feat-title">ISO 27001</span>
                    <span className="feat-sub">Bank-Grade Privacy</span>
                  </div>
                </div>
              </div>

              {/* Floating Collection Switcher Capsule with 3D Parallax */}
              <div
                className="hero-collection-switcher"
                aria-label="Explore Verification Categories"
               
              >
                <div className="switcher-header-label">
                  <span>Explore Services</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
                <div className="switcher-thumbnails-track">
                  {CATEGORIES.map((cat, idx) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`switcher-thumb-pill ${activeCategoryIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveCategoryIndex(idx)}
                      aria-label={`Select ${cat.name}`}
                    >
                      <img src={cat.image} alt={cat.name} className="switcher-thumb-img" />
                      <span className="switcher-thumb-name">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Luxury Showcase Stage */}
            <div className="hero-right">
              <div className="hero-stage-showcase">
             
          

          

                {/* Vertical Slide Progress Indicator (01 / - / 06) */}
                <div className="stage-vertical-indicator" aria-label="Current category index">
                  <span className="counter-num current">{`0${activeCategoryIndex + 1}`}</span>
                  <div className="counter-bar-track">
                    {CATEGORIES.map((cat, idx) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`counter-pip ${activeCategoryIndex === idx ? 'active' : ''}`}
                        onClick={() => setActiveCategoryIndex(idx)}
                        aria-label={`Jump to ${cat.name}`}
                      />
                    ))}
                  </div>
                  <span className="counter-num total">{`0${CATEGORIES.length}`}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ========================================================
          SIMPLIFIED STATS TRUST BANNER
          - Minimalist, sleek single-surface ribbon with subtle dividers
          - Reduced extra content (no micro pills, no wordy subtitles)
          - High-contrast numbers, clean labels, and refined icons
         ======================================================== */}
      <section className="stats-banner-section" aria-label="Securitas Statistics & Trust Metrics">
        <div className="stats-glass-container">
          <div className="stats-grid">
            {/* Metric 1: Satisfied Clients */}
            <div className="stat-item stat-item-blue">
              <div className="stat-icon-disc">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-text-group">
                <div className="stat-number">
                  1,000<span className="stat-accent">+</span>
                </div>
                <div className="stat-label">Satisfied Clients</div>
              </div>
            </div>

            {/* Metric 2: Checks Delivered */}
            <div className="stat-item stat-item-emerald">
              <div className="stat-icon-disc">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="stat-text-group">
                <div className="stat-number">
                  20M<span className="stat-accent">+</span>
                </div>
                <div className="stat-label">Checks Delivered</div>
              </div>
            </div>

            {/* Metric 3: Industry Heritage */}
            <div className="stat-item stat-item-purple">
              <div className="stat-icon-disc">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <div className="stat-text-group">
                <div className="stat-number">
                  25+<span className="stat-accent-unit"> Years</span>
                </div>
                <div className="stat-label">Industry Heritage</div>
              </div>
            </div>

            {/* Metric 4: On-Time Delivery */}
            <div className="stat-item stat-item-amber">
              <div className="stat-icon-disc">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-text-group">
                <div className="stat-number">
                  98.4<span className="stat-accent">%</span>
                </div>
                <div className="stat-label">On-Time Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

  

      {/* ========================================================
          AUTO-RUNNING 5-STEP PROCESS FLOW
          - Continuous Auto-Advancing Flow (pauses on hover)
          - Clean Design Without Numeric Step Counters
          - Electric Energy Beam & Glowing Radar Halo Nodes
          - Dynamic Explainer Showcase Card with Live Simulation
         ======================================================== */}
      <section
        id="how-it-works"
        className="process-flow-section"
        aria-label="How Verification Works"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="process-header">
          <div className="process-pill-badge">
            <span className="live-auto-indicator"></span>
            <span>FAST &amp; AUTOMATED PROCESS</span>
          </div>
          <h2 className="process-main-title">How Securitas Works</h2>
          <div className="process-purple-subtitle">Simple 5-Step Verification Journey</div>
          <p className="process-tagline">
            Get an official, authenticated background check in 5 easy steps (click any step to explore):
          </p>
        </div>

        {/* 5-Step Isometric Infographic Pillars (Redesigned matching reference) */}
        <div className="isometric-flowchart-wrapper">
          <div className="isometric-pillars-grid">
            {PROCESS_STEPS.map((step, index) => {
              const isActive = activeStepIndex === index;
              return (
                <div
                  key={step.id}
                  className={`isometric-column-card ${step.isElevated ? 'elevated' : 'baseline'} ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveStepIndex(index)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${step.title} - Step ${index + 1}`}
                  style={{ '--step-color': step.color, '--step-rgb': step.rgb } as React.CSSProperties}
                >
                  {/* Isometric 3D Visual Vessel */}
                  <div className="iso-vessel-stage">
                    {/* Active Step Indicator Halo */}
                    {isActive && <div className="iso-active-halo-glow" />}

                    <svg
                      className="iso-pillar-svg"
                      viewBox="0 0 160 280"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        {/* Pedestal Wall Gradient */}
                        <linearGradient id={`pedWall-${step.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#081324" />
                          <stop offset="30%" stopColor={step.color} />
                          <stop offset="70%" stopColor={step.color} />
                          <stop offset="100%" stopColor="#030812" />
                        </linearGradient>

                        {/* Pedestal Top Gloss Plate */}
                        <linearGradient id={`pedTop-${step.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="65%" stopColor="#f8fafc" />
                          <stop offset="100%" stopColor="#e2e8f0" />
                        </linearGradient>

                        {/* Pedestal Core Inner Glow */}
                        <radialGradient id={`pedCore-${step.id}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={`rgba(${step.rgb}, 0.55)`} />
                          <stop offset="55%" stopColor={`rgba(${step.rgb}, 0.22)`} />
                          <stop offset="100%" stopColor={`rgba(${step.rgb}, 0.02)`} />
                        </radialGradient>

                        {/* Translucent Glass Beam Gradient */}
                        <linearGradient id={`beamGrad-${step.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor={`rgba(${step.rgb}, 0.32)`} />
                          <stop offset="30%" stopColor={`rgba(${step.rgb}, 0.17)`} />
                          <stop offset="70%" stopColor={`rgba(${step.rgb}, 0.04)`} />
                          <stop offset="100%" stopColor={`rgba(${step.rgb}, 0.0)`} />
                        </linearGradient>

                        {/* Bulb specific gradient */}
                        <linearGradient id={`bulbFill-${step.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>

                        {/* Gear specific gradient */}
                        <linearGradient id={`gearFill-${step.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>

                        {/* Lens gradient */}
                        <radialGradient id={`lensGrad-${step.id}`} cx="35%" cy="35%" r="65%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                          <stop offset="40%" stopColor="rgba(167,139,250,0.5)" />
                          <stop offset="100%" stopColor="rgba(124,58,237,0.3)" />
                        </radialGradient>
                      </defs>

                      {/* 1. Floor Dashed Orbit Ring */}
                      <ellipse
                        className='rotate-ring'
                        cx="80"
                        cy="224"
                        rx="68"
                        ry="22"
                        stroke={step.color}
                        strokeDasharray="5 4"
                        strokeWidth="1.8"
                        opacity={isActive ? 0.95 : 0.65}
                        fill="none"
                      />

                      {/* 2. Ground Contact Drop Shadows */}
                      <ellipse cx="80" cy="225" rx="52" ry="16" fill="rgba(15, 23, 42, 0.16)" />
                      <ellipse cx="80" cy="226" rx="42" ry="13" fill={`rgba(${step.rgb}, 0.25)`} />

                      {/* 3. 3D Pedestal Wall (Front/Bottom Rim) */}
                      <path
                        d="M 34,200 L 34,222 A 46,15 0 0,0 126,222 L 126,200 A 46,15 0 0,1 34,200 Z"
                        fill={`url(#pedWall-${step.id})`}
                      />

                      {/* 4. Pedestal Top Disc (White glossy platform) */}
                      <ellipse
                        cx="80"
                        cy="200"
                        rx="46"
                        ry="15"
                        fill={`url(#pedTop-${step.id})`}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />

                      {/* 5. Inset Core Light Well */}
                      <ellipse
                        cx="80"
                        cy="200"
                        rx="35"
                        ry="11"
                        fill={`url(#pedCore-${step.id})`}
                        stroke={`rgba(${step.rgb}, 0.4)`}
                        strokeWidth="1"
                      />

                      {/* 6. Icon Drop Shadow on Disc */}
                      <ellipse
                        cx="80"
                        cy="199"
                        rx="16"
                        ry="5"
                        fill={`rgba(${step.rgb}, 0.45)`}
                        opacity="0.7"
                      />

                      {/* 7. Glass Cylinder Light Beam */}
                      <path
                        d="M 44,200 L 44,45 A 36,11 0 0,1 116,45 L 116,200 A 36,11 0 0,1 44,200 Z"
                        fill={`url(#beamGrad-${step.id})`}
                      />
                      <line x1="44" y1="200" x2="44" y2="45" stroke={`rgba(${step.rgb}, 0.35)`} strokeWidth="1.2" />
                      <line x1="116" y1="200" x2="116" y2="45" stroke={`rgba(${step.rgb}, 0.35)`} strokeWidth="1.2" />
                      <ellipse className='rotate-ring' cx="80" cy="45" rx="36" ry="11" fill="none" stroke={`rgba(${step.rgb}, 0.25)`} strokeWidth="1" strokeDasharray="3 3" />

                      {/* 8. Floating Holographic 3D Icon */}
                      {step.id === 'register' && (
                        <g className="iso-floating-icon" transform="translate(80, 115)">
                          <circle cx="0" cy="0" r="26" fill="rgba(16, 185, 129, 0.14)" />
                          <line x1="-19" y1="-17" x2="-14" y2="-12" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
                          <line x1="19" y1="-17" x2="14" y2="-12" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
                          <line x1="-24" y1="0" x2="-17" y2="0" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
                          <line x1="24" y1="0" x2="17" y2="0" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
                          <line x1="0" y1="-24" x2="0" y2="-17" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
                          <path
                            d="M-10,-5 C-13,-12 -8,-20 0,-20 C8,-20 13,-12 10,-5 C8,-2 7,2 5,6 L-5,6 C-7,2 -8,-2 -10,-5 Z"
                            fill={`url(#bulbFill-${step.id})`}
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path d="M-4,-4 L-2,-12 L2,-12 L4,-4" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <rect x="-4.5" y="7" width="9" height="3" rx="1.2" fill="#047857" stroke="#10b981" strokeWidth="1" />
                          <rect x="-3" y="11" width="6" height="2.5" rx="1" fill="#065f46" />
                        </g>
                      )}

                      {step.id === 'product' && (
                        <g className="iso-floating-icon" transform="translate(80, 115)">
                          <circle cx="0" cy="0" r="26" fill="rgba(14, 165, 233, 0.16)" />
                          <path
                            d="M-6,-18 L6,-18 L8,-14 L14,-14 L17,-9 L14,-4 L16,2 L21,5 L19,11 L14,12 L11,17 L6,16 L3,20 L-3,20 L-6,16 L-11,17 L-14,12 L-19,11 L-21,5 L-16,2 L-14,-4 L-17,-9 L-14,-14 L-8,-14 Z"
                            fill="#0369a1"
                            transform="translate(2, 3)"
                            opacity="0.5"
                          />
                          <path
                            d="M-6,-18 L6,-18 L8,-14 L14,-14 L17,-9 L14,-4 L16,2 L21,5 L19,11 L14,12 L11,17 L6,16 L3,20 L-3,20 L-6,16 L-11,17 L-14,12 L-19,11 L-21,5 L-16,2 L-14,-4 L-17,-9 L-14,-14 L-8,-14 Z"
                            fill={`url(#gearFill-${step.id})`}
                            stroke="#38bdf8"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                          <circle cx="0" cy="1" r="6" fill="#075985" stroke="#bae6fd" strokeWidth="1.6" />
                        </g>
                      )}

                      {step.id === 'payment' && (
                        <g className="iso-floating-icon" transform="translate(80, 115)">
                          <circle cx="-3" cy="-3" r="24" fill="rgba(139, 92, 246, 0.16)" />
                          <line x1="7" y1="7" x2="20" y2="20" stroke="#4c1d95" strokeWidth="5.5" strokeLinecap="round" />
                          <line x1="6" y1="6" x2="19" y2="19" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" />
                          <line x1="5.5" y1="5.5" x2="17" y2="17" stroke="#ddd6fe" strokeWidth="1.4" strokeLinecap="round" />
                          <circle cx="-5" cy="-5" r="14" fill="none" stroke="#4c1d95" strokeWidth="3" transform="translate(1.5, 2)" opacity="0.6" />
                          <circle cx="-5" cy="-5" r="14" fill={`url(#lensGrad-${step.id})`} stroke="#a78bfa" strokeWidth="2.8" />
                          <path d="M-13,-8 A10,10 0 0,1 -6,-15" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
                        </g>
                      )}

                      {step.id === 'details' && (
                        <g className="iso-floating-icon" transform="translate(80, 115)">
                          <circle cx="0" cy="0" r="24" fill="rgba(236, 72, 153, 0.16)" />
                          <path d="M-11,2 L7,-14 M7,-14 L-1,-14 M7,-14 L7,-6" stroke="#831843" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5, 2)" opacity="0.5" />
                          <path d="M-11,2 L7,-14 M7,-14 L-1,-14 M7,-14 L7,-6" stroke="#ec4899" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M-11,2 L7,-14 M7,-14 L-1,-14 M7,-14 L7,-6" stroke="#fbcfe8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                          <path d="M11,-2 L-7,14 M-7,14 L1,14 M-7,14 L-7,6" stroke="#831843" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5, 2)" opacity="0.5" />
                          <path d="M11,-2 L-7,14 M-7,14 L1,14 M-7,14 L-7,6" stroke="#f43f5e" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M11,-2 L-7,14 M-7,14 L1,14 M-7,14 L-7,6" stroke="#fecdd3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                        </g>
                      )}

                      {step.id === 'download' && (
                        <g className="iso-floating-icon" transform="translate(80, 115)">
                          <circle cx="0" cy="0" r="26" fill="rgba(244, 63, 94, 0.16)" />
                          <circle cx="-11" cy="-7" r="4.5" fill="#be123c" />
                          <path d="M-17,6 C-17,1 -14, -1 -11, -1 C-8, -1 -5, 1 -5, 6 Z" fill="#9f1239" />
                          <circle cx="11" cy="-7" r="4.5" fill="#be123c" />
                          <path d="M5,6 C5,1 8, -1 11, -1 C14, -1 17, 1 17, 6 Z" fill="#9f1239" />
                          <circle cx="0" cy="-3" r="5.5" fill="#f43f5e" stroke="#ffe4e6" strokeWidth="1.2" />
                          <path d="M-8,14 C-8,7 -4, 4 0, 4 C4, 4 8, 7 8, 14 Z" fill="#e11d48" stroke="#ffe4e6" strokeWidth="1.2" />
                          <path d="M-2.5,9 L-0.5,11 L3,7" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      )}
                    </svg>
                  </div>

                  {/* Column Bottom Typography */}
                  <div className="iso-column-content">
                    {/* <div className="iso-step-tag" style={{ color: step.color, borderColor: `rgba(${step.rgb}, 0.3)` }}>
                      STEP {step.stepNumber}
                    </div> */}
                    <h3 className="iso-column-title" style={{ color: step.color }}>
                      {step.shortTitle}
                    </h3>
                    <p className="iso-column-desc">
                      {step.shortDesc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>
      {/* ========================================================
          WHAT DO YOU WANT TO VERIFY? CAROUSEL (Scenic Luxury Card Design)
          - Rounded luxury card design matching user reference
          - Top image fading seamlessly into dark ambient gradient
          - 3-dots indicator on photo
          - Title and Price pill row
          - Clean 2-line subtitle
          - Frosted glass tag pills
          - Full-width white pill CTA button
          - Smooth Carousel navigation with arrows, snap scroll, and indicators
         ======================================================== */}
      <section id="verify-solutions" className="verify-solutions-section" aria-label="Verification Solutions">
        <div className="section-head-wrap">
          <div className="section-pill-tag">
            <span className="sparkle-icon">✦</span>
            <span>TAILORED VERIFICATION SOLUTIONS</span>
          </div>
          <h2 className="solutions-main-title">
            What do you want to <span className="purple-gradient-text">Verify?</span>
          </h2>
          <p className="solutions-tagline">
            Select a specialized background check tailored for your family, property, or workplace:
          </p>

          {/* Interactive Filter Pills */}
          <div className="solutions-controls-row">
            <div className="solutions-filter-bar">
              {[
                { id: 'all', label: 'All Checks (6)' },
                { id: 'home', label: 'Home & Family (2)' },
                { id: 'property', label: 'Rental & Tenant (1)' },
                { id: 'personal', label: 'Personal & Trust (2)' },
                { id: 'business', label: 'Workforce & B2B (1)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`solutions-filter-tab ${activeSolutionCategory === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveSolutionCategory(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {onNavigateServices && (
              <button
                type="button"
                className="solutions-all-checks-pill-btn"
                onClick={onNavigateServices}
                style={{
                  background: '#080f1e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.2s ease',
                  marginLeft: 'auto',
                }}
              >
                <span>Explore All 18 Checks Catalogue</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* All Verification Cards in One Continuous Horizontal Row */}
        <div className="solutions-cards-row">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="luxury-scenic-card"
              style={{ background: service.themeGradient }}
            >
              {/* Top Image Media with Full-Height Hover Animation */}
              <div className="scenic-media-wrap">
                <img
                  src={service.image}
                  alt={service.title}
                  className="scenic-banner-img"
                  onError={(e) => {
                    e.currentTarget.src = '/self-verification.jpg';
                  }}
                />
                <div
                  className="scenic-media-gradient-fade"
                  style={{
                    background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 30%, ${service.fadeColor} 98%)`,
                  }}
                />

                {/* 3-Dots Photo Indicator Matching Reference */}
                <div className="scenic-photo-dots" aria-hidden="true">
                  <span className="dot"></span>
                  <span className="dot active"></span>
                  <span className="dot"></span>
                </div>
              </div>

              {/* Lower Card Information Content */}
              <div className="scenic-card-body">
                {/* Title & Price Capsule Row */}
                <div className="scenic-header-row">
                  <h3 className="scenic-title">{service.title}</h3>
                  <div className="scenic-price-pill">{service.price}</div>
                </div>

                {/* Description */}
                <p className="scenic-description">{service.description}</p>

                {/* Frosted Tags Pill Cloud */}
                <div className="scenic-tags-row">
                  {service.tags.map((tag, i) => (
                    <span key={i} className="scenic-tag-capsule">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Solid White Pill Action Button */}
                <button
                  type="button"
                  className="scenic-reserve-btn"
                  onClick={() => {
                    let defaultDoc: DocumentType = 'aadhaar';
                    let allowed: DocumentType[] = ['aadhaar'];
                    if (service.id === 'tenant') {
                      defaultDoc = 'pan';
                      allowed = ['pan'];
                    } else if (service.id === 'workplace') {
                      defaultDoc = 'driving_license';
                      allowed = ['driving_license'];
                    } else if (service.id === 'domestic-help') {
                      defaultDoc = 'aadhaar';
                      allowed = ['aadhaar'];
                    } else if (service.id === 'matchmaking') {
                      defaultDoc = 'passport';
                      allowed = ['passport', 'aadhaar'];
                    }
                    handleOpenOCR(service.title, service.price, defaultDoc, allowed);
                  }}
                >
                  <span>{service.btnText}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Redesigned Luxury Infinite Marquee Section */}
      <section className="redesigned-marquee-section" aria-label="Coverage Across Roles">
        <div className="marquee-badge-header">
          <span className="marquee-pulse-dot"></span>
          <span className="marquee-badge-title">COVERAGE ACROSS 50+ CRITICAL ROLES &amp; SERVICES</span>
          <span className="marquee-badge-pill">100% GOVT &amp; POLICE INTEGRATED</span>
        </div>

        <div className="marquee-ticker-container">
          {/* Smooth Edge Fade Gradients */}
          <div className="marquee-fade-edge left" aria-hidden="true"></div>
          <div className="marquee-fade-edge right" aria-hidden="true"></div>

          {/* Row 1: Emerald Neon Ticker scrolling left */}
          <div className="marquee-track marquee-row-green">
            <div className="marquee-content-loop">
              {GREEN_TICKER_ITEMS.concat(GREEN_TICKER_ITEMS).concat(GREEN_TICKER_ITEMS).map((item, i) => (
                <div key={i} className="ticker-pill pill-green">
                  <span className="ticker-pill-icon">{item.icon}</span>
                  <span className="ticker-pill-name">{item.name}</span>
                  <span className="ticker-pill-badge">{item.badge}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Row 2: Violet Electric Ticker scrolling right */}
          <div className="marquee-track marquee-row-purple">
            <div className="marquee-content-loop reverse">
              {PURPLE_TICKER_ITEMS.concat(PURPLE_TICKER_ITEMS).concat(PURPLE_TICKER_ITEMS).map((item, i) => (
                <div key={i} className="ticker-pill pill-purple">
                  <span className="ticker-pill-icon">{item.icon}</span>
                  <span className="ticker-pill-name">{item.name}</span>
                  <span className="ticker-pill-badge">{item.badge}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          LUXURY TESTIMONIALS & TRUST EXPERIENCES SECTION
          - Architectural Luxury Design matching Securitas Theme
          - Aggregate Trust Rating Bar (4.9/5 from 18,400+ reviews)
          - Interactive Category Filter Tabs
          - 3-Column Responsive Glass Cards with Glowing Badges
          - Comprehensive Trust Statistics Strip & Fast CTA
         ======================================================== */}
      <section id="testimonials" className="testimonials-section" aria-label="Customer Reviews and Verification Stories">
        <div className="testimonials-head-wrap">
          <div className="testimonials-pill-tag">
            <span className="star-sparkle">★</span>
            <span>4.9 / 5 RATED BY 50,000+ INDIAN FAMILIES</span>
          </div>

            <h2 className="testimonials-main-title">
              Real Stories. Zero Regrets.<br />
              <span className="purple-gradient-text">Verified Peace of Mind.</span>
            </h2>

            <p className="testimonials-tagline">
              Discover how homeowners, RWAs, and landlords protected their families, homes, and assets before handing over keys.
            </p>

            {/* Aggregate Trust Bar */}
            <div className="aggregate-trust-bar">
              <div className="trust-score-badge">
                <span className="score-num">4.9</span>
                <div className="stars-stack">
                  <div className="stars-row" aria-label="5 out of 5 stars">★★★★★</div>
                  <span className="score-label">18,400+ Verified Reviews</span>
                </div>
              </div>

              <div className="trust-divider" aria-hidden="true"></div>

              <div className="trust-metric-pill">
                <span className="metric-icon">🛡️</span>
                <div className="metric-text">
                  <span className="metric-title">100% Tamper-Proof</span>
                  <span className="metric-sub">Official Govt &amp; Court Databases</span>
                </div>
              </div>

              <div className="trust-divider" aria-hidden="true"></div>

              <div className="trust-metric-pill">
                <span className="metric-icon">⚡</span>
                <div className="metric-text">
                  <span className="metric-title">&lt; 2-Minute Speed</span>
                  <span className="metric-sub">Instant Verifiable PDF Report</span>
                </div>
              </div>

              <div className="trust-divider" aria-hidden="true"></div>

              <div className="trust-metric-pill">
                <span className="metric-icon">🔒</span>
                <div className="metric-text">
                  <span className="metric-title">Bank-Grade Privacy</span>
                  <span className="metric-sub">ISO 27001 Certified System</span>
                </div>
              </div>
            </div>

            {/* Interactive Category Filter Pills & Modern Slider Controls Bar */}
            <div className="testimonial-controls-bar">
         

              {/* Slider Status & Interactive Navigation Controls */}
              <div className="slider-action-controls">
              

                <div className="slider-nav-arrows">
                  <button
                    type="button"
                    className="slider-nav-btn prev"
                    onClick={handlePrevTestimonial}
                    disabled={maxTestimonialIndex <= 0}
                    aria-label="Previous testimonials"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="slider-nav-btn next"
                    onClick={handleNextTestimonial}
                    disabled={maxTestimonialIndex <= 0}
                    aria-label="Next testimonials"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Testimonials Modern Interactive Slider Viewport & Track */}
          <div
            className="testimonials-slider-container"
            onMouseEnter={() => setIsTestimonialHovered(true)}
            onMouseLeave={() => setIsTestimonialHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="testimonials-slider-viewport">
              <div
                className="testimonials-slider-track"
                style={{
                  transform: `translateX(calc(-1 * ${currentTestimonialIndex} * (100% + var(--slider-gap)) / var(--cards-visible)))`,
                }}
              >
                {filteredTestimonials.map((item) => (
                  <div key={item.id} className="testimonials-slider-card-wrap">
                    <div className="testimonial-card">
                      {/* Ambient Spotlight inside Card (Illuminates smoothly on hover) */}
                      <div className="testimonial-card-spotlight" aria-hidden="true" />

                      {/* Glowing Top Ambient Accent Hairline */}
                      <div className="testimonial-card-glow-line" aria-hidden="true" />

                      {/* Decorative Editorial Serif Quotation Watermark */}
                      <span className="testimonial-quote-watermark" aria-hidden="true">&ldquo;</span>

                      {/* Top Meta Bar: Service Pill + 5-Star Rating Capsule */}
                      <div className="card-top-pill-row">
                        <div className="service-category-tag">
                          <span className="service-tag-sparkle">✦</span>
                          <span>{item.serviceBadge}</span>
                        </div>

                        <div className="rating-golden-capsule">
                          <div className="stars-row-gold">
                            {[...Array(5)].map((_, starI) => (
                              <svg key={starI} width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                          </div>
                          <span className="rating-score-num">5.0</span>
                        </div>
                      </div>

                      {/* Author Profile Header */}
                      <div className="card-author-header">
                        <div className="author-avatar-halo">
                          <div className="author-avatar" style={{ background: item.avatarBg }}>
                            <span>{item.avatarText}</span>
                          </div>
                          <span className="avatar-shield-badge" title="Identity & Biometrics Verified">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        </div>

                        <div className="author-meta-block">
                          <div className="author-name-row">
                            <h4 className="author-name">{item.name}</h4>
                            <span className="verified-buyer-pill">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                              </svg>
                              VERIFIED
                            </span>
                          </div>
                          <p className="author-role">{item.role}</p>
                          <div className="author-sub-line">
                            <span className="author-city">📍 {item.location}</span>
                            <span className="author-dot-divider">•</span>
                            <span className="verified-date-chip">{item.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Review Headline & Testimonial Quote */}
                      <div className="card-quote-body">
                        <h3 className="testimonial-headline">&ldquo;{item.headline}&rdquo;</h3>
                        <p className="testimonial-quote">{item.quote}</p>
                      </div>

                      {/* Card Bottom: Verification Outcome & Live Dossier Pill */}
                      <div className="testimonial-card-footer">
                        <div className="outcome-pill">
                          <span className="outcome-pulse-dot" />
                          <span>{item.verificationBadge}</span>
                        </div>

                        <div className="footer-meta-right">
                          <span className="tat-pill">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            {item.tatTime}
                          </span>
                          <span className="audit-hash-chip">#SEC-{item.id.replace('test-', '98')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slider Bottom Indicators & Timer */}
            {maxTestimonialIndex > 0 && (
              <div className="testimonials-slider-bottom-bar">
                <div className="testimonials-slider-pagination" role="tablist" aria-label="Slide indicators">
                  {Array.from({ length: maxTestimonialIndex + 1 }).map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      className={`slider-pagination-dot ${currentTestimonialIndex === dotIdx ? 'active' : ''}`}
                      onClick={() => setCurrentTestimonialIndex(dotIdx)}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                      aria-current={currentTestimonialIndex === dotIdx ? 'true' : 'false'}
                    />
                  ))}
                </div>

                <div className="slider-timer-bar-wrap" title={isTestimonialHovered ? 'Auto-play paused' : 'Auto-playing'}>
                  <div
                    key={`${currentTestimonialIndex}-${isTestimonialHovered}`}
                    className={`slider-timer-bar-fill ${isTestimonialHovered ? 'paused' : 'running'}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scoped Dedicated Slider & Luxury Card Styles (Self-contained in home.tsx) */}
          <style>{`
            .testimonial-controls-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              margin-top: 18px;
              flex-wrap: wrap;
              width: 100%;
            }

            .slider-action-controls {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              margin-left: auto;
            }

            .slider-status-badge {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              padding: 7px 14px;
              border-radius: 9999px;
              background: rgba(124, 58, 237, 0.08);
              border: 1px solid rgba(124, 58, 237, 0.22);
              color: #6d28d9;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.5px;
              box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
            }

            [data-theme="dark"] .slider-status-badge,
            .dark-theme .slider-status-badge {
              background: rgba(124, 58, 237, 0.18);
              border-color: rgba(124, 58, 237, 0.4);
              color: #c4b5fd;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }

            .slider-status-dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #10b981;
              box-shadow: 0 0 8px #10b981;
              transition: all 0.25s ease;
            }

            .slider-status-dot.running {
              animation: statusPulse 2s ease-in-out infinite;
            }

            .slider-status-dot.paused {
              background: #f59e0b;
              box-shadow: 0 0 8px #f59e0b;
              animation: none;
            }

            @keyframes statusPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.4; transform: scale(0.85); }
            }

            .slider-status-label {
              font-family: inherit;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.8px;
            }

            .slider-counter-divider {
              color: rgba(124, 58, 237, 0.4);
            }

            .slider-counter-num {
              font-variant-numeric: tabular-nums;
              font-weight: 800;
            }

            .slider-nav-arrows {
              display: inline-flex;
              align-items: center;
              gap: 8px;
            }

            .slider-nav-btn {
              width: 42px;
              height: 42px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #ffffff;
              border: 1px solid rgba(226, 232, 240, 0.95);
              color: #0f172a;
              cursor: pointer;
              transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
              box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
            }

            .slider-nav-btn:hover:not(:disabled) {
              background: #080f1e;
              color: #ffffff;
              border-color: #080f1e;
              transform: translateY(-2px) scale(1.05);
              box-shadow: 0 8px 20px rgba(8, 15, 30, 0.22);
            }

            .slider-nav-btn:active:not(:disabled) {
              transform: translateY(0) scale(0.96);
            }

            .slider-nav-btn:disabled {
              opacity: 0.35;
              cursor: not-allowed;
              box-shadow: none;
            }

            [data-theme="dark"] .slider-nav-btn,
            .dark-theme .slider-nav-btn {
              background: #0f1c30;
              border-color: rgba(255, 255, 255, 0.12);
              color: #f8fafc;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
            }

            [data-theme="dark"] .slider-nav-btn:hover:not(:disabled),
            .dark-theme .slider-nav-btn:hover:not(:disabled) {
              background: #1e293b;
              border-color: #38bdf8;
              color: #38bdf8;
              box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
            }

            .testimonials-slider-container {
              position: relative;
              width: 100%;
              margin: 28px 0 40px;
            }

            .testimonials-slider-viewport {
              width: 100%;
              overflow: hidden;
              padding: 16px 6px 26px;
              box-sizing: border-box;
            }

            .testimonials-slider-track {
              display: flex;
              gap: 22px;
              transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
              will-change: transform;
              --slider-gap: 22px;
              --cards-visible: 3;
            }

            @media (max-width: 1024px) {
              .testimonials-slider-track {
                --cards-visible: 2;
              }
            }

            @media (max-width: 680px) {
              .testimonials-slider-track {
                --cards-visible: 1;
              }
              .slider-action-controls {
                width: 100%;
                justify-content: space-between;
                margin-left: 0;
                margin-top: 10px;
              }
            }

            .testimonials-slider-card-wrap {
              flex: 0 0 calc((100% - (var(--cards-visible) - 1) * var(--slider-gap)) / var(--cards-visible));
              max-width: calc((100% - (var(--cards-visible) - 1) * var(--slider-gap)) / var(--cards-visible));
              box-sizing: border-box;
              display: flex;
            }

            /* ========================================================
               LUXURY TESTIMONIAL CARD UI & REFINED HOVER EFFECTS
            ======================================================== */
            .testimonials-slider-card-wrap .testimonial-card {
              position: relative;
              background: #ffffff;
              border: 1px solid rgba(226, 232, 240, 0.95);
              border-radius: 26px;
              padding: 26px 24px 22px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              text-align: left;
              box-shadow:
                0 10px 28px -8px rgba(15, 23, 42, 0.06),
                0 0 0 1px rgba(255, 255, 255, 0.9) inset;
              transition: all 0.38s cubic-bezier(0.16, 1, 0.3, 1);
              overflow: hidden;
              box-sizing: border-box;
              width: 100%;
              min-height: 420px;
            }

            [data-theme="dark"] .testimonials-slider-card-wrap .testimonial-card,
            .dark-theme .testimonials-slider-card-wrap .testimonial-card {
              background: #0a111e;
              border-color: rgba(255, 255, 255, 0.1);
              box-shadow:
                0 16px 36px -10px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.05) inset;
            }

            /* Ambient Spotlight Inside Card (Disabled gradient hover) */
            .testimonial-card-spotlight {
              display: none;
            }

            /* Top Accent Hairline */
            .testimonial-card-glow-line {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: #10b981;
              opacity: 0.85;
              transition: all 0.35s ease;
              z-index: 2;
            }

            /* HOVER INTERACTIONS ON THE CARD (Clean subtle shadow, no gradient) */
            .testimonials-slider-card-wrap .testimonial-card:hover {
              transform: translateY(-5px);
              border-color: #cbd5e1;
              box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
            }

            [data-theme="dark"] .testimonials-slider-card-wrap .testimonial-card:hover,
            .dark-theme .testimonials-slider-card-wrap .testimonial-card:hover {
              border-color: rgba(255, 255, 255, 0.18);
              box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-card-glow-line {
              height: 3px;
              filter: none;
              opacity: 1;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-card-spotlight {
              display: none;
            }

            /* Watermark Serif Quote */
            .testimonial-quote-watermark {
              position: absolute;
              top: 14px;
              right: 22px;
              font-family: "Playfair Display", Georgia, serif;
              font-size: 96px;
              line-height: 0.6;
              color: rgba(15, 23, 42, 0.04);
              pointer-events: none;
              user-select: none;
              z-index: 0;
              transition: all 0.4s ease;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-quote-watermark {
              color: rgba(15, 23, 42, 0.08);
              transform: none;
            }

            [data-theme="dark"] .testimonial-quote-watermark,
            .dark-theme .testimonial-quote-watermark {
              color: rgba(255, 255, 255, 0.04);
            }

            [data-theme="dark"] .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-quote-watermark,
            .dark-theme .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-quote-watermark {
              color: rgba(255, 255, 255, 0.08);
              }

            /* Top Pill Row (Service Tag + 5-Star Rating) */
            .card-top-pill-row {
              position: relative;
              z-index: 1;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              margin-bottom: 16px;
            }

            .service-category-tag {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(124, 58, 237, 0.07);
              border: 1px solid rgba(124, 58, 237, 0.2);
              color: #6d28d9;
              font-size: 11px;
              font-weight: 800;
              padding: 4.5px 11px;
              border-radius: 9999px;
              letter-spacing: 0.3px;
              transition: all 0.25s ease;
            }

            .service-tag-sparkle {
              font-size: 10px;
              color: #7c3aed;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .service-category-tag {
              background: rgba(124, 58, 237, 0.14);
              border-color: rgba(124, 58, 237, 0.45);
              transform: scale(1.02);
            }

            [data-theme="dark"] .service-category-tag,
            .dark-theme .service-category-tag {
              background: rgba(124, 58, 237, 0.18);
              border-color: rgba(124, 58, 237, 0.35);
              color: #c4b5fd;
            }

            .rating-golden-capsule {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              background: #fffbeb;
              border: 1px solid #fde68a;
              padding: 4px 10px;
              border-radius: 9999px;
              box-shadow: 0 1px 4px rgba(245, 158, 11, 0.12);
              transition: all 0.25s ease;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .rating-golden-capsule {
              box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
              transform: scale(1.03);
            }

            [data-theme="dark"] .rating-golden-capsule,
            .dark-theme .rating-golden-capsule {
              background: rgba(245, 158, 11, 0.12);
              border-color: rgba(245, 158, 11, 0.3);
            }

            .stars-row-gold {
              display: flex;
              align-items: center;
              gap: 2px;
            }

            .rating-score-num {
              font-size: 11px;
              font-weight: 800;
              color: #b45309;
            }

            [data-theme="dark"] .rating-score-num,
            .dark-theme .rating-score-num {
              color: #fcd34d;
            }

            /* Author Profile Header */
            .card-author-header {
              position: relative;
              z-index: 1;
              display: flex;
              align-items: center;
              gap: 14px;
              margin-bottom: 16px;
            }

            .author-avatar-halo {
              position: relative;
              width: 50px;
              height: 50px;
              flex-shrink: 0;
              border-radius: 50%;
              padding: 2.5px;
              background: #10b981;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              transition: all 0.35s ease;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .author-avatar-halo {
              transform: none;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            }

            .author-avatar {
              width: 100%;
              height: 100%;
              border-radius: 50%;
              color: #ffffff;
              font-weight: 800;
              font-size: 15px;
              font-family: var(--font-heading);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #ffffff;
            }

            [data-theme="dark"] .author-avatar,
            .dark-theme .author-avatar {
              border-color: #0b1322;
            }

            .avatar-shield-badge {
              position: absolute;
              bottom: -2px;
              right: -2px;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #10b981;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
            }

            [data-theme="dark"] .avatar-shield-badge,
            .dark-theme .avatar-shield-badge {
              border-color: #0b1322;
            }

            .author-meta-block {
              display: flex;
              flex-direction: column;
              gap: 2px;
              flex-grow: 1;
              min-width: 0;
            }

            .author-name-row {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
            }

            .author-name {
              font-size: 15.5px;
              font-weight: 800;
              color: #0f172a;
              font-family: var(--font-heading);
              margin: 0;
              line-height: 1.25;
              letter-spacing: -0.2px;
            }

            [data-theme="dark"] .author-name,
            .dark-theme .author-name {
              color: #f8fafc;
            }

            .verified-buyer-pill {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 9.5px;
              font-weight: 800;
              letter-spacing: 0.6px;
              color: #059669;
              background: rgba(16, 185, 129, 0.12);
              border: 1px solid rgba(16, 185, 129, 0.3);
              padding: 2px 7px;
              border-radius: 9999px;
            }

            [data-theme="dark"] .verified-buyer-pill,
            .dark-theme .verified-buyer-pill {
              color: #34d399;
              background: rgba(16, 185, 129, 0.18);
              border-color: rgba(16, 185, 129, 0.4);
            }

            .author-role {
              font-size: 12px;
              font-weight: 600;
              color: #475569;
              margin: 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            [data-theme="dark"] .author-role,
            .dark-theme .author-role {
              color: #94a3b8;
            }

            .author-sub-line {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 11px;
              color: #64748b;
              margin-top: 1px;
            }

            .author-city {
              font-weight: 500;
            }

            .author-dot-divider {
              color: #cbd5e1;
            }

            .verified-date-chip {
              color: #94a3b8;
              font-weight: 500;
            }

            /* Quote Body */
            .card-quote-body {
              position: relative;
              z-index: 1;
              display: flex;
              flex-direction: column;
              gap: 10px;
              margin-bottom: 20px;
              flex-grow: 1;
            }

            .testimonial-headline {
              font-size: 15.5px;
              font-weight: 800;
              color: #080f1e;
              letter-spacing: -0.3px;
              line-height: 1.38;
              margin: 0;
              font-family: var(--font-heading);
              transition: color 0.3s ease;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-headline {
              color: #6d28d9;
            }

            [data-theme="dark"] .testimonial-headline,
            .dark-theme .testimonial-headline {
              color: #f8fafc;
            }

            [data-theme="dark"] .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-headline,
            .dark-theme .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-headline {
              color: #38bdf8;
            }

            .testimonial-quote {
              font-size: 13.5px;
              line-height: 1.68;
              color: #334155;
              margin: 0;
              font-weight: 400;
            }

            [data-theme="dark"] .testimonial-quote,
            .dark-theme .testimonial-quote {
              color: #cbd5e1;
            }

            /* Card Footer */
            .testimonial-card-footer {
              position: relative;
              z-index: 1;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-top: 1px solid rgba(226, 232, 240, 0.85);
              padding-top: 14px;
              gap: 10px;
              flex-wrap: wrap;
              transition: border-color 0.3s ease;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .testimonial-card-footer {
              border-top-color: rgba(124, 58, 237, 0.25);
            }

            [data-theme="dark"] .testimonial-card-footer,
            .dark-theme .testimonial-card-footer {
              border-top-color: rgba(255, 255, 255, 0.08);
            }

            .outcome-pill {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              color: #047857;
              font-size: 11px;
              font-weight: 700;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              padding: 4px 10px;
              border-radius: 9999px;
              transition: all 0.25s ease;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .outcome-pill {
              background: #ecfdf5;
              border-color: #6ee7b7;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
            }

            [data-theme="dark"] .outcome-pill,
            .dark-theme .outcome-pill {
              background: rgba(16, 185, 129, 0.12);
              border-color: rgba(16, 185, 129, 0.35);
              color: #34d399;
            }

            .outcome-pulse-dot {
              width: 6.5px;
              height: 6.5px;
              border-radius: 50%;
              background: #10b981;
              box-shadow: 0 0 8px #10b981;
              animation: pulseDot 2s infinite ease-in-out;
            }

            .footer-meta-right {
              display: inline-flex;
              align-items: center;
              gap: 8px;
            }

            .tat-pill {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              letter-spacing: 0.2px;
            }

            [data-theme="dark"] .tat-pill,
            .dark-theme .tat-pill {
              color: #94a3b8;
            }

            .audit-hash-chip {
              display: inline-flex;
              align-items: center;
              gap: 3px;
              font-size: 10px;
              font-weight: 700;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              color: #64748b;
              background: rgba(148, 163, 184, 0.14);
              border: 1px solid rgba(148, 163, 184, 0.25);
              padding: 3px 8px;
              border-radius: 6px;
              letter-spacing: 0.4px;
              transition: all 0.25s ease;
            }

            .testimonials-slider-card-wrap .testimonial-card:hover .audit-hash-chip {
              background: rgba(124, 58, 237, 0.1);
              border-color: rgba(124, 58, 237, 0.3);
              color: #7c3aed;
            }

            [data-theme="dark"] .audit-hash-chip,
            .dark-theme .audit-hash-chip {
              color: #94a3b8;
              background: rgba(255, 255, 255, 0.06);
              border-color: rgba(255, 255, 255, 0.1);
            }

            [data-theme="dark"] .testimonials-slider-card-wrap .testimonial-card:hover .audit-hash-chip,
            .dark-theme .testimonials-slider-card-wrap .testimonial-card:hover .audit-hash-chip {
              background: rgba(56, 189, 248, 0.15);
              border-color: rgba(56, 189, 248, 0.35);
              color: #38bdf8;
            }

            /* Bottom Indicators & Timer */
            .testimonials-slider-bottom-bar {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 14px;
              margin-top: 14px;
            }

            .testimonials-slider-pagination {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }

            .slider-pagination-dot {
              width: 9px;
              height: 9px;
              border-radius: 9999px;
              background: #cbd5e1;
              border: none;
              padding: 0;
              cursor: pointer;
              transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .slider-pagination-dot:hover {
              background: #94a3b8;
              transform: scale(1.2);
            }

            .slider-pagination-dot.active {
              width: 34px;
              background: #7c3aed;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }

            [data-theme="dark"] .slider-pagination-dot,
            .dark-theme .slider-pagination-dot {
              background: #334155;
            }

            [data-theme="dark"] .slider-pagination-dot.active,
            .dark-theme .slider-pagination-dot.active {
              background: #a78bfa;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            .slider-timer-bar-wrap {
              width: 160px;
              height: 3px;
              background: #e2e8f0;
              border-radius: 9999px;
              overflow: hidden;
            }

            [data-theme="dark"] .slider-timer-bar-wrap,
            .dark-theme .slider-timer-bar-wrap {
              background: rgba(255, 255, 255, 0.1);
            }

            .slider-timer-bar-fill {
              height: 100%;
              width: 0%;
              background: #10b981;
              border-radius: 9999px;
            }

            .slider-timer-bar-fill.running {
              animation: sliderTimerFill 4.5s linear infinite;
            }

            .slider-timer-bar-fill.paused {
              animation-play-state: paused;
            }

            @keyframes sliderTimerFill {
              0% { width: 0%; }
              100% { width: 100%; }
            }

            @media (prefers-reduced-motion: reduce) {
              .testimonials-slider-track,
              .slider-timer-bar-fill {
                transition: none !important;
                animation: none !important;
              }
            }
          `}</style>

          {/* Bottom Fast Action Banner */}
          <div className="testimonials-cta-banner">
            <div className="cta-banner-content">
              <div className="cta-banner-icon-disc">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div className="cta-banner-text">
                <h4 className="cta-banner-title">Ready to verify someone before opening your home?</h4>
                <p className="cta-banner-sub">Takes under 2 minutes. Authenticated via Aadhaar, Police &amp; Court registries.</p>
              </div>
            </div>
            <button
              type="button"
              className="cta-banner-btn"
              onClick={() => {
                handleOpenOCR('Instant Background Verification', '₹299', 'aadhaar');
              }}
            >
              <span>Verify Someone Now</span>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </section>

        {/* ========================================================
            LOOKING FOR MORE DETAILS? INQUIRY & ACCREDITATION SECTION
            - 2-Column luxury architecture matching Securitas theme
            - Left: Inquiry form card with modern floating underline inputs
            - Right: NSR, ISO, 99%, 24X7 Accreditations & Trust Pillars
           ======================================================== */}
        <section id="inquiry" className="inquiry-section" aria-label="Looking for more details">
          <div className="inquiry-grid-container">
            {/* Left Column: Form Card */}
            <div className="inquiry-card">
              <div className="inquiry-card-header">
                <h3 className="inquiry-main-title">
                  Looking for more <span className="purple-gradient-text">details?</span>
                </h3>
                <p className="inquiry-subtitle">Reach out to us</p>
              </div>

              {isSubmitted ? (
                <div className="inquiry-success-message">
                  <div className="success-icon-disc">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h4>Thank you, {inquiryForm.firstName}!</h4>
                  <p>Your inquiry has been received. Our compliance specialist will reach out to you within 15 minutes.</p>
                  <button
                    type="button"
                    className="inquiry-reset-btn"
                    onClick={() => {
                      setInquiryForm({ firstName: '', lastName: '', email: '', phone: '', message: '' });
                      setIsSubmitted(false);
                    }}
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form className="inquiry-form" onSubmit={handleInquirySubmit}>
                  {/* Row 1: First Name & Last Name */}
                  <div className="inquiry-form-row">
                    <div className="inquiry-field-group">
                      <label className="inquiry-field-label">
                        First Name <span className="req-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={inquiryForm.firstName}
                        onChange={handleInquiryChange}
                        placeholder="e.g. Rahul"
                        className="inquiry-input"
                        required
                      />
                    </div>

                    <div className="inquiry-field-group">
                      <label className="inquiry-field-label">
                        Last Name <span className="req-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={inquiryForm.lastName}
                        onChange={handleInquiryChange}
                        placeholder="e.g. Sharma"
                        className="inquiry-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Email & Phone Number */}
                  <div className="inquiry-form-row">
                    <div className="inquiry-field-group">
                      <label className="inquiry-field-label">
                        Email <span className="req-asterisk">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={inquiryForm.email}
                        onChange={handleInquiryChange}
                        placeholder="name@example.com"
                        className="inquiry-input"
                        required
                      />
                    </div>

                    <div className="inquiry-field-group">
                      <label className="inquiry-field-label">
                        Phone Number <span className="req-asterisk">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={inquiryForm.phone}
                        onChange={handleInquiryChange}
                        placeholder="10-digit mobile number"
                        className="inquiry-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: Message */}
                  <div className="inquiry-field-group full-width">
                    <label className="inquiry-field-label">
                      Message <span className="req-asterisk">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={inquiryForm.message}
                      onChange={handleInquiryChange}
                      placeholder="Tell us how we can help you...."
                      className="inquiry-textarea"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Submit Action */}
                  <div className="inquiry-submit-row">
                    <button type="submit" className="inquiry-submit-btn">
                      <span>Submit</span>
                    </button>
                  </div>

                  {/* Footer Login Prompt */}
                  <div className="inquiry-login-prompt">
                    <span className="login-prompt-text">If you're already registered, please</span>
                    <button
                      type="button"
                      className="inquiry-login-pill-btn"
                      onClick={() => {
                        if (onNavigateLogin) {
                          onNavigateLogin();
                        } else {
                          const el = document.querySelector('header');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      Login
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: High-Impact Trust Accreditations */}
            <div className="inquiry-accreditations-col">
              {/* Accreditation 1: NSR */}
              <div className="accreditation-item">
                <div className="accreditation-badge-top">
                  <span className="accreditation-symbol">NSR</span>
                </div>
                <div className="accreditation-role-title">Platinum Verifier</div>
                <p className="accreditation-desc">Highest tier awarded by National Skill Registry</p>
              </div>

              {/* Accreditation 2: ISO */}
              <div className="accreditation-item">
                <div className="accreditation-badge-top">
                  <span className="accreditation-symbol">ISO</span>
                </div>
                <div className="accreditation-role-title">27001 Certified</div>
                <p className="accreditation-desc">Your data is protected by global ISO 27001 security standards</p>
              </div>

              {/* Accreditation 3: 99% */}
              <div className="accreditation-item">
                <div className="accreditation-badge-top">
                  <span className="accreditation-symbol">99%</span>
                </div>
                <div className="accreditation-role-title">System Uptime</div>
                <p className="accreditation-desc">Instant verification available 24/7 with zero downtime</p>
              </div>

              {/* Accreditation 4: 24X7 */}
              <div className="accreditation-item">
                <div className="accreditation-badge-top">
                  <span className="accreditation-symbol">24X7</span>
                </div>
                <div className="accreditation-role-title">Support Available</div>
                <p className="accreditation-desc">Real people available to help you</p>
              </div>
            </div>

          </div>
        </section>

        {/* Interactive OCR Document Scanner & Extraction Pop-up Modal */}
        <OCRModal
          isOpen={ocrModalOpen}
          onClose={() => setOcrModalOpen(false)}
          serviceTitle={ocrCheckDetails.title}
          servicePrice={ocrCheckDetails.price}
          initialDocType={ocrCheckDetails.docType}
          allowedDocTypes={ocrCheckDetails.allowedDocTypes}
        />
      </div>
    );
};

export default Home;
