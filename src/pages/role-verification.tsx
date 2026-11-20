import React, { useState, useEffect } from 'react';
import '../styles/self-verification.css';
import '../styles/services.css';
import { CATEGORIES } from './home';
import OCRModal, { DocumentType } from '../component/ocr-modal';
import RazorpayGatewayModal from '../component/razorpay-gateway-modal';
import { useAuth } from '../utils/auth';
import LoginModal, { PendingCheckInfo } from '../component/login-modal';

export type RoleType = 'driver' | 'maid' | 'tenant';

export interface CheckItem {
  id: string;
  name: string;
  type: 'instant' | 'recommended';
  price: number;
  tat: string;
  icon: string;
  description: string;
  tags: string[];
  docTypes: DocumentType[];
}

export interface BenefitItem {
  title: string;
  desc: string;
}

export interface StepItem {
  num: string;
  icon: string;
  title: string;
  desc: string;
}

export interface HoloCheckItem {
  icon: string;
  title: string;
  status: string;
}

export interface RoleConfigData {
  role: RoleType;
  seoTitle: string;
  seoDesc: string;
  breadcrumbLabel: string;
  eyebrowBadge: string;
  heroTitle: string;
  heroEmeraldText: string;
  heroSubtitle: string;
  trustPills: { icon: string; text: string }[];
  primaryBtnText: string;
  bundleBtnText: string;
  bundleDiscountPercent: number;
  imageAlt: string;
  floatingBadgeTitle: string;
  floatingBadgeDesc: string;
  holoAvatar: string;
  holoName: string;
  holoId: string;
  holoChecks: HoloCheckItem[];
  holoFooterTitle: string;
  whyPillTag: string;
  whyTitlePart1: string;
  whyTitleEmerald: string;
  whyDesc: string;
  benefits: BenefitItem[];
  howPillTag: string;
  howTitle: string;
  howSubtitle: string;
  steps: StepItem[];
  instantChecksTitle: string;
  instantChecksSubtitle: string;
  recommendedChecksTitle: string;
  recommendedChecksSubtitle: string;
  instantChecks: CheckItem[];
  recommendedChecks: CheckItem[];
  modalOrderSummarySub: string;
  modalInitiatedMsg: string;
}

export const ROLE_CONFIGS: Record<RoleType, RoleConfigData> = {
  driver: {
    role: 'driver',
    seoTitle: 'Driver & Chauffeur Background Verification | Securitas India',
    seoDesc: 'Authenticate personal drivers, commercial chauffeurs, and security guards in under 2 minutes. Direct Sarathi DL query, 20,000+ court litigation scan, and police clearance.',
    breadcrumbLabel: 'Driver & Guard Verification',
    eyebrowBadge: '🚗 Official MoRTH Sarathi & Police Gateway • Driver & Guard Screening',
    heroTitle: 'Verify Your Driver & Guard.',
    heroEmeraldText: 'In Minutes, Not Days.',
    heroSubtitle: 'Authenticate driving license validity, LMV/HMV class authorizations, court litigation history across 20,000+ courts, and police clearance to safeguard your family, fleet, and assets.',
    trustPills: [
      { icon: '⚡', text: '< 30s MoRTH Sarathi' },
      { icon: '⚖️', text: '20,000+ e-Courts Scan' },
      { icon: '👮', text: 'Official Police Docket' },
      { icon: '🛡️', text: '100% Insurer Accepted' },
    ],
    primaryBtnText: 'Select Driver Checks Below',
    bundleBtnText: '⚡ Bundle All Driver Checks (Save 25%)',
    bundleDiscountPercent: 25,
    imageAlt: 'Verified Driver and Security Guard portrait in official uniform',
    floatingBadgeTitle: 'MoRTH Sarathi Verified',
    floatingBadgeDesc: 'Real-time RTO & License Authenticity',
    holoAvatar: 'DV',
    holoName: 'Driver & Guard Dossier',
    holoId: 'DRV-ID: #739102-IN',
    holoChecks: [
      { icon: '🚗', title: 'MoRTH Sarathi DL Validity & Class', status: '✓ Authenticated' },
      { icon: '⚖️', title: 'Court Criminal & Traffic Litigations', status: '✓ Zero Record' },
      { icon: '👮', title: 'Jurisdictional Police Clearance (PCC)', status: '✓ Verified' },
      { icon: '📍', title: 'Permanent Address & GPS Proof', status: '✓ Confirmed' },
    ],
    holoFooterTitle: 'Tamper-Proof Driver Dossier',
    whyPillTag: 'FLEET & FAMILY SAFETY SHIELD',
    whyTitlePart1: 'Why Driver Verification',
    whyTitleEmerald: 'Matters?',
    whyDesc: "Handing over vehicle keys and your family's daily commute requires complete trust. Here is why verifying drivers and security guards protects what matters most:",
    benefits: [
      {
        title: 'Eliminate Fake & Expired Licenses',
        desc: 'Screen DL status directly on MoRTH Sarathi registry to verify LMV/HMV class authorizations, transport badges, and spot forged booklets.',
      },
      {
        title: 'Deter Vehicle Theft & Embezzlement',
        desc: 'Screen against 20,000+ courts to identify individuals with past histories of vehicle theft, breach of trust, or impoundment warrants.',
      },
      {
        title: 'Protect Your Family on Every Journey',
        desc: 'Ensure children and elderly family members travel with vetted chauffeurs who have zero pending criminal FIRs or reckless driving litigations.',
      },
      {
        title: 'Insurance Claim & Legal Compliance',
        desc: 'Avoid motor insurance claim rejections in road accidents caused by drivers with unverified, forged, or suspended driving licenses.',
      },
      {
        title: 'Establish Permanent Residential Roots',
        desc: 'Verify permanent native address and family trace via utility and municipal records so your staff is always traceable.',
      },
    ],
    howPillTag: 'STREAMLINED 3-STEP PROCESS',
    howTitle: 'How Driver Verification',
    howSubtitle: 'Fast, legally valid, and 100% integrated with verified government road transport and court databases.',
    steps: [
      {
        num: '01',
        icon: '📋',
        title: 'Select Driver Checks & Enter Details',
        desc: 'Choose driving license, court, or police checks. Enter the driver’s name and basic details in under 60 seconds.',
      },
      {
        num: '02',
        icon: '📤',
        title: 'Upload Driving License & ID Proof',
        desc: 'Upload a clear photo of the driving license and Aadhaar. Our AI OCR instantly validates credentials against MoRTH Sarathi.',
      },
      {
        num: '03',
        icon: '📑',
        title: 'Download Official QR-Certified Dossier',
        desc: 'Receive your official digital driver verification dossier with tamper-proof QR code directly in your email and dashboard.',
      },
    ],
    instantChecksTitle: 'Instant Real-Time Checks',
    instantChecksSubtitle: 'Delivered immediately in under 2 minutes directly from central government registries.',
    recommendedChecksTitle: 'Recommended Compliance Checks',
    recommendedChecksSubtitle: 'Deep screening certified across 20,000+ Indian courts and law enforcement registries.',
    instantChecks: [
      {
        id: 'driving-license-check',
        name: 'Driving License Check',
        type: 'instant',
        price: 299,
        tat: '⚡ < 1 Min',
        icon: '🚗',
        description: 'Direct MoRTH Sarathi query authenticating license status, issuing RTO, validity dates, and LMV/HMV class authorizations.',
        tags: ['MoRTH Sarathi', 'RTO Authenticated', 'LMV/HMV Class'],
        docTypes: ['driving_license'],
      },
      {
        id: 'aadhar-check',
        name: 'Aadhaar Identity Check',
        type: 'instant',
        price: 299,
        tat: '⚡ < 30s',
        icon: '🪪',
        description: 'Direct UIDAI gateway verification cross-referencing demographic data, age congruence, and biometric linkage.',
        tags: ['UIDAI Gateway', 'Biometric Match', 'Govt. Photo ID'],
        docTypes: ['aadhaar'],
      },
      {
        id: 'face-match-check',
        name: 'Face Match & 3D Liveness',
        type: 'instant',
        price: 299,
        tat: '⚡ Instant',
        icon: '👤',
        description: 'AI neural facial recognition comparing driver selfie with photo on Driving License and Aadhaar to prevent impersonation.',
        tags: ['AI Biometrics', '3D Liveness', 'Anti-Spoofing AI'],
        docTypes: ['driving_license', 'aadhaar'],
      },
    ],
    recommendedChecks: [
      {
        id: 'criminal-court-record-check',
        name: 'Criminal Court Record Check',
        type: 'recommended',
        price: 299,
        tat: '⚡ Same Day',
        icon: '⚖️',
        description: 'AI algorithmic search across 20,000+ district, session, and High Courts for pending traffic, FIRs, and criminal filings.',
        tags: ['20,000+ Courts', 'CNR Registry Search', 'FIR & Litigations'],
        docTypes: ['aadhaar', 'driving_license'],
      },
      {
        id: 'police-clearance-certificate',
        name: 'Police Clearance Certificate',
        type: 'recommended',
        price: 299,
        tat: '⏱️ 2-4 Days',
        icon: '👮‍♂️',
        description: 'Official jurisdictional police verification docket checking police station blotters, criminal summons, and warrants.',
        tags: ['PCC Clearance', 'Local Station Docket', 'Warrants Search'],
        docTypes: ['aadhaar', 'driving_license'],
      },
      {
        id: 'address-proof-check',
        name: 'Address Proof Check',
        type: 'recommended',
        price: 299,
        tat: '⚡ Same Day',
        icon: '🏠',
        description: 'Cross-validates permanent residential address against state electricity board, municipal water, and telecom registries.',
        tags: ['Utility Match', 'Electricity Board', 'Voter Roll Match'],
        docTypes: ['utility_bill', 'aadhaar', 'voter_id'],
      },
    ],
    modalOrderSummarySub: 'Review your selected driver & guard verification checks',
    modalInitiatedMsg: 'Your driver verification request has been initialized. You will receive an email link to review the dossier.',
  },

  maid: {
    role: 'maid',
    seoTitle: 'Domestic Help & Maid Verification | Securitas India',
    seoDesc: 'Safeguard your home with trusted domestic help, maid, and cook verification. Live UIDAI Aadhaar check, police clearance, court criminal background, and address verification.',
    breadcrumbLabel: 'Domestic Help & Maid Verification',
    eyebrowBadge: '🏠 Official UIDAI & Police Gateway • In-Home Domestic Safety',
    heroTitle: 'Verify Domestic Help & Maid.',
    heroEmeraldText: 'Protect Your Home & Family.',
    heroSubtitle: 'Screen housemaids, cooks, nannies, and housekeeping staff against UIDAI Aadhaar biometrics, police records, court litigation, and past employer feedback in under 2 minutes.',
    trustPills: [
      { icon: '⚡', text: 'Instant UIDAI Match' },
      { icon: '👮', text: 'Jurisdictional Police Docket' },
      { icon: '⚖️', text: 'Court Records Scan' },
      { icon: '🏠', text: '100% In-Home Peace' },
    ],
    primaryBtnText: 'Select Domestic Help Checks Below',
    bundleBtnText: '⚡ Bundle All Domestic Checks (Save 25%)',
    bundleDiscountPercent: 25,
    imageAlt: 'Verified Domestic worker and house help portrait',
    floatingBadgeTitle: 'Domestic Staff Dossier',
    floatingBadgeDesc: 'UIDAI Aadhaar & Police Cleared',
    holoAvatar: 'DH',
    holoName: 'Domestic Staff Dossier',
    holoId: 'HELP-ID: #510394-IN',
    holoChecks: [
      { icon: '🪪', title: 'UIDAI Aadhaar Biometrics & ID', status: '✓ Authenticated' },
      { icon: '⚖️', title: 'Court Litigation (20,000+ e-Courts)', status: '✓ Zero Record' },
      { icon: '👮', title: 'Jurisdictional Police Clearance (PCC)', status: '✓ Verified' },
      { icon: '🤝', title: 'Prior Employer Reference Audit', status: '✓ Recommended' },
    ],
    holoFooterTitle: 'Tamper-Proof Domestic Staff Dossier',
    whyPillTag: 'IN-HOME SECURITY & FAMILY PROTECTION',
    whyTitlePart1: 'Why Domestic Help Verification',
    whyTitleEmerald: 'Matters?',
    whyDesc: 'Inviting domestic staff into your private home requires uncompromised diligence. Here is how verified screening safeguards your loved ones and possessions:',
    benefits: [
      {
        title: 'Protect Children & Elderly Loved Ones',
        desc: 'Ensure nannies, babysitters, and senior caregivers have verified backgrounds with zero past child endangerment or abuse records.',
      },
      {
        title: 'Deter In-Home Theft & Pilferage',
        desc: 'Background checks deter crime and ensure staff members have no prior history of domestic burglary, jewelry theft, or cash pilferage.',
      },
      {
        title: 'Detect Forged & Synthetic Aadhaar Cards',
        desc: 'Over 30% of domestic workers carry duplicate or fraudulent IDs. Live UIDAI query validates true identity and photo biometrics.',
      },
      {
        title: 'Establish Permanent Native Address',
        desc: 'Verify the permanent village or hometown address via utility and municipal records, ensuring complete traceability and accountability.',
      },
      {
        title: 'Genuine Supervisor & Employer References',
        desc: 'Conduct structured checks with prior households to confirm work ethic, punctuality, honesty, and reasons for leaving.',
      },
    ],
    howPillTag: 'STREAMLINED 3-STEP PROCESS',
    howTitle: 'How Domestic Staff Verification',
    howSubtitle: 'Fast, paperless, and 100% integrated with verified government UIDAI, e-Courts, and police registries.',
    steps: [
      {
        num: '01',
        icon: '📋',
        title: 'Select Domestic Staff Checks',
        desc: 'Choose Aadhaar, police clearance, address verification, or employer reference audit in under 60 seconds.',
      },
      {
        num: '02',
        icon: '📤',
        title: 'Upload Staff Photo & Aadhaar Card',
        desc: 'Upload a clear photo of your helper’s Aadhaar card. Our AI OCR extracts credentials and validates with UIDAI instantly.',
      },
      {
        num: '03',
        icon: '📑',
        title: 'Receive Official Safety Dossier',
        desc: 'Receive your official digital domestic verification dossier with tamper-proof QR code directly in your email and dashboard.',
      },
    ],
    instantChecksTitle: 'Instant Real-Time Checks',
    instantChecksSubtitle: 'Real-time government gateway verification delivered immediately in under 2 minutes.',
    recommendedChecksTitle: 'Recommended Compliance Checks',
    recommendedChecksSubtitle: 'Deep screening certified across 20,000+ Indian courts, police dockets, and prior employers.',
    instantChecks: [
      {
        id: 'aadhar-check',
        name: 'Aadhar Card Check',
        type: 'instant',
        price: 299,
        tat: '⚡ < 30s',
        icon: '🪪',
        description: 'Real-time UIDAI API match verifying 12-digit Aadhaar legitimacy, name congruence, and registered mobile linkage.',
        tags: ['UIDAI Gateway', 'Instant Match', 'Synthetic Fraud Shield'],
        docTypes: ['aadhaar'],
      },
      {
        id: 'identity-check',
        name: 'Identity KYC Check',
        type: 'instant',
        price: 299,
        tat: '⚡ < 2 Mins',
        icon: '🪪',
        description: 'Cross-verifies Aadhaar and supplementary government identity credentials to eliminate synthetic identity fraud.',
        tags: ['Multi-ID Query', 'Biometric Congruence', 'Tamper-Proof Dossier'],
        docTypes: ['aadhaar', 'voter_id', 'pan'],
      },
      {
        id: 'address-proof-check',
        name: 'Address Proof Check',
        type: 'instant',
        price: 299,
        tat: '⚡ Same Day',
        icon: '🏠',
        description: 'Validates permanent and current residential address against state electricity board and telecom registries.',
        tags: ['Utility Match', 'Electricity Board', 'Address Integrity'],
        docTypes: ['utility_bill', 'aadhaar', 'voter_id'],
      },
    ],
    recommendedChecks: [
      {
        id: 'criminal-court-record-check',
        name: 'Criminal Court Record Check',
        type: 'recommended',
        price: 299,
        tat: '⚡ Same Day',
        icon: '⚖️',
        description: 'Comprehensive litigation search across 20,000+ district, session, and High Courts for domestic theft or FIRs.',
        tags: ['20,000+ Courts', 'CNR Registry Search', 'Theft & Dispute Scan'],
        docTypes: ['aadhaar', 'voter_id'],
      },
      {
        id: 'police-clearance-certificate',
        name: 'Police Clearance Certificate',
        type: 'recommended',
        price: 299,
        tat: '⏱️ 2-4 Days',
        icon: '👮‍♂️',
        description: 'Jurisdictional police station verification verifying local station blotters, criminal warrants, and court summons.',
        tags: ['PCC Clearance', 'Local Station Docket', 'Official Clearance Stamp'],
        docTypes: ['aadhaar', 'voter_id'],
      },
      {
        id: 'reference-check',
        name: 'Supervisor Reference Check',
        type: 'recommended',
        price: 299,
        tat: '⏱️ 1-2 Days',
        icon: '🤝',
        description: 'Structured telephonic interviews with past households and employers assessing integrity, conduct, and honesty.',
        tags: ['Past Employer Audit', 'Integrity Assessment', 'Conduct Report'],
        docTypes: ['aadhaar', 'pan'],
      },
    ],
    modalOrderSummarySub: 'Review your selected domestic help & maid verification checks',
    modalInitiatedMsg: 'Your domestic staff verification request has been initialized. You will receive an email link to review the dossier.',
  },

  tenant: {
    role: 'tenant',
    seoTitle: 'Tenant Background Verification & Rental Screening | Securitas India',
    seoDesc: 'Screen prospective tenants and roommates with legally valid background checks. Verify court litigation, credit score, PAN, Aadhaar, and permanent address verification.',
    breadcrumbLabel: 'Tenant Background Verification',
    eyebrowBadge: '🔑 Official e-Courts & Credit Bureau • Tenant Screening',
    heroTitle: 'Verify Prospective Tenants.',
    heroEmeraldText: 'Rent With Complete Confidence.',
    heroSubtitle: 'Screen tenants across 20,000+ e-Courts, CIBIL financial credit bureau score, PAN card authenticity, and permanent address before handing over keys.',
    trustPills: [
      { icon: '⚖️', text: '20,000+ Courts Litigation' },
      { icon: '📊', text: 'Credit Bureau Score' },
      { icon: '💳', text: 'PAN & Identity Verified' },
      { icon: '🏠', text: 'Landlord Protection' },
    ],
    primaryBtnText: 'Select Tenant Checks Below',
    bundleBtnText: '⚡ Bundle All Tenant Checks (Save 25%)',
    bundleDiscountPercent: 25,
    imageAlt: 'Verified Tenant background profile portrait',
    floatingBadgeTitle: 'Tenant Rental Dossier',
    floatingBadgeDesc: 'e-Courts Clear & CIBIL Evaluated',
    holoAvatar: 'TN',
    holoName: 'Tenant Screening Dossier',
    holoId: 'TNT-ID: #920481-IN',
    holoChecks: [
      { icon: '⚖️', title: 'Court Litigation (Civil & Criminal)', status: '✓ Zero Record' },
      { icon: '📊', title: 'Credit Bureau Score (CIBIL)', status: '✓ Excellent (785)' },
      { icon: '💳', title: 'PAN Authenticity (Income Tax Dept)', status: '✓ Authenticated' },
      { icon: '💼', title: 'Employment & EPFO Records', status: '✓ Active Tenure' },
    ],
    holoFooterTitle: 'Tamper-Proof Tenant Rental Dossier',
    whyPillTag: 'PROPERTY PROTECTION & RENTAL PEACE',
    whyTitlePart1: 'Why Tenant Verification',
    whyTitleEmerald: 'Matters?',
    whyDesc: 'Evicting problematic tenants or recovering unpaid rent through civil courts can take years in India. Here is why pre-rental verification protects your high-value property:',
    benefits: [
      {
        title: 'Prevent Rent Defaults & Financial Loss',
        desc: 'Evaluate official credit bureau scores, active debt liabilities, and repayment history before signing the rental lease.',
      },
      {
        title: 'Uncover Prior Eviction & Court Litigations',
        desc: 'Scan across 20,000+ civil courts and rent control tribunals to spot habitual defaulters and litigious tenants.',
      },
      {
        title: 'Eliminate Illegal Subletting & Commercial Misuse',
        desc: 'Authenticate employment tenures and professional profiles to ensure property is not misused for unauthorized commercial activities.',
      },
      {
        title: 'Police Verification Compliance',
        desc: 'Comply with mandatory local police station tenant verification guidelines, avoiding landlord penalties or municipal notices.',
      },
      {
        title: 'Fast-Track Society NOC & Move-In',
        desc: 'Present pre-verified, tamper-proof background dossiers to housing societies for seamless, fast-tracked move-in approvals.',
      },
    ],
    howPillTag: 'STREAMLINED 3-STEP PROCESS',
    howTitle: 'How Tenant Screening Works',
    howSubtitle: 'Fast, legally valid, and 100% integrated with verified credit bureaus, e-Courts, and tax databases.',
    steps: [
      {
        num: '01',
        icon: '📋',
        title: 'Select Tenant Screening Checks',
        desc: 'Choose civil litigation, credit score, PAN authenticity, or employment verification in under 60 seconds.',
      },
      {
        num: '02',
        icon: '📤',
        title: 'Upload Tenant PAN & Aadhaar',
        desc: 'Upload tenant identity documents. Our automated AI OCR parses and queries credit bureau and court registries.',
      },
      {
        num: '03',
        icon: '📑',
        title: 'Download Official Landlord Dossier',
        desc: 'Receive your official landlord tenant screening dossier with verified QR certificate directly in your email and dashboard.',
      },
    ],
    instantChecksTitle: 'Instant Real-Time Checks',
    instantChecksSubtitle: 'Immediate API verification delivered in under 2 minutes directly from authorized bureaus.',
    recommendedChecksTitle: 'Recommended Compliance Checks',
    recommendedChecksSubtitle: 'Comprehensive legal and employment screening across 20,000+ courts and EPFO registers.',
    instantChecks: [
      {
        id: 'pan-card-check',
        name: 'PAN Card Check',
        type: 'instant',
        price: 299,
        tat: '⚡ < 30s',
        icon: '💳',
        description: 'Direct NSDL and Income Tax Department query verifying PAN status, holder legal name, and tax registration legitimacy.',
        tags: ['NSDL / ITD Live Query', 'Active Status Match', 'Legal Name Match'],
        docTypes: ['pan'],
      },
      {
        id: 'credit-history-check',
        name: 'Credit History Check',
        type: 'instant',
        price: 299,
        tat: '⚡ < 2 Mins',
        icon: '📊',
        description: 'Comprehensive financial credit score evaluation, 36-month repayment discipline, and active loan liability exposure.',
        tags: ['Credit Bureau Score', 'Repayment History', 'Active Liability Check'],
        docTypes: ['pan'],
      },
      {
        id: 'identity-check',
        name: 'Identity KYC Check',
        type: 'instant',
        price: 299,
        tat: '⚡ < 2 Mins',
        icon: '🪪',
        description: 'Triangulated identity verification cross-referencing national databases to prevent synthetic identity theft.',
        tags: ['Triangulated Query', 'Demographic Match', 'Tamper-Proof Dossier'],
        docTypes: ['pan', 'aadhaar', 'voter_id'],
      },
    ],
    recommendedChecks: [
      {
        id: 'criminal-court-record-check',
        name: 'Criminal Court Record Check',
        type: 'recommended',
        price: 299,
        tat: '⚡ Same Day',
        icon: '⚖️',
        description: 'Comprehensive AI litigation search across 20,000+ civil, district, sessions, and High Courts for rent disputes.',
        tags: ['20,000+ Courts', 'Civil & Criminal Scan', 'Rent Dispute Search'],
        docTypes: ['pan', 'aadhaar'],
      },
      {
        id: 'employment-check',
        name: 'Employment Check',
        type: 'recommended',
        price: 299,
        tat: '⏱️ 2-3 Days',
        icon: '💼',
        description: 'Validates current employer, designation, EPFO monthly PF contributions, and declared workplace salary tenures.',
        tags: ['EPFO Passbook Audit', 'HR Authentication', 'Salary Tenure Match'],
        docTypes: ['pan', 'aadhaar'],
      },
      {
        id: 'address-proof-check',
        name: 'Address Proof Check',
        type: 'recommended',
        price: 299,
        tat: '⚡ Same Day',
        icon: '🏠',
        description: 'Validates permanent native home address against state utility registries and municipal property records.',
        tags: ['Permanent Address', 'Utility Match', 'Municipal Registry'],
        docTypes: ['utility_bill', 'aadhaar', 'voter_id'],
      },
    ],
    modalOrderSummarySub: 'Review your selected tenant background screening checks',
    modalInitiatedMsg: 'Your tenant background screening request has been initialized. You will receive an email link to review the dossier.',
  },
};

interface RoleVerificationPageProps {
  role: RoleType;
  onNavigateHome: () => void;
  onNavigateServices?: () => void;
  onNavigateRole?: (role: RoleType) => void;
}

export const RoleVerificationPage: React.FC<RoleVerificationPageProps> = ({
  role,
  onNavigateHome,
  onNavigateServices,
  onNavigateRole,
}) => {
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.driver;
  const [selectedChecks, setSelectedChecks] = useState<{ [id: string]: number }>({});
  const [showModal, setShowModal] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);

  // Sync document title and meta description dynamically for SEO
  useEffect(() => {
    document.title = config.seoTitle;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', config.seoDesc);
  }, [config]);

  // Reset selected checks when role switches
  useEffect(() => {
    setSelectedChecks({});
  }, [role]);

  // OCR Pop-up State
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrCheckDetails, setOcrCheckDetails] = useState<{
    title: string;
    price: string | number;
    docType: DocumentType;
    allowedDocTypes?: DocumentType[];
  }>({
    title: `${config.breadcrumbLabel} Check`,
    price: '₹ 299',
    docType: 'aadhaar',
    allowedDocTypes: ['aadhaar'],
  });

  const handleOpenOCR = (
    title: string,
    price: string | number,
    docType: DocumentType = 'aadhaar',
    allowedDocs?: DocumentType[]
  ) => {
    setOcrCheckDetails({
      title,
      price,
      docType,
      allowedDocTypes: allowedDocs || [docType],
    });
    setOcrModalOpen(true);
  };

  // Image lookup from CATEGORIES with clean fallbacks
  const categoryId = role === 'driver' ? 'driver' : role === 'maid' ? 'house-help' : 'tenant';
  const heroImage = (CATEGORIES && CATEGORIES.find((c) => c.id === categoryId)?.image) || '/self-verification.jpg';

  // Authentication State & Check Selection Guard
  const { isLoggedIn } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingCheckToSelect, setPendingCheckToSelect] = useState<PendingCheckInfo | null>(null);
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  const allChecks = [...config.instantChecks, ...config.recommendedChecks];

  const requestLoginForCheck = (id: string, name?: string, price?: number, icon?: string) => {
    const item = allChecks.find((c) => c.id === id);
    setPendingCheckToSelect({
      id,
      name: name || (item ? item.name : 'Verification Check'),
      price: price || item?.price,
      icon: icon || item?.icon || '🚗',
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

  const rawTotalPrice = Object.entries(selectedChecks).reduce((acc, [id, count]) => {
    const item = allChecks.find((c) => c.id === id);
    return acc + (item ? item.price * count : 0);
  }, 0);

  // Bundle Discount if all checks or 4+ selected
  const isBundleDiscount = totalCount >= 4;
  const discountAmount = isBundleDiscount ? Math.round(rawTotalPrice * 0.25) : 0;
  const totalPrice = rawTotalPrice - discountAmount;

  const handleSelectAllBundle = () => {
    if (!isLoggedIn) {
      setPendingCheckToSelect({
        id: 'bundle-all',
        name: `All ${config.breadcrumbLabel} Checks Bundle`,
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
        setAuthSuccessToast(`✓ Logged in! All ${allChecks.length} checks selected.`);
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
    const roleHash = role === 'driver' ? 'driverVerification' : role === 'maid' ? 'maidVerification' : 'tenantVerification';
    const url = `${window.location.origin}${window.location.pathname}#${roleHash}?check=${checkId}`;
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

  // Auto-scroll and highlight check if present in URL
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
  }, [role]);

  const getDocsForCheck = (id: string): DocumentType[] => {
    const item = allChecks.find((c) => c.id === id);
    return item?.docTypes || ['aadhaar'];
  };

  const handlePaymentSuccess = (details: { paymentId: string; method: string }) => {
    setRazorpayModalOpen(false);

    const selectedIds = Object.keys(selectedChecks);
    const selectedItems = allChecks.filter((c) => selectedChecks[c.id]);

    // Aggregate all required/allowed docs across all selected checks
    const allowedDocs: DocumentType[] = [];
    selectedIds.forEach((id) => {
      const docs = getDocsForCheck(id);
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
      {/* Breadcrumb Navigation Strip & Quick Switcher */}
      <div className="sv-breadcrumb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
          <span
            className="sv-breadcrumb-link"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateServices) onNavigateServices();
              else scrollToChecks();
            }}
          >
            <span>All 18 Checks</span>
          </span>
          <span className="sv-breadcrumb-sep">›</span>
          <span className="sv-breadcrumb-current">
            <span className="sv-breadcrumb-dot"></span>
            <span>{config.breadcrumbLabel}</span>
          </span>
        </nav>

        {/* Quick Role Switcher Strip */}
        <div className="services-role-switch-pills" style={{ margin: 0, padding: 0 }}>
          <button
            type="button"
            className={`role-switch-pill ${role === 'driver' ? 'active' : ''}`}
            onClick={() => onNavigateRole && onNavigateRole('driver')}
          >
            <span>🚗</span>
            <span>Driver &amp; Guard</span>
          </button>
          <button
            type="button"
            className={`role-switch-pill ${role === 'maid' ? 'active' : ''}`}
            onClick={() => onNavigateRole && onNavigateRole('maid')}
          >
            <span>🏠</span>
            <span>Domestic Help &amp; Maid</span>
          </button>
          <button
            type="button"
            className={`role-switch-pill ${role === 'tenant' ? 'active' : ''}`}
            onClick={() => onNavigateRole && onNavigateRole('tenant')}
          >
            <span>🔑</span>
            <span>Tenant Background</span>
          </button>
          <button
            type="button"
            className="role-switch-pill"
            onClick={() => onNavigateServices && onNavigateServices()}
          >
            <span>📋</span>
            <span>All 18 Checks</span>
          </button>
        </div>
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
                <span>{config.eyebrowBadge}</span>
              </div>

              <h1 className="sv-hero-title">
                {config.heroTitle}
                <br />
                <span className="sv-emerald-text">{config.heroEmeraldText}</span>
              </h1>

              <p className="sv-hero-subtitle">{config.heroSubtitle}</p>

              {/* Trust Pill Highlights Strip */}
              <div className="sv-trust-pills-row">
                {config.trustPills.map((pill, idx) => (
                  <div key={idx} className="sv-trust-pill">
                    <span className="sv-pill-icon">{pill.icon}</span>
                    <span>{pill.text}</span>
                  </div>
                ))}
              </div>

              <div className="sv-hero-actions">
                <button type="button" className="sv-btn-primary" onClick={scrollToChecks}>
                  <span>{config.primaryBtnText}</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </button>

                <button type="button" className="sv-btn-secondary" onClick={handleSelectAllBundle}>
                  <span>{config.bundleBtnText}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Visual Stage with Portrait and Floating Glass Badge */}
            <div className="sv-hero-right">
              <div className="sv-showcase-frame">
                <div className="sv-showcase-halo"></div>

                <div className="sv-showcase-img-wrap">
                  <img
                    src={heroImage}
                    alt={config.imageAlt}
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
                    <span className="sv-badge-title">{config.floatingBadgeTitle}</span>
                    <span className="sv-badge-desc">{config.floatingBadgeDesc}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION: WHY VERIFICATION MATTERS?
         ======================================================== */}
      <section className="sv-section">
        <div className="sv-why-grid">
          {/* Left Visual: Holographic Dashboard Preview */}
          <div className="sv-why-visual">
            <div className="sv-holo-card">
              <div className="sv-holo-glow-top"></div>

              <div className="sv-holo-header">
                <div className="sv-holo-user-row">
                  <div className="sv-holo-avatar">{config.holoAvatar}</div>
                  <div className="sv-holo-user-meta">
                    <span className="sv-holo-name">{config.holoName}</span>
                    <span className="sv-holo-id">{config.holoId}</span>
                  </div>
                </div>
                <div className="sv-holo-stamp">
                  <span>✓ 100% Cleared</span>
                </div>
              </div>

              <div className="sv-holo-checks-stack">
                {config.holoChecks.map((item, idx) => (
                  <div key={idx} className="sv-holo-check-item">
                    <div className="sv-holo-item-left">
                      <span className="sv-holo-item-icon">{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                    <span className="sv-holo-item-status">{item.status}</span>
                  </div>
                ))}
              </div>

              <div className="sv-holo-footer">
                <span>{config.holoFooterTitle}</span>
                <span className="sv-holo-qr">
                  <span>📱 Scan QR Verified</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Content: 5 Benefits */}
          <div className="sv-why-content">
            <div className="sv-section-pill-tag">
              <span>{config.whyPillTag}</span>
            </div>

            <h2 className="sv-section-title">
              {config.whyTitlePart1} <span className="sv-emerald-text">{config.whyTitleEmerald}</span>
            </h2>

            <p className="sv-section-desc">{config.whyDesc}</p>

            <div className="sv-benefits-list">
              {config.benefits.map((benefit, idx) => (
                <div key={idx} className="sv-benefit-card">
                  <div className="sv-benefit-check-disc">✓</div>
                  <div className="sv-benefit-text-wrap">
                    <span className="sv-benefit-title">{benefit.title}</span>
                    <span className="sv-benefit-desc">{benefit.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION: HOW IT WORKS (3 STEPS)
         ======================================================== */}
      <section className="sv-section sv-how-section">
        <div className="sv-section-pill-tag">
          <span>{config.howPillTag}</span>
        </div>

        <h2 className="sv-section-title">
          {config.howTitle} <span className="sv-emerald-text">Works</span>
        </h2>

        <p className="sv-section-desc">{config.howSubtitle}</p>

        <div className="sv-steps-grid">
          {config.steps.map((step, idx) => (
            <div key={idx} className="sv-step-card">
              <div className="sv-step-glow-line"></div>
              <div className="sv-step-header">
                <div className="sv-step-num-pill">{step.num}</div>
                <div className="sv-step-icon-disc">{step.icon}</div>
              </div>
              <h3 className="sv-step-title">{step.title}</h3>
              <p className="sv-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          SECTION: CHECKS SELECTION (INSTANT & RECOMMENDED)
         ======================================================== */}
      <section id="checks-selection" className="sv-section sv-checks-section">
        {/* Instant Checks Header */}
        <div className="sv-checks-section-head">
          <div className="sv-section-pill-tag">
            <span>REAL-TIME ALGORITHMIC GATEWAYS</span>
          </div>
          <h2 className="sv-section-title">
            Instant <span className="sv-emerald-text">Checks</span>
          </h2>
          <p className="sv-section-desc">{config.instantChecksSubtitle}</p>
        </div>

        {/* 3 Instant Checks Grid */}
        <div className="sv-checks-grid sv-grid-3">
          {config.instantChecks.map((item) => {
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
                      <span>{copiedCheckId === item.id ? '✓ Copied' : 'Share Link'}</span>
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
                  <div className="sv-counter-wrap">
                    <button
                      type="button"
                      className="sv-counter-btn"
                      onClick={() => handleDecrement(item.id)}
                      disabled={count === 0}
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

                  <button
                    type="button"
                    className={`sv-card-add-toggle ${isSelected ? 'added' : ''}`}
                    onClick={() => handleToggleAdd(item.id)}
                  >
                    <span>{isSelected ? '✓ Added' : '+ Add'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommended Checks Header */}
        <div className="sv-checks-section-head">
          <div className="sv-section-pill-tag">
            <span>DEEP COMPLIANCE &amp; LEGAL SCREENING</span>
          </div>
          <h2 className="sv-section-title">
            Recommended <span className="sv-purple-text">Checks</span>
          </h2>
          <p className="sv-section-desc">{config.recommendedChecksSubtitle}</p>
        </div>

        {/* 3 Recommended Checks Grid */}
        <div className="sv-checks-grid sv-grid-3">
          {config.recommendedChecks.map((item) => {
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
                      <span>{copiedCheckId === item.id ? '✓ Copied' : 'Share Link'}</span>
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
                    <span className="sv-card-verified-shield" title="Official Verified">
                      ✓
                    </span>
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
                  <div className="sv-counter-wrap">
                    <button
                      type="button"
                      className="sv-counter-btn"
                      onClick={() => handleDecrement(item.id)}
                      disabled={count === 0}
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

                  <button
                    type="button"
                    className={`sv-card-add-toggle ${isSelected ? 'added' : ''}`}
                    onClick={() => handleToggleAdd(item.id)}
                  >
                    <span>{isSelected ? '✓ Added' : '+ Add'}</span>
                  </button>
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
              <span className="sv-cart-subtext">
                {isBundleDiscount ? '🎉 25% Bundle Discount applied!' : 'Instant digital dossier generation'}
              </span>
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
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
                  {config.modalInitiatedMsg}
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
                  <p className="sv-modal-sub">{config.modalOrderSummarySub}</p>
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

                  {isBundleDiscount && (
                    <div className="sv-modal-item-row" style={{ color: '#10b981' }}>
                      <span className="sv-modal-item-name">Bundle Discount (25%)</span>
                      <span className="sv-modal-item-price">-₹ {discountAmount}</span>
                    </div>
                  )}
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
        customerName={`${config.breadcrumbLabel} Candidate`}
        checksCount={totalCount}
        checksSummary={`${config.breadcrumbLabel} Verification (${totalCount} Checks)`}
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

export default RoleVerificationPage;
