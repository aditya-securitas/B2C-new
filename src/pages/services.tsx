import React, { useState, useMemo, useEffect } from 'react';
import '../styles/services.css';
import OCRModal, { DocumentType } from '../component/ocr-modal';
import RazorpayGatewayModal from '../component/razorpay-gateway-modal';
import { useAuth } from '../utils/auth';
import LoginModal, { PendingCheckInfo } from '../component/login-modal';

export type CheckCategory =
  | 'identity'
  | 'address'
  | 'legal'
  | 'health'
  | 'employment'
  | 'education';

export interface CheckService {
  id: string;
  name: string;
  category: CheckCategory;
  categoryLabel: string;
  price: number;
  tat: string;
  icon: string;
  badge: string;
  source: string;
  description: string;
  features: string[];
  requiredDocType?: DocumentType;
  allowedDocTypes?: DocumentType[];
}

export const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Checks' },
  { id: 'identity', label: 'Identity & KYC' },
  { id: 'address', label: 'Address' },
  { id: 'legal', label: 'Criminal & Legal' },
  { id: 'employment', label: 'Employment' },
  { id: 'education', label: 'Education' },
  { id: 'health', label: 'Drug & Health' },
];

export const ALL_18_CHECKS: CheckService[] = [
  {
    id: 'identity-check',
    name: 'Identity Check',
    category: 'identity',
    categoryLabel: 'Identity & KYC',
    price: 299,
    tat: '⚡  2 Mins',
    icon: '🪪',
    badge: 'Triangulated KYC',
    source: 'National ID Repositories',
    description: 'Algorithmic cross-scan verifying identity credentials and eliminating synthetic fraud.',
    features: ['Triangulated KYC Query', 'Biometric & Data Congruence', 'Tamper-Proof Dossier'],
    requiredDocType: 'aadhaar',
    allowedDocTypes: ['aadhaar', 'pan', 'voter_id', 'passport'],
  },
  {
    id: 'address-proof-check',
    name: 'Address Proof Check',
    category: 'address',
    categoryLabel: 'Address',
    price: 299,
    tat: '⚡ Same Day',
    icon: '🏠',
    badge: 'Utility Match',
    source: 'State Utility & Telecom Reg.',
    description: 'Validates residential address against state electricity, municipal water & telecom records.',
    features: ['Electricity Board Match', 'Municipal Tenure Check', 'Address Integrity Score'],
    requiredDocType: 'utility_bill',
    allowedDocTypes: ['utility_bill', 'aadhaar', 'voter_id', 'driving_license'],
  },
  {
    id: 'digital-address-verification',
    name: 'Digital Address Verification',
    category: 'address',
    categoryLabel: 'Address',
    price: 299,
    tat: '⏱️  2 Hours',
    icon: '📍',
    badge: 'GPS & Geo-Tag',
    source: 'Automated GPS & Photo Proof',
    description: 'Digital selfie capture with sub-5m GPS coordinates, building facade & cellular radius.',
    features: ['Sub-5m GPS Precision', 'Live Timestamped Facade', 'Cellular Radius Check'],
    requiredDocType: 'aadhaar',
    allowedDocTypes: ['aadhaar', 'voter_id'],
  },
  {
    id: 'aadhar-check',
    name: 'Aadhar Check',
    category: 'identity',
    categoryLabel: 'Identity & KYC',
    price: 299,
    tat: '⚡  30s',
    icon: '🪪',
    badge: 'Govt. UIDAI',
    source: 'UIDAI Central Gateway',
    description: 'Direct algorithmic cross-query with UIDAI validating demographic data and biometric linkage.',
    features: ['UIDAI Real-time API', 'Demographic & Age Match', 'Synthetic Fraud Shield'],
    requiredDocType: 'aadhaar',
    allowedDocTypes: ['aadhaar'],
  },
  {
    id: 'pan-card-check',
    name: 'Pan Card Check',
    category: 'identity',
    categoryLabel: 'Identity & KYC',
    price: 299,
    tat: '⚡  30s',
    icon: '💳',
    badge: 'Income Tax',
    source: 'NSDL & Income Tax Dept.',
    description: 'Live ITD database query verifying active PAN status, legal holder name, and authenticity.',
    features: ['ITD / NSDL Live Query', 'Active Status Match', 'Legal Holder Name'],
    requiredDocType: 'pan',
    allowedDocTypes: ['pan'],
  },
  {
    id: 'driving-license-check',
    name: 'Driving License Check',
    category: 'identity',
    categoryLabel: 'Identity & KYC',
    price: 299,
    tat: '⚡  1 Min',
    icon: '🚗',
    badge: 'MoRTH Sarathi',
    source: 'Ministry of Road Transport',
    description: 'Sarathi National Register query authenticating vehicle authorizations, RTO, and validity.',
    features: ['MoRTH Sarathi Registry', 'LMV/HMV Class Auth', 'RTO Issuing Authority'],
    requiredDocType: 'driving_license',
    allowedDocTypes: ['driving_license'],
  },
  {
    id: 'voter-id-check',
    name: 'Voter ID Check',
    category: 'identity',
    categoryLabel: 'Identity & KYC',
    price: 299,
    tat: '⚡  1 Min',
    icon: '🗳️',
    badge: 'ECI Electoral',
    source: 'Election Commission of India',
    description: 'Validates EPIC number against national electoral databases, retrieving constituency & polling.',
    features: ['National Electoral Roll', 'Assembly & District Match', 'EPIC Authenticity'],
    requiredDocType: 'voter_id',
    allowedDocTypes: ['voter_id'],
  },
  {
    id: 'face-match-check',
    name: 'Face Match Check',
    category: 'identity',
    categoryLabel: 'Identity & KYC',
    price: 299,
    tat: '⚡ Instant',
    icon: '👤',
    badge: 'AI Biometrics',
    source: 'AI Facial Recognition Engine',
    description: 'Advanced neural biometric liveness detection and 3D facial feature cross-match against IDs.',
    features: ['3D Liveness Detection', 'Photo ID Cross-Match', 'Anti-Spoofing AI'],
    requiredDocType: 'aadhaar',
    allowedDocTypes: ['aadhaar', 'pan', 'driving_license', 'passport'],
  },
  {
    id: 'global-database-check',
    name: 'Global Database Check',
    category: 'legal',
    categoryLabel: 'Criminal & Legal',
    price: 299,
    tat: '⚡ Instant',
    icon: '🌐',
    badge: 'Interpol & OFAC',
    source: 'Interpol, FBI, SEBI & OFAC',
    description: 'Global law enforcement screening against Interpol Red Notices, OFAC sanctions, and PEP.',
    features: ['Interpol Red Notices', 'PEP Registry Scan', 'SEBI / CBI Blacklists'],
    requiredDocType: 'passport',
    allowedDocTypes: ['passport', 'pan'],
  },
  {
    id: 'criminal-court-record-check',
    name: 'Criminal Court Record Check',
    category: 'legal',
    categoryLabel: 'Criminal & Legal',
    price: 299,
    tat: '⚡ Same Day',
    icon: '⚖️',
    badge: '20,000+ Courts',
    source: 'e-Courts & District Registries',
    description: 'AI search across 20,000+ district, session, High Courts, and Supreme Court filings.',
    features: ['District & Sessions Scan', 'High Court Appeals', 'CNR Number Query'],
    requiredDocType: 'aadhaar',
    allowedDocTypes: ['aadhaar', 'pan', 'voter_id'],
  },
  {
    id: 'credit-history-check',
    name: 'Credit History Check',
    category: 'health',
    categoryLabel: 'Drug & Health',
    price: 299,
    tat: '⚡  2 Mins',
    icon: '📊',
    badge: 'Credit Bureau',
    source: 'Authorized National Credit Bureaus',
    description: 'Comprehensive financial credit score evaluation, liability profile, and repayment history.',
    features: ['Credit Score Rating Band', '36-Month Repayment Track', 'Active Liability Exposure'],
    requiredDocType: 'pan',
    allowedDocTypes: ['pan'],
  },
  {
    id: 'social-media-check',
    name: 'Social Media Check',
    category: 'identity',
    categoryLabel: 'Identity & KYC',
    price: 299,
    tat: '⏱️ 2-4 Hours',
    icon: '📱',
    badge: 'Digital Footprint',
    source: 'Public Web & Social Profiles',
    description: 'Automated digital footprint analysis screening public social profiles for risk signals.',
    features: ['Digital Footprint Audit', 'Public Sentiment Scan', 'Behavioral Risk Signals'],
    requiredDocType: 'aadhaar',
    allowedDocTypes: ['aadhaar', 'pan'],
  },
  {
    id: 'reference-check',
    name: 'Reference Check',
    category: 'employment',
    categoryLabel: 'Employment',
    price: 299,
    tat: '⏱️ 1-2 Days',
    icon: '🤝',
    badge: 'Supervisor Audit',
    source: 'Past Managers & Supervisors',
    description: 'Structured interviews with past reporting managers assessing integrity and workplace conduct.',
    features: ['Supervisory Interview', 'Integrity Assessment', 'Reference Audit Report'],
    requiredDocType: 'aadhaar',
    allowedDocTypes: ['aadhaar', 'pan'],
  },
  {
    id: 'academic-record-check',
    name: 'Academic Record Check',
    category: 'education',
    categoryLabel: 'Education',
    price: 299,
    tat: '⏱️ 3-5 Days',
    icon: '🎓',
    badge: 'UGC University',
    source: 'Accredited University Registrars',
    description: 'Direct registrar inquiry with accredited universities verifying roll number & credentials.',
    features: ['UGC/AICTE University Match', 'Transcript Verification', 'Degree Authenticity'],
    requiredDocType: 'academic_cert',
    allowedDocTypes: ['academic_cert'],
  },
  {
    id: 'address-proof-check-kyc',
    name: 'Address Proof Check-KYC',
    category: 'address',
    categoryLabel: 'Address',
    price: 299,
    tat: '⚡  2 Mins',
    icon: '📜',
    badge: 'Instant KYC',
    source: 'Govt. KYC Address Registry',
    description: 'Real-time algorithmic KYC address validation cross-referencing multi-document registers.',
    features: ['Real-Time KYC Registry', 'Multi-Document Address Match', 'Instant Verification PDF'],
    requiredDocType: 'utility_bill',
    allowedDocTypes: ['utility_bill', 'aadhaar', 'voter_id'],
  },
  {
    id: 'employment-check',
    name: 'Employment Check',
    category: 'employment',
    categoryLabel: 'Employment',
    price: 299,
    tat: '⏱️ 2-3 Days',
    icon: '💼',
    badge: 'EPFO & HR Audit',
    source: 'EPFO / UAN & Past HR Records',
    description: 'Validates past employment tenures, designation, monthly PF contributions, and rehire status.',
    features: ['EPFO Passbook Audit', 'HR Designation Confirmation', 'Rehire Eligibility Status'],
    requiredDocType: 'pan',
    allowedDocTypes: ['pan', 'aadhaar'],
  },
  {
    id: 'passport-check',
    name: 'Passport Check',
    category: 'identity',
    categoryLabel: 'Identity & KYC',
    price: 299,
    tat: '⚡  2 Mins',
    icon: '🛂',
    badge: 'MEA Ledger',
    source: 'Ministry of External Affairs',
    description: 'Authenticates Indian passport booklet genuineness, issuance dates, and MEA status.',
    features: ['MEA Central Database Scan', 'Booklet Validity & Expiry', 'File Number Verification'],
    requiredDocType: 'passport',
    allowedDocTypes: ['passport'],
  },
  {
    id: 'police-clearance-certificate',
    name: 'Police Clearance Certificate',
    category: 'legal',
    categoryLabel: 'Criminal & Legal',
    price: 299,
    tat: '⏱️ 2-4 Days',
    icon: '👮‍♂️',
    badge: 'PCC Clearance',
    source: 'Local Police Station Docket',
    description: 'Jurisdictional police verification docket submitted to local police station checking FIRs.',
    features: ['Local Police Station Docket', 'Pending FIRs & Summons Search', 'Official Clearance Stamp'],
    requiredDocType: 'aadhaar',
    allowedDocTypes: ['aadhaar', 'voter_id'],
  },
];

export function getRequiredDocName(check: CheckService): string {
  if (check.requiredDocType === 'pan') return 'PAN Card';
  if (check.requiredDocType === 'aadhaar') return 'Aadhaar Card';
  if (check.requiredDocType === 'driving_license') return 'Driving License';
  if (check.requiredDocType === 'voter_id') return 'Voter ID (EPIC)';
  if (check.requiredDocType === 'passport') return 'Passport';
  if (check.requiredDocType === 'academic_cert') return 'Degree Certificate';
  if (check.requiredDocType === 'utility_bill') return 'Utility / Address Bill';

  const name = check.name.toLowerCase();
  if (name.includes('pan')) return 'PAN Card';
  if (name.includes('aadhar') || name.includes('aadhaar')) return 'Aadhaar Card';
  if (name.includes('driving') || name.includes('license')) return 'Driving License';
  if (name.includes('voter')) return 'Voter ID (EPIC)';
  if (name.includes('passport')) return 'Passport';
  if (name.includes('academic') || name.includes('degree')) return 'Degree Certificate';
  if (name.includes('address')) return 'Utility Bill / Aadhaar';
  return 'Govt. Photo ID';
}

export type ServiceRole = 'all' | 'driver' | 'maid' | 'tenant';

export interface SampleReportItem {
  icon: string;
  title: string;
  status: string;
}

export interface RoleConfig {
  id: ServiceRole;
  label: string;
  seoTitle: string;
  seoDescription: string;
  badge: string;
  titlePart1: string;
  titleGradient: string;
  titlePart3: string;
  description: string;
  checkIds: string[];
  packName: string;
  packIds: string[];
  bannerHighlight: string;
  trustBullets: string[];
  sampleTitle: string;
  sampleItems: SampleReportItem[];
  stats: { number: string; label: string }[];
}

export const ROLE_CHECKS_CONFIG: Record<ServiceRole, RoleConfig> = {
  driver: {
    id: 'driver',
    label: 'Driver & Guard',
    seoTitle: 'Driver & Chauffeur Background Verification | Securitas India',
    seoDescription: 'Authenticate personal drivers, commercial chauffeurs, and security guards in under 2 minutes. Direct Sarathi DL query, 20,000+ court litigation scan, and police clearance.',
    badge: '🚗 Driver & Security Guard Verification',
    titlePart1: 'Driver & Chauffeur',
    titleGradient: 'Background Verification',
    titlePart3: 'for Safe Commutes',
    description: "Ensure complete safety for your family and assets. Verify your driver's MoRTH Sarathi driving license, court litigation history across 20,000+ courts, Aadhaar authenticity, and residential address in under 2 minutes.",
    checkIds: [
      'driving-license-check',
      'criminal-court-record-check',
      'police-clearance-certificate',
      'address-proof-check',
      'identity-check',
      'face-match-check',
    ],
    packName: '⚡ Quick Driver Pack (6 Checks)',
    packIds: [
      'driving-license-check',
      'criminal-court-record-check',
      'police-clearance-certificate',
      'address-proof-check',
      'identity-check',
      'face-match-check',
    ],
    bannerHighlight: 'MoRTH Sarathi DL & Criminal Screening',
    trustBullets: [
      '100% MoRTH Sarathi DL Gateways',
      '20,000+ e-Courts Criminal Records',
      'Sub-30s Instant Turnaround',
    ],
    sampleTitle: 'Driver Verification Report',
    sampleItems: [
      { icon: '🚗', title: 'Driving License (MoRTH Sarathi)', status: 'AUTHENTICATED ✓' },
      { icon: '⚖️', title: 'Court Litigation (20,000+ e-Courts)', status: 'CLEAR ✓' },
      { icon: '👮‍♂️', title: 'Police Clearance Certificate', status: 'VERIFIED ✓' },
      { icon: '🏠', title: 'Address Proof (Utility Match)', status: 'CONFIRMED ✓' },
      { icon: '👤', title: 'Face Match & 3D Liveness AI', status: '99.4% MATCH ✓' },
    ],
    stats: [
      { number: '6 Checks', label: 'Curated for Drivers & Chauffeurs' },
      { number: '< 30 Secs', label: 'Instant Real-Time APIs' },
      { number: '20,000+', label: 'Courts & Police Stations' },
      { number: '100% Valid', label: 'Court & Insurer Accepted' },
    ],
  },
  maid: {
    id: 'maid',
    label: 'Domestic Help & Maid',
    seoTitle: 'Domestic Help & Maid Verification | Securitas India',
    seoDescription: 'Safeguard your home with trusted domestic help, maid, and cook verification. Live UIDAI Aadhaar check, police clearance, court criminal background, and address verification.',
    badge: '🏠 Domestic Help & Maid Verification',
    titlePart1: 'Domestic Help & Maid',
    titleGradient: 'Trust & Safety Verification',
    titlePart3: 'for Your Home',
    description: 'Protect your loved ones with foolproof background checks for housemaids, cooks, nannies, and housekeeping staff. Instant Aadhaar biometric link, residential address verification, and court records screening.',
    checkIds: [
      'aadhar-check',
      'criminal-court-record-check',
      'police-clearance-certificate',
      'address-proof-check',
      'identity-check',
      'reference-check',
    ],
    packName: '⚡ Quick Domestic Help Pack (6 Checks)',
    packIds: [
      'aadhar-check',
      'criminal-court-record-check',
      'police-clearance-certificate',
      'address-proof-check',
      'identity-check',
      'reference-check',
    ],
    bannerHighlight: 'UIDAI Aadhaar, Police & Reference Audit',
    trustBullets: [
      '100% UIDAI Aadhaar Gateway',
      'Jurisdictional Police Verification',
      'Court Litigation Record Scan',
    ],
    sampleTitle: 'Domestic Staff Verification Report',
    sampleItems: [
      { icon: '🪪', title: 'Aadhaar Identity (UIDAI Gateway)', status: 'VERIFIED ✓' },
      { icon: '⚖️', title: 'Court Litigation (20,000+ e-Courts)', status: 'CLEAR ✓' },
      { icon: '👮‍♂️', title: 'Police Clearance Certificate', status: 'VERIFIED ✓' },
      { icon: '🏠', title: 'Address Proof (Utility Match)', status: 'CONFIRMED ✓' },
      { icon: '🤝', title: 'Reference Check (Prior Employers)', status: 'POSITIVE ✓' },
    ],
    stats: [
      { number: '6 Checks', label: 'Curated for Domestic Staff' },
      { number: '< 30 Secs', label: 'Instant UIDAI & Police Checks' },
      { number: '100% Safe', label: 'Verified In-Home Security' },
      { number: 'QR Dossier', label: 'Audit-Ready Digital Report' },
    ],
  },
  tenant: {
    id: 'tenant',
    label: 'Tenant Background',
    seoTitle: 'Tenant Background Verification & Rental Screening | Securitas India',
    seoDescription: 'Screen prospective tenants and roommates with legally valid background checks. Verify court litigation, credit score, PAN, Aadhaar, and permanent address verification.',
    badge: '🔑 Tenant & Rental Verification',
    titlePart1: 'Tenant Background Check',
    titleGradient: '& Rental Screening',
    titlePart3: 'for Landlords & Owners',
    description: "Prevent rental fraud and default risk. Verify prospective tenants' court litigation records, civil disputes, financial credit score, PAN authenticity, and permanent address before handing over keys.",
    checkIds: [
      'criminal-court-record-check',
      'credit-history-check',
      'pan-card-check',
      'address-proof-check',
      'identity-check',
      'employment-check',
    ],
    packName: '⚡ Quick Tenant Screening Pack (6 Checks)',
    packIds: [
      'criminal-court-record-check',
      'credit-history-check',
      'pan-card-check',
      'address-proof-check',
      'identity-check',
      'employment-check',
    ],
    bannerHighlight: 'Court Litigation, CIBIL & Employment Match',
    trustBullets: [
      'Civil & Rental Dispute Search',
      'Credit Bureau & Score Band',
      'Instant Verifiable PDF Dossier',
    ],
    sampleTitle: 'Tenant Background Report',
    sampleItems: [
      { icon: '⚖️', title: 'Court Litigation (Civil & Criminal)', status: 'CLEAR ✓' },
      { icon: '📊', title: 'Credit Bureau Score (CIBIL)', status: 'EXCELLENT (785) ✓' },
      { icon: '💳', title: 'PAN Authenticity (Income Tax Dept)', status: 'VERIFIED ✓' },
      { icon: '🏠', title: 'Permanent Address Verification', status: 'CONFIRMED ✓' },
      { icon: '💼', title: 'Employment & EPFO Records', status: 'ACTIVE TENURE ✓' },
    ],
    stats: [
      { number: '6 Checks', label: 'Curated for Tenants & Renters' },
      { number: 'CIBIL + Courts', label: 'Financial & Legal Screening' },
      { number: '0 Default', label: 'Rental Fraud Risk Shield' },
      { number: 'Instant', label: 'Landlord Verification PDF' },
    ],
  },
  all: {
    id: 'all',
    label: 'All 18 Checks',
    seoTitle: '18 Comprehensive Background Verification Checks | Securitas India',
    seoDescription: "Explore India's most comprehensive suite of 18 background verification checks. Aadhaar, PAN, DL, Voter ID, Court, Police, Address, and Employment screening.",
    badge: 'Central Verification Repository • All 18 Checks',
    titlePart1: 'Instant Background',
    titleGradient: '& Identity Verification',
    titlePart3: 'for India',
    description: 'Authenticate domestic staff, drivers, tenants, and candidates in under 2 minutes. Direct central integration with UIDAI Aadhaar, Sarathi Driving License, e-Courts, and Police registries with a legally valid digital report.',
    checkIds: ALL_18_CHECKS.map((c) => c.id),
    packName: '⚡ Quick KYC Pack (5 Checks)',
    packIds: [
      'identity-check',
      'aadhar-check',
      'pan-card-check',
      'address-proof-check',
      'criminal-court-record-check',
    ],
    bannerHighlight: '100% Govt. Repositories & e-Courts',
    trustBullets: [
      '100% Govt. & Police Gateways',
      'Sub-30s Instant Turnaround',
      'QR Verifiable PDF Dossiers',
    ],
    sampleTitle: 'Sample Verification Report',
    sampleItems: [
      { icon: '🪪', title: 'Aadhaar Identity (UIDAI Gateway)', status: 'VERIFIED ✓' },
      { icon: '💳', title: 'PAN Authenticity (Income Tax Dept)', status: 'VERIFIED ✓' },
      { icon: '🚗', title: 'Driving License (MoRTH Sarathi)', status: 'AUTHENTICATED ✓' },
      { icon: '⚖️', title: 'Court Litigation (20,000+ e-Courts)', status: 'CLEAR ✓' },
      { icon: '📍', title: 'Physical Address & GPS Match', status: 'CONFIRMED ✓' },
    ],
    stats: [
      { number: '18 Checks', label: 'Full Spectrum Verification' },
      { number: '< 30 Secs', label: 'Instant Real-Time APIs' },
      { number: '20,000+', label: 'Courts & Police Stations' },
      { number: 'ISO 27001', label: 'DPDP Act Compliant' },
    ],
  },
};

// Razorpay Standard Checkout Loader
const loadRazorpaySDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).Razorpay) resolve(true);
      }, 400);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ========================================================
   ORDER FORM VALIDATION ENGINE & CONSTANTS
======================================================== */
const ORDER_FORM_DUMMY_NAMES = new Set([
  'test', 'dummy', 'asdf', 'qwerty', 'admin', 'user', 'none', 'na', 'n/a', 'fake',
  'sample', 'unknown', 'null', 'undefined', 'xyz', 'abc', 'placeholder'
]);

export function validateOrderFormField(field: string, value: string): string {
  const trimmed = (value || '').trim();

  switch (field) {
    case 'fullName': {
      if (!trimmed) {
        return 'Full legal name is mandatory.';
      }
      if (/\d/.test(trimmed)) {
        return 'Full name cannot contain numeric digits. Only alphabetic letters are allowed.';
      }
      if (trimmed.length < 3) {
        return 'Full name must be at least 3 characters.';
      }
      if (trimmed.length > 70) {
        return 'Full name cannot exceed 70 characters.';
      }
      const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
      if (words.length < 2) {
        return 'Please enter your full name (both First Name and Last Name).';
      }
      if (!/^[a-zA-Z]+(?:[\s.'-][a-zA-Z.]+)*$/.test(trimmed)) {
        return 'Full name should only contain letters, spaces, hyphens, and dots.';
      }
      if (ORDER_FORM_DUMMY_NAMES.has(trimmed.toLowerCase())) {
        return 'Please enter a genuine legal name (test names are not allowed).';
      }
      if (/(\w)\1{3,}/.test(trimmed)) {
        return 'Full name cannot contain repetitive identical characters.';
      }
      return '';
    }

    case 'email': {
      if (!trimmed) {
        return 'Email address is mandatory for official report delivery.';
      }
      if (/\s/.test(trimmed)) {
        return 'Email address cannot contain spaces.';
      }
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address (e.g. yourname@domain.com).';
      }
      const parts = trimmed.split('@');
      if (parts.length === 2) {
        const domain = parts[1];
        if (!domain.includes('.')) {
          return 'Email domain must contain a valid domain extension (e.g. .com, .in).';
        }
        const tld = domain.split('.').pop() || '';
        if (tld.length < 2) {
          return 'Email domain extension must be at least 2 characters (e.g. .in, .com).';
        }
      }
      return '';
    }

    case 'phone': {
      if (!trimmed) {
        return 'Mobile number is mandatory for WhatsApp and verification updates.';
      }
      // Strip spaces, dashes, parentheses and +
      const digitsOnly = trimmed.replace(/[\s\-()+]/g, '');
      let coreNumber = digitsOnly;
      if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
        coreNumber = digitsOnly.slice(2);
      } else if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
        coreNumber = digitsOnly.slice(1);
      }

      if (!/^\d+$/.test(coreNumber)) {
        return 'Mobile number must contain numeric digits only.';
      }
      if (coreNumber.length !== 10) {
        return `Mobile number must be exactly 10 digits (currently ${coreNumber.length} digits).`;
      }
      if (!/^[6-9]/.test(coreNumber)) {
        return 'Valid Indian mobile numbers must start with 6, 7, 8, or 9.';
      }
      if (/^(\d)\1{9}$/.test(coreNumber)) {
        return 'Invalid mobile number: Cannot be all repetitive identical digits.';
      }
      return '';
    }

    case 'notes': {
      if (trimmed.length > 250) {
        return 'Candidate notes cannot exceed 250 characters.';
      }
      if (/[<>]/.test(trimmed)) {
        return 'Notes cannot contain HTML or script characters (< or >).';
      }
      return '';
    }

    default:
      return '';
  }
}

interface ServicesPageProps {
  onNavigateHome: () => void;
  onNavigateSelfVerify?: () => void;
  onNavigateLogin?: () => void;
  roleFilter?: ServiceRole;
  onRoleChange?: (role: ServiceRole) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  onNavigateHome,
  onNavigateSelfVerify,
  onNavigateLogin,
  roleFilter = 'all',
  onRoleChange,
}) => {
  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authentication State & Check Selection Guard
  const { isLoggedIn, user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingCheckToSelect, setPendingCheckToSelect] = useState<PendingCheckInfo | null>(null);
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  const requestLoginForCheck = (id: string, name?: string, price?: number, icon?: string) => {
    const item = ALL_18_CHECKS.find((c) => c.id === id);
    setPendingCheckToSelect({
      id,
      name: name || (item ? item.name : 'Verification Check'),
      price: price || item?.price,
      icon: icon || item?.icon || '📋',
    });
    setLoginModalOpen(true);
  };

  // Cart / Stepper Selection State: { [checkId]: quantity }
  const [selectedChecks, setSelectedChecks] = useState<{ [id: string]: number }>({});

  // Modals
  const [detailCheck, setDetailCheck] = useState<CheckService | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);

  // Razorpay Gateway State
  const [razorpayModalOpen, setRazorpayModalOpen] = useState<boolean>(false);

  // OCR Modal State
  const [ocrModalOpen, setOcrModalOpen] = useState<boolean>(false);
  const [ocrDetails, setOcrDetails] = useState<{
    title: string;
    price: string | number;
    docType: DocumentType;
    allowedDocTypes?: DocumentType[];
  }>({
    title: 'Instant Identity Check',
    price: '₹299',
    docType: 'aadhaar',
    allowedDocTypes: ['aadhaar'],
  });

  const handleOpenOCRForCheck = (
    checkOrTitle: CheckService | string,
    price?: number | string,
    docType?: DocumentType,
    allowedDocs?: DocumentType[]
  ) => {
    if (typeof checkOrTitle === 'string') {
      let allowed = allowedDocs;
      if (!allowed) {
        const lower = checkOrTitle.toLowerCase();
        if (lower.includes('pan')) allowed = ['pan'];
        else if (lower.includes('driving') || lower.includes('license') || lower.includes('driver')) allowed = ['driving_license'];
        else if (lower.includes('voter')) allowed = ['voter_id'];
        else if (lower.includes('passport')) allowed = ['passport'];
        else if (lower.includes('aadhar') || lower.includes('aadhaar')) allowed = ['aadhaar'];
        else if (lower.includes('academic') || lower.includes('degree')) allowed = ['academic_cert'];
        else if (lower.includes('utility') || lower.includes('address proof')) allowed = ['utility_bill', 'aadhaar', 'voter_id'];
        else if (docType) allowed = [docType];
      }

      setOcrDetails({
        title: checkOrTitle,
        price: price || '₹299',
        docType: docType || (allowed ? allowed[0] : 'aadhaar'),
        allowedDocTypes: allowed,
      });
    } else {
      const allowed = checkOrTitle.allowedDocTypes || (checkOrTitle.requiredDocType ? [checkOrTitle.requiredDocType] : undefined);
      const defaultDoc = checkOrTitle.requiredDocType || (allowed ? allowed[0] : 'aadhaar');

      setOcrDetails({
        title: checkOrTitle.name,
        price: `₹${checkOrTitle.price}`,
        docType: defaultDoc,
        allowedDocTypes: allowed,
      });
    }
    setOcrModalOpen(true);
  };

  // Form State for Checkout
  const [orderForm, setOrderForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [orderFormErrors, setOrderFormErrors] = useState<Record<string, string>>({});
  const [orderFormTouched, setOrderFormTouched] = useState<Record<string, boolean>>({});
  const [orderFormSubmitAttempted, setOrderFormSubmitAttempted] = useState<boolean>(false);

  // Auto-fill logged in user info if fields are empty
  useEffect(() => {
    if (showOrderModal && isLoggedIn && user) {
      setOrderForm((prev) => ({
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        notes: prev.notes || '',
      }));
    }
  }, [showOrderModal, isLoggedIn, user]);

  const handleOrderInputChange = (field: keyof typeof orderForm, value: string) => {
    let finalValue = value;
    if (field === 'fullName') {
      // Disallow entering numeric digits
      finalValue = value.replace(/[0-9]/g, '');
    } else if (field === 'phone') {
      // Allow only numbers, plus, spaces, dashes
      finalValue = value.replace(/[^0-9+\s\-()]/g, '');
    }

    setOrderForm((prev) => ({ ...prev, [field]: finalValue }));

    if (orderFormTouched[field] || orderFormSubmitAttempted) {
      const err = validateOrderFormField(field, finalValue);
      setOrderFormErrors((prev) => {
        const next = { ...prev };
        if (err) {
          next[field] = err;
        } else {
          delete next[field];
        }
        return next;
      });
    }
  };

  const handleOrderInputBlur = (field: keyof typeof orderForm) => {
    setOrderFormTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateOrderFormField(field, orderForm[field]);
    setOrderFormErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[field] = err;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    setOrderFormSubmitAttempted(false);
    setOrderFormErrors({});
  };

  // Listen for Chatbot bundle & check selections
  useEffect(() => {
    const handleAddFromChatbot = (e: Event) => {
      const customEvent = e as CustomEvent<{ checkIds: string[]; bundleTitle?: string }>;
      if (customEvent.detail && Array.isArray(customEvent.detail.checkIds)) {
        const newChecks: { [id: string]: number } = {};
        customEvent.detail.checkIds.forEach((id) => {
          newChecks[id] = 1;
        });
        setSelectedChecks((prev) => ({ ...prev, ...newChecks }));
        setActiveCategory('all');
        setSearchQuery('');

        setTimeout(() => {
          const gridEl = document.querySelector('.services-grid');
          if (gridEl) {
            gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    };

    window.addEventListener('securitas-add-checks', handleAddFromChatbot);
    return () => window.removeEventListener('securitas-add-checks', handleAddFromChatbot);
  }, []);

  const currentRoleConfig = ROLE_CHECKS_CONFIG[roleFilter || 'all'] || ROLE_CHECKS_CONFIG.all;

  // Sync document title and meta description dynamically for SEO
  useEffect(() => {
    document.title = currentRoleConfig.seoTitle;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', currentRoleConfig.seoDescription);
  }, [currentRoleConfig]);

  // Filtered Checks Calculation
  const filteredChecks = useMemo(() => {
    const allowedIds = roleFilter && roleFilter !== 'all' ? currentRoleConfig.checkIds : null;

    return ALL_18_CHECKS.filter((check) => {
      // Role match if specific role selected
      if (allowedIds && !allowedIds.includes(check.id)) {
        return false;
      }

      // Category Match
      const categoryMatch = activeCategory === 'all' || check.category === activeCategory;
      if (!categoryMatch) return false;

      // Search Query Match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      // Role & Keyword Synonyms matching for elevated UX
      const ROLE_CHECK_MAP: Record<string, string[]> = {
        'office boy': ['identity-check', 'criminal-court-record-check', 'address-proof-check', 'reference-check'],
        'officeboy': ['identity-check', 'criminal-court-record-check', 'address-proof-check', 'reference-check'],
        'peon': ['identity-check', 'criminal-court-record-check', 'address-proof-check', 'reference-check'],
        'pantry': ['identity-check', 'criminal-court-record-check', 'address-proof-check'],
        'cleaner': ['aadhar-check', 'identity-check', 'criminal-court-record-check', 'address-proof-check'],
        'cleaning': ['aadhar-check', 'identity-check', 'criminal-court-record-check', 'address-proof-check'],
        'sweeper': ['aadhar-check', 'identity-check', 'criminal-court-record-check', 'address-proof-check'],
        'gaurd': ['police-clearance-certificate', 'criminal-court-record-check', 'aadhar-check', 'identity-check'],
        'guard': ['police-clearance-certificate', 'criminal-court-record-check', 'aadhar-check', 'identity-check'],
        'watchman': ['police-clearance-certificate', 'criminal-court-record-check', 'aadhar-check', 'identity-check'],
        'security': ['police-clearance-certificate', 'criminal-court-record-check', 'aadhar-check', 'identity-check'],
        'maid': ['aadhar-check', 'identity-check', 'criminal-court-record-check', 'address-proof-check'],
        'cook': ['aadhar-check', 'identity-check', 'criminal-court-record-check', 'address-proof-check'],
        'roommate': ['aadhar-check', 'identity-check', 'criminal-court-record-check', 'digital-address-verification'],
        'flatmate': ['aadhar-check', 'identity-check', 'criminal-court-record-check', 'digital-address-verification'],
        'pg': ['aadhar-check', 'identity-check', 'criminal-court-record-check', 'digital-address-verification'],
        'tenant': ['police-clearance-certificate', 'criminal-court-record-check', 'digital-address-verification', 'address-proof-check'],
        'driver': ['driving-license-check', 'criminal-court-record-check', 'aadhar-check'],
      };

      for (const [roleKey, matchedIds] of Object.entries(ROLE_CHECK_MAP)) {
        if (q.includes(roleKey) && matchedIds.includes(check.id)) {
          return true;
        }
      }

      return (
        check.name.toLowerCase().includes(q) ||
        check.description.toLowerCase().includes(q) ||
        check.badge.toLowerCase().includes(q) ||
        check.source.toLowerCase().includes(q) ||
        check.features.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, searchQuery, roleFilter, currentRoleConfig]);

  // Calculations for Floating Checkout Bar
  const totalCount = useMemo(() => {
    return Object.values(selectedChecks).reduce((acc, count) => acc + count, 0);
  }, [selectedChecks]);

  const rawPrice = useMemo(() => {
    return Object.entries(selectedChecks).reduce((acc, [id, count]) => {
      const item = ALL_18_CHECKS.find((c) => c.id === id);
      return acc + (item ? item.price * count : 0);
    }, 0);
  }, [selectedChecks]);

  // Automatic Volume Discount: 15% off for 3-5 checks, 25% off for 6+ checks
  const discountRate = totalCount >= 6 ? 0.25 : totalCount >= 3 ? 0.15 : 0;
  const discountAmount = Math.round(rawPrice * discountRate);
  const finalPrice = rawPrice - discountAmount;

  // Stepper handlers
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

  // Quick Bundle Actions
  const handleSelectAll = () => {
    if (!isLoggedIn) {
      setPendingCheckToSelect({
        id: 'bundle-all-18',
        name: 'All 18 Verification Checks Enterprise Suite',
        icon: '📋',
      });
      setLoginModalOpen(true);
      return;
    }
    const bundle: { [id: string]: number } = {};
    ALL_18_CHECKS.forEach((c) => {
      bundle[c.id] = 1;
    });
    setSelectedChecks(bundle);
  };

  const handleSelectPack = (packIds: string[]) => {
    if (!isLoggedIn) {
      setPendingCheckToSelect({
        id: `pack-${packIds.join(',')}`,
        name: 'Recommended Verification Check Pack',
        icon: '⚡',
      });
      setLoginModalOpen(true);
      return;
    }
    const bundle: { [id: string]: number } = {};
    packIds.forEach((id) => {
      bundle[id] = 1;
    });
    setSelectedChecks(bundle);
  };

  const handleLoginModalSuccess = (checkToSelect?: PendingCheckInfo | null) => {
    setLoginModalOpen(false);
    if (checkToSelect) {
      if (checkToSelect.id === 'bundle-all-18') {
        const bundle: { [id: string]: number } = {};
        ALL_18_CHECKS.forEach((c) => {
          bundle[c.id] = 1;
        });
        setSelectedChecks(bundle);
        setAuthSuccessToast(`✓ Logged in! All 18 checks selected.`);
      } else if (checkToSelect.id.startsWith('pack-')) {
        const ids = checkToSelect.id.replace('pack-', '').split(',');
        const bundle: { [id: string]: number } = {};
        ids.forEach((id) => {
          bundle[id] = 1;
        });
        setSelectedChecks(bundle);
        setAuthSuccessToast(`✓ Logged in! Verification Pack selected.`);
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

  const handleSelectRolePack = () => {
    handleSelectPack(currentRoleConfig.packIds);
  };

  const handleSelectKYCPack = () => {
    const kycIds = [
      'identity-check',
      'aadhar-check',
      'pan-card-check',
      'address-proof-check',
      'criminal-court-record-check',
    ];
    handleSelectPack(kycIds);
  };

  const handleClearAll = () => {
    setSelectedChecks({});
  };

  // Check Link Sharing
  const [copiedCheckId, setCopiedCheckId] = useState<string | null>(null);

  const handleCopyCheckLink = (checkId: string, checkName: string) => {
    const rolePrefix = roleFilter && roleFilter !== 'all' ? `&role=${roleFilter}` : '';
    const url = `${window.location.origin}${window.location.pathname}#services?check=${checkId}${rolePrefix}`;
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
      const targetCheck = ALL_18_CHECKS.find((c) => c.id === targetId);
      if (targetCheck && activeCategory !== 'all' && targetCheck.category !== activeCategory) {
        setActiveCategory('all');
      }
      setTimeout(() => {
        const el = document.getElementById(`check-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('service-card-highlighted');
          setTimeout(() => el.classList.remove('service-card-highlighted'), 3500);
        }
      }, 400);
    }
  }, [activeCategory]);

  const handlePaymentSuccess = (details: { paymentId: string; method: string }) => {
    setRazorpayModalOpen(false);
    setShowOrderModal(false);

    const selectedIds = Object.keys(selectedChecks);
    const selectedItems = ALL_18_CHECKS.filter((c) => selectedIds.includes(c.id));

    // Aggregate allowed document types across all selected checks
    const allAllowedDocs: DocumentType[] = [];
    selectedItems.forEach((c) => {
      if (c.allowedDocTypes && c.allowedDocTypes.length > 0) {
        c.allowedDocTypes.forEach((doc) => {
          if (!allAllowedDocs.includes(doc)) allAllowedDocs.push(doc);
        });
      } else if (c.requiredDocType && !allAllowedDocs.includes(c.requiredDocType)) {
        allAllowedDocs.push(c.requiredDocType);
      }
    });

    const docType: DocumentType = allAllowedDocs[0] || 'aadhaar';
    const title =
      selectedItems.length === 1
        ? selectedItems[0].name
        : `${selectedItems.length} Checks Selected (${selectedItems.map((c) => c.name).join(', ')})`;
    const price = `₹${finalPrice.toLocaleString('en-IN')}`;

    // Payment is complete -> launch OCR modal pop-up with document presets
    setOcrDetails({
      title,
      price,
      docType,
      allowedDocTypes: allAllowedDocs.length > 0 ? allAllowedDocs : undefined,
    });
    setOcrModalOpen(true);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFormSubmitAttempted(true);

    const touchedAll: Record<string, boolean> = {
      fullName: true,
      email: true,
      phone: true,
      notes: true,
    };
    setOrderFormTouched(touchedAll);

    const errors: Record<string, string> = {};
    const nameErr = validateOrderFormField('fullName', orderForm.fullName);
    if (nameErr) errors.fullName = nameErr;

    const emailErr = validateOrderFormField('email', orderForm.email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validateOrderFormField('phone', orderForm.phone);
    if (phoneErr) errors.phone = phoneErr;

    const notesErr = validateOrderFormField('notes', orderForm.notes);
    if (notesErr) errors.notes = notesErr;

    setOrderFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstInvalidKey = Object.keys(errors)[0];
      const el = document.getElementById(`order-input-${firstInvalidKey}`);
      if (el) {
        el.focus();
      }
      return;
    }

    // All validations passed! Open authentic Razorpay Gateway Modal
    setRazorpayModalOpen(true);
  };

  return (
    <div className="services-page-wrapper">
      {/* ========================================================
          BEAUTIFUL LUXURY HERO BANNER SECTION (Split Grid)
         ======================================================== */}
      <section className="services-hero-section">
        <div className="services-hero-container">
          <div className="services-hero-split-grid">
            {/* Left Column: Heading, Subtitle, CTA Actions & Trust Highlights */}
            <div className="services-hero-left">
              <div className="services-badge-pill">
                <span className="services-badge-live-pulse" />
                <span>{currentRoleConfig.badge}</span>
              </div>
              
              <h1 className="services-main-title">
                {currentRoleConfig.titlePart1} <br />
                <span className="services-title-gradient">{currentRoleConfig.titleGradient}</span> <br />
                {currentRoleConfig.titlePart3}
              </h1>

              <p className="services-hero-desc">
                {currentRoleConfig.description}
              </p>

              {/* Action Buttons */}
              <div className="services-hero-actions-row">
                <a
                  href="#checks-catalogue"
                  className="services-hero-cta-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector('.services-controls-wrapper');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>
                    Explore {roleFilter && roleFilter !== 'all' ? currentRoleConfig.label : 'All 18'} Checks ({filteredChecks.length})
                  </span>
                  <span>↓</span>
                </a>

                <button
                  type="button"
                  className="services-hero-secondary-btn"
                  onClick={() => {
                    handleSelectRolePack();
                    const el = document.querySelector('.services-controls-wrapper');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>{currentRoleConfig.packName}</span>
                </button>
              </div>

              {/* Micro Trust Bullets */}
              <div className="services-hero-trust-bullets">
                {currentRoleConfig.trustBullets.map((bullet, idx) => (
                  <div key={idx} className="trust-bullet-item">
                    <span style={{ color: '#10b981' }}>✓</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Clean Sample Verification Report Card */}
            <div className="services-hero-visual-stage">
              {/* Floating Trust Badge: Top-Left */}
              <div className="orbit-badge-pill orbit-badge-top-left">
                <span>⭐</span>
                <span>99.9% Data Accuracy Rate</span>
              </div>

              {/* Floating Trust Badge: Bottom-Right */}
              <div className="orbit-badge-pill orbit-badge-bottom-right">
                <span>⚡</span>
                <span>Instant Verifiable PDF</span>
              </div>

              {/* Central Sample Report Preview Card */}
              <div className="services-holo-pass-card">
                {/* Top Branding Bar */}
                <div className="holo-card-top-bar">
                  <div className="holo-brand-cluster">
                    <div className="holo-brand-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="holo-brand-title">{currentRoleConfig.sampleTitle}</span>
                  </div>
                  <span className="holo-chip-seal">
                    <span>🛡️</span>
                    <span>ACTIVE REPORT</span>
                  </span>
                </div>

                {/* Holder Identity Row */}
                <div className="holo-holder-row">
                  <div className="holo-holder-avatar">✓</div>
                  <div className="holo-holder-meta">
                    <span className="holo-holder-name">Govt-Authenticated Dossier</span>
                    <span className="holo-holder-status">● Real-Time API Match</span>
                  </div>
                </div>

                {/* Live Simulation Check Items */}
                <div className="holo-checks-checklist">
                  {currentRoleConfig.sampleItems.map((item, idx) => (
                    <div key={idx} className="holo-check-row">
                      <span className="holo-check-title">
                        <span>{item.icon}</span>
                        <span>{item.title}</span>
                      </span>
                      <span className="holo-status-pill">{item.status}</span>
                    </div>
                  ))}
                </div>

                {/* Pass Footer */}
                <div className="holo-card-footer">
                  <div className="holo-qr-wrap">
                    <span>📱</span>
                    <span>Scan QR for Live Digital Report</span>
                  </div>
                  <div className="holo-encryption-badge">
                    <span>🔒</span>
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Bottom 4-Column Stats Row */}
          <div className="services-stats-row">
            {currentRoleConfig.stats.map((stat, idx) => (
              <div key={idx} className="services-stat-item">
                <div className="services-stat-icon-wrap">
                  {idx === 0 ? '📋' : idx === 1 ? '⚡' : idx === 2 ? '🏛️' : '🛡️'}
                </div>
                <div className="services-stat-text-box">
                  <span className="services-stat-number">{stat.number}</span>
                  <span className="services-stat-label">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          CONTROLS BAR: SEARCH, BUNDLE ACTIONS & CATEGORY FILTER
         ======================================================== */}
      <section className="services-controls-wrapper">
        <div className="services-controls-card">
          {/* Quick Role Switcher Pills Bar */}
          <div className="services-role-switch-pills" role="navigation" aria-label="Role Switcher">
            <button
              type="button"
              className={`role-switch-pill ${!roleFilter || roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                if (onRoleChange) onRoleChange('all');
                setActiveCategory('all');
              }}
            >
              <span>📋</span>
              <span>All 18 Checks</span>
            </button>
            <button
              type="button"
              className={`role-switch-pill ${roleFilter === 'driver' ? 'active' : ''}`}
              onClick={() => {
                if (onRoleChange) onRoleChange('driver');
                setActiveCategory('all');
              }}
            >
              <span>🚗</span>
              <span>Driver &amp; Security Guard</span>
            </button>
            <button
              type="button"
              className={`role-switch-pill ${roleFilter === 'maid' ? 'active' : ''}`}
              onClick={() => {
                if (onRoleChange) onRoleChange('maid');
                setActiveCategory('all');
              }}
            >
              <span>🏠</span>
              <span>Domestic Help &amp; Maid</span>
            </button>
            <button
              type="button"
              className={`role-switch-pill ${roleFilter === 'tenant' ? 'active' : ''}`}
              onClick={() => {
                if (onRoleChange) onRoleChange('tenant');
                setActiveCategory('all');
              }}
            >
              <span>🔑</span>
              <span>Tenant Background</span>
            </button>
          </div>

          {/* Role Filter Active Indicator Banner with 1-Click Reset */}
          {roleFilter && roleFilter !== 'all' && (
            <div className="services-role-filter-indicator">
              <div className="role-indicator-left">
                <span className="role-indicator-icon">
                  {roleFilter === 'driver' ? '🚗' : roleFilter === 'maid' ? '🏠' : '🔑'}
                </span>
                <div className="role-indicator-text">
                  <span className="role-indicator-title">
                    Showing <strong>{currentRoleConfig.label}</strong> Curated Checks ({filteredChecks.length} Checks)
                  </span>
                  <span className="role-indicator-sub">
                    Specifically optimized for {currentRoleConfig.bannerHighlight}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="role-indicator-reset-btn"
                onClick={() => {
                  if (onRoleChange) onRoleChange('all');
                  setActiveCategory('all');
                }}
              >
                <span>View All 18 Checks</span>
                <span>→</span>
              </button>
            </div>
          )}

          {/* Top Row: Search Input & Quick Actions */}
          <div className="controls-top-row">
            <div className="services-search-box">
              <span className="search-input-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${roleFilter && roleFilter !== 'all' ? currentRoleConfig.label : 'checks'} (e.g. Aadhaar, PAN, DL, Police, Court)...`}
                className="services-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="controls-quick-actions">
              {roleFilter && roleFilter !== 'all' ? (
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={handleSelectRolePack}
                >
                  {currentRoleConfig.packName}
                </button>
              ) : (
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={handleSelectKYCPack}
                >
                  ⚡ Top 5 KYC Pack
                </button>
              )}

              <button
                type="button"
                className="quick-action-btn"
                onClick={handleSelectAll}
              >
                📦 Select All ({ALL_18_CHECKS.length})
              </button>

              {totalCount > 0 && (
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={handleClearAll}
                >
                  ✕ Clear ({totalCount})
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Category Filter Tabs */}
          <div className="services-category-tabs" role="tablist">
            {CATEGORY_TABS.map((tab) => {
              const basePool =
                roleFilter && roleFilter !== 'all'
                  ? ALL_18_CHECKS.filter((c) => currentRoleConfig.checkIds.includes(c.id))
                  : ALL_18_CHECKS;
              const count =
                tab.id === 'all'
                  ? basePool.length
                  : basePool.filter((c) => c.category === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`cat-tab-btn ${activeCategory === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className="cat-tab-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          18 CHECKS GRID DISPLAY
         ======================================================== */}
      <section className="services-grid-container">
        {filteredChecks.length === 0 ? (
          <div className="services-empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3 className="empty-state-title">No checks matching &ldquo;{searchQuery}&rdquo;</h3>
            <p className="empty-state-desc">
              Try adjusting your search terms or select &ldquo;All Checks&rdquo; to browse all 18 verification services.
            </p>
            <button
              type="button"
              className="quick-action-btn active"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                if (onRoleChange) onRoleChange('all');
              }}
            >
              View All 18 Checks
            </button>
          </div>
        ) : (
          <div className="services-checks-grid">
            {filteredChecks.map((check) => {
              const qty = selectedChecks[check.id] || 0;
              const isSelected = qty > 0;

              return (
                <div
                  key={check.id}
                  id={`check-${check.id}`}
                  className={`service-check-card ${isSelected ? 'is-selected' : ''}`}
                >
                  {/* Subtle Glowing Accent Hairline on Hover */}
                  <div className="card-top-glow-bar" aria-hidden="true" />

                  <div className="card-top-section">
                    {/* Header: Icon, Tags, Share Button & Price */}
                    <div className="card-header-row">
                      <div className="card-icon-badge-box">
                        <div className="card-icon-disc">{check.icon}</div>
                        <div className="card-meta-tags">
                          <span className="card-category-tag">{check.categoryLabel}</span>
                          <span className="card-tat-badge">{check.tat}</span>
                        </div>
                      </div>

                      <div className="card-header-right-actions">
                        <button
                          type="button"
                          className={`card-copy-link-btn ${copiedCheckId === check.id ? 'copied' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCheckLink(check.id, check.name);
                          }}
                          title={`Copy direct link for ${check.name} to share`}
                          aria-label={`Copy link for ${check.name}`}
                        >
                          {copiedCheckId === check.id ? (
                            <>
                              <span className="copy-icon">✓</span>
                              <span className="copy-text">Copied</span>
                            </>
                          ) : (
                            <>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ display: 'inline-block', verticalAlign: 'middle' }}
                              >
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                              <span className="copy-text">Share</span>
                            </>
                          )}
                        </button>

                        <div className="card-price-pill">
                          <span className="card-price-value">₹{check.price}</span>
                          <span className="card-price-unit">/ check</span>
                        </div>
                      </div>
                    </div>

                    {/* Title & Source */}
                    <div className="card-body-content">
                      <h3 className="card-check-name">{check.name}</h3>
                      <div className="card-check-source">
                        <span>🏛️</span>
                        <span>{check.source}</span>
                      </div>
                      <p className="card-check-desc">{check.description}</p>

                      {/* Required Document Mention Badge */}
                      <div
                        className="card-req-doc-chip"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenOCRForCheck(check);
                        }}
                        title={`Click to upload ${getRequiredDocName(check)} for ${check.name}`}
                      >
                        <span className="card-req-icon">📄</span>
                        <span className="card-req-text">
                          Required Document: <strong>{getRequiredDocName(check)}</strong>
                        </span>
                      </div>

                      {/* Compact Feature Highlights */}
                      <div className="card-feature-chips">
                        {check.features.slice(0, 2).map((feat, idx) => (
                          <span key={idx} className="card-feature-chip">
                            <span className="card-chip-bullet">✓</span>
                            <span>{feat}</span>
                          </span>
                        ))}
                        {check.features.length > 2 && (
                          <button
                            type="button"
                            className="card-feature-more-btn"
                            onClick={() => setDetailCheck(check)}
                            title="View all features and report preview"
                          >
                            +{check.features.length - 2} more
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="card-action-footer">
                    <button
                      type="button"
                      className="card-details-trigger"
                      onClick={() => setDetailCheck(check)}
                    >
                      <span>Details &amp; Sample</span>
                      <span className="details-arrow">→</span>
                    </button>

                    {isSelected ? (
                      <div className="card-stepper-control">
                        <button
                          type="button"
                          className="stepper-btn minus"
                          onClick={() => handleDecrement(check.id)}
                          aria-label={`Decrease ${check.name}`}
                        >
                          −
                        </button>
                        <span className="stepper-count">{qty}</span>
                        <button
                          type="button"
                          className="stepper-btn plus"
                          onClick={() => handleIncrement(check.id)}
                          aria-label={`Increase ${check.name}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="card-select-btn"
                        onClick={() => handleToggleAdd(check.id)}
                      >
                        <span className="btn-plus-symbol">+</span>
                        <span>Add Check</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================
          FLOATING STICKY ORDER DRAWER BAR (When items selected)
         ======================================================== */}
      {totalCount > 0 && (
        <div className="services-floating-checkout-bar">
          <div className="floating-checkout-left">
            <span className="checkout-badge-pill">{totalCount} {totalCount === 1 ? 'Check' : 'Checks'} Selected</span>
            <div className="checkout-pricing-summary">
              <span className="checkout-total-price">
                ₹{finalPrice.toLocaleString('en-IN')}{' '}
                {discountAmount > 0 && (
                  <span style={{ fontSize: '13px', textDecoration: 'line-through', opacity: 0.6, fontWeight: 500 }}>
                    ₹{rawPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </span>
              <span className="checkout-subtext">
                {discountAmount > 0 ? `Saved ₹${discountAmount} (${discountRate * 100}% bundle discount)` : 'Instant GST Invoice Included'}
              </span>
            </div>
          </div>

          <div className="floating-checkout-right">
            <button
              type="button"
              className="checkout-reset-link"
              onClick={handleClearAll}
            >
              Clear
            </button>
            <button
              type="button"
              className="checkout-proceed-btn"
              onClick={() => setShowOrderModal(true)}
            >
              <span>Proceed to Verify ({totalCount})</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CHECK DETAIL MODAL
         ======================================================== */}
      {detailCheck && (
        <div className="services-modal-overlay" onClick={() => setDetailCheck(null)}>
          <div className="services-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-x"
              onClick={() => setDetailCheck(null)}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div className="card-icon-disc" style={{ width: '56px', height: '56px', fontSize: '28px' }}>
                {detailCheck.icon}
              </div>
              <div>
                <span className="card-category-tag">{detailCheck.categoryLabel}</span>
                <h3 className="modal-form-title" style={{ margin: '2px 0 0' }}>{detailCheck.name}</h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <span className="card-tat-badge">TAT: {detailCheck.tat}</span>
              <span className="card-check-source">Database: {detailCheck.source}</span>
              <span className="card-check-source">Price: ₹{detailCheck.price}</span>
            </div>

            <p className="card-check-desc" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
              {detailCheck.description}
            </p>

            {/* Document Mentioned in Check Banner */}
            <div className="modal-required-doc-alert">
              <span className="modal-req-icon">📌</span>
              <div className="modal-req-text-wrap">
                <span className="modal-req-title">Document Mentioned in Check:</span>
                <span className="modal-req-val">
                  <strong>{getRequiredDocName(detailCheck)}</strong> (Only this document will be uploaded &amp; auto-extracted)
                </span>
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              What Is Authenticated &amp; Verified:
            </h4>

            <div className="card-features-list" style={{ gap: '10px', marginBottom: '24px' }}>
              {detailCheck.features.map((f, i) => (
                <div key={i} className="card-feature-item" style={{ fontSize: '13.5px' }}>
                  <span className="card-check-bullet" style={{ fontSize: '14px' }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
              <div className="card-feature-item" style={{ fontSize: '13.5px' }}>
                <span className="card-check-bullet" style={{ fontSize: '14px' }}>✓</span>
                <span>Tamper-proof verifiable PDF report with digital signature &amp; QR code</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="modal-submit-action-btn"
                style={{ flex: 1, minWidth: '160px' }}
                onClick={() => {
                  handleToggleAdd(detailCheck.id);
                  setDetailCheck(null);
                }}
              >
                {selectedChecks[detailCheck.id] ? 'Update Quantity in Order' : '+ Add to Order (₹' + detailCheck.price + ')'}
              </button>

              <button
                type="button"
                className="modal-submit-action-btn"
                style={{
                  flex: 1,
                  minWidth: '180px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-button-emerald, 0 4px 14px rgba(16, 185, 129, 0.4))',
                }}
                onClick={() => {
                  const check = detailCheck;
                  setDetailCheck(null);
                  handleOpenOCRForCheck(check);
                }}
              >
                ⚡ Instant OCR Verify Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CHECKOUT & ORDER SUBMISSION MODAL
         ======================================================== */}
      {showOrderModal && (
        <div
          className="services-modal-overlay"
          onClick={handleCloseOrderModal}
        >
          <div className="services-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-x"
              onClick={handleCloseOrderModal}
            >
              ✕
            </button>

            {orderSubmitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
                <h3 className="modal-form-title">Verification Request Initiated!</h3>
                <p className="modal-form-subtext" style={{ maxWidth: '420px', margin: '0 auto 24px' }}>
                  Thank you, <strong>{orderForm.fullName || 'Valued Client'}</strong>! Your order for {totalCount} verification checks (Total: ₹{finalPrice.toLocaleString('en-IN')}) has been registered.
                </p>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                  Our automated verification pipeline has started processing your request. An official verification tracking link has been sent to <strong>{orderForm.email || 'your email'}</strong>.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="modal-submit-action-btn"
                    style={{ maxWidth: '240px' }}
                    onClick={() => {
                      handleCloseOrderModal();
                      setOrderSubmitted(false);
                      setSelectedChecks({});
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} noValidate>
                <h3 className="modal-form-title">Complete Verification Order</h3>
                <p className="modal-form-subtext">
                  Review your selected checks and enter contact details to start verification.
                </p>

                {/* Selected Checks Summary */}
                <div className="modal-checks-summary-card">
                  {Object.entries(selectedChecks).map(([id, count]) => {
                    const item = ALL_18_CHECKS.find((c) => c.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="modal-check-summary-row">
                        <span>
                          {item.icon} {item.name} {count > 1 ? `(×${count})` : ''}
                        </span>
                        <strong>₹{(item.price * count).toLocaleString('en-IN')}</strong>
                      </div>
                    );
                  })}

                  {discountAmount > 0 && (
                    <div className="modal-check-summary-row" style={{ color: '#10b981' }}>
                      <span>Bundle Discount ({discountRate * 100}%)</span>
                      <strong>-₹{discountAmount.toLocaleString('en-IN')}</strong>
                    </div>
                  )}

                  <div className="modal-total-banner">
                    <span>Total Payable</span>
                    <span style={{ color: '#7c3aed' }}>₹{finalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Form Top Error Alert Banner */}
                {orderFormSubmitAttempted && Object.keys(orderFormErrors).length > 0 && (
                  <div className="modal-form-alert-error" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Please correct the highlighted errors below before proceeding to payment.</span>
                  </div>
                )}

                {/* Form Field 1: Your Full Name */}
                <div className="modal-input-group">
                  <div className="modal-input-label-row">
                    <label htmlFor="order-input-fullName" className="modal-input-label">Your Full Name *</label>
                    {Boolean(orderForm.fullName && !orderFormErrors.fullName && orderFormTouched.fullName) && (
                      <span className="modal-valid-badge">Valid ✓</span>
                    )}
                  </div>
                  <input
                    id="order-input-fullName"
                    type="text"
                    placeholder="Enter full legal name (e.g. Rahul Sharma)"
                    value={orderForm.fullName}
                    onChange={(e) => handleOrderInputChange('fullName', e.target.value)}
                    onKeyDown={(e) => {
                      // Disallow numeric digits
                      if (/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => handleOrderInputBlur('fullName')}
                    className={`modal-text-input ${
                      orderFormErrors.fullName && orderFormTouched.fullName
                        ? 'modal-input-error'
                        : orderForm.fullName && !orderFormErrors.fullName && orderFormTouched.fullName
                        ? 'modal-input-valid'
                        : ''
                    }`}
                    aria-invalid={Boolean(orderFormErrors.fullName && orderFormTouched.fullName)}
                  />
                  {orderFormErrors.fullName && orderFormTouched.fullName ? (
                    <div className="modal-field-error-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{orderFormErrors.fullName}</span>
                    </div>
                  ) : (
                    <span className="modal-field-hint">Alphabetic letters only (First Name &amp; Last Name / Surname)</span>
                  )}
                </div>

                {/* Form Field 2: Email Address */}
                <div className="modal-input-group">
                  <div className="modal-input-label-row">
                    <label htmlFor="order-input-email" className="modal-input-label">Email Address *</label>
                    {Boolean(orderForm.email && !orderFormErrors.email && orderFormTouched.email) && (
                      <span className="modal-valid-badge">Valid ✓</span>
                    )}
                  </div>
                  <input
                    id="order-input-email"
                    type="email"
                    placeholder="Enter email for report delivery (e.g. rahul@example.com)"
                    value={orderForm.email}
                    onChange={(e) => handleOrderInputChange('email', e.target.value)}
                    onBlur={() => handleOrderInputBlur('email')}
                    className={`modal-text-input ${
                      orderFormErrors.email && orderFormTouched.email
                        ? 'modal-input-error'
                        : orderForm.email && !orderFormErrors.email && orderFormTouched.email
                        ? 'modal-input-valid'
                        : ''
                    }`}
                    aria-invalid={Boolean(orderFormErrors.email && orderFormTouched.email)}
                  />
                  {orderFormErrors.email && orderFormTouched.email ? (
                    <div className="modal-field-error-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{orderFormErrors.email}</span>
                    </div>
                  ) : (
                    <span className="modal-field-hint">Official tamper-proof PDF verification report will be sent here</span>
                  )}
                </div>

                {/* Form Field 3: Mobile Number */}
                <div className="modal-input-group">
                  <div className="modal-input-label-row">
                    <label htmlFor="order-input-phone" className="modal-input-label">Mobile Number (with WhatsApp updates) *</label>
                    {Boolean(orderForm.phone && !orderFormErrors.phone && orderFormTouched.phone) && (
                      <span className="modal-valid-badge">Valid ✓</span>
                    )}
                  </div>
                  <input
                    id="order-input-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={orderForm.phone}
                    onChange={(e) => handleOrderInputChange('phone', e.target.value)}
                    onKeyDown={(e) => {
                      if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key)) return;
                      if (e.ctrlKey || e.metaKey) return;
                      if (!/^[0-9+\s\-()]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => handleOrderInputBlur('phone')}
                    className={`modal-text-input ${
                      orderFormErrors.phone && orderFormTouched.phone
                        ? 'modal-input-error'
                        : orderForm.phone && !orderFormErrors.phone && orderFormTouched.phone
                        ? 'modal-input-valid'
                        : ''
                    }`}
                    aria-invalid={Boolean(orderFormErrors.phone && orderFormTouched.phone)}
                  />
                  {orderFormErrors.phone && orderFormTouched.phone ? (
                    <div className="modal-field-error-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{orderFormErrors.phone}</span>
                    </div>
                  ) : (
                    <span className="modal-field-hint">10-digit Indian mobile number for instant verification status &amp; WhatsApp alerts</span>
                  )}
                </div>

                {/* Form Field 4: Candidate Name / Notes */}
                <div className="modal-input-group">
                  <div className="modal-input-label-row">
                    <label htmlFor="order-input-notes" className="modal-input-label">Candidate Name / Notes (Optional)</label>
                    {Boolean(orderForm.notes && !orderFormErrors.notes && orderFormTouched.notes) && (
                      <span className="modal-valid-badge">Valid ✓</span>
                    )}
                  </div>
                  <input
                    id="order-input-notes"
                    type="text"
                    placeholder="Name of person or candidate being verified (optional)"
                    value={orderForm.notes}
                    onChange={(e) => handleOrderInputChange('notes', e.target.value)}
                    onBlur={() => handleOrderInputBlur('notes')}
                    className={`modal-text-input ${
                      orderFormErrors.notes && orderFormTouched.notes
                        ? 'modal-input-error'
                        : orderForm.notes && !orderFormErrors.notes && orderFormTouched.notes
                        ? 'modal-input-valid'
                        : ''
                    }`}
                    aria-invalid={Boolean(orderFormErrors.notes && orderFormTouched.notes)}
                    maxLength={250}
                  />
                  {orderFormErrors.notes && orderFormTouched.notes ? (
                    <div className="modal-field-error-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{orderFormErrors.notes}</span>
                    </div>
                  ) : (
                    <span className="modal-field-hint">Optional: Enter candidate's name or special instructions (max 250 characters)</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="modal-submit-action-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  <span>💳 Pay with Razorpay &amp; Verify (₹{finalPrice.toLocaleString('en-IN')})</span>
                </button>

                <div className="modal-payment-trust-badge">
                  <span>🔒 256-bit SSL Secure</span>
                  <span>•</span>
                  <span>Powered by Razorpay Gateway (UPI, Cards, NetBanking)</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Authentic Interactive Razorpay Payment Gateway Modal */}
      <RazorpayGatewayModal
        isOpen={razorpayModalOpen}
        onClose={() => setRazorpayModalOpen(false)}
        amount={finalPrice}
        customerName={orderForm.fullName || 'Valued Client'}
        customerEmail={orderForm.email || 'client@example.com'}
        customerPhone={orderForm.phone || '+91 98765 43210'}
        checksCount={totalCount}
        checksSummary={
          Object.keys(selectedChecks).length === 1
            ? ALL_18_CHECKS.find((c) => selectedChecks[c.id])?.name
            : `${totalCount} Checks Package`
        }
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Interactive OCR Document Scanner & Extraction Pop-up Modal */}
      <OCRModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        serviceTitle={ocrDetails.title}
        servicePrice={ocrDetails.price}
        initialDocType={ocrDetails.docType}
        allowedDocTypes={ocrDetails.allowedDocTypes}
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

export default ServicesPage;

