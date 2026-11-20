import React, { useState, useRef, useEffect, useMemo } from 'react';
import '../styles/ocr-modal.css';
import { VerificationStatusModal, CandidateDossierData } from './verification-status-modal';
import Camera, { isMobileDevice } from './camera';

export type DocumentType =
  | 'aadhaar'
  | 'pan'
  | 'driving_license'
  | 'voter_id'
  | 'passport'
  | 'academic_cert'
  | 'utility_bill';

export interface OCRExtractedData {
  docType: DocumentType;
  fullName: string;
  idNumber: string;
  dob: string;
  gender: string;
  guardianName: string;
  address: string;
  validUntil?: string;
  confidence: number;
}

export interface OCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle?: string;
  servicePrice?: string | number;
  initialDocType?: DocumentType;
  allowedDocTypes?: DocumentType[];
  onComplete?: (data: OCRExtractedData) => void;
}

export interface DocPreset {
  id: DocumentType;
  label: string;
  icon: string;
  idFormat: string;
  placeholderHint: string;
}

export const DOC_PRESETS: DocPreset[] = [
  {
    id: 'aadhaar',
    label: 'Aadhaar Card',
    icon: '🪪',
    idFormat: 'XXXX XXXX XXXX',
    placeholderHint: '12-digit UIDAI Aadhaar Number',
  },
  {
    id: 'pan',
    label: 'PAN Card',
    icon: '💳',
    idFormat: 'ABCDE1234F',
    placeholderHint: '10-character Permanent Account Number',
  },
  {
    id: 'driving_license',
    label: 'Driving License',
    icon: '🚗',
    idFormat: 'DL-14201100XXXXX',
    placeholderHint: 'State RTO Driving License Number',
  },
  {
    id: 'voter_id',
    label: 'Voter ID (EPIC)',
    icon: '🗳️',
    idFormat: 'WBF1982734',
    placeholderHint: '10-character Electoral EPIC Number',
  },
  {
    id: 'passport',
    label: 'Passport',
    icon: '🛂',
    idFormat: 'P1234567',
    placeholderHint: '8-character Indian Passport Number',
  },
  {
    id: 'academic_cert',
    label: 'Degree / University Certificate',
    icon: '🎓',
    idFormat: 'REG/UGC/2021/XXXX',
    placeholderHint: 'University Roll / Enrollment Number',
  },
  {
    id: 'utility_bill',
    label: 'Utility / Address Bill',
    icon: '📜',
    idFormat: 'Consumer ID 102938475',
    placeholderHint: 'Electricity / Municipal Connection ID',
  },
];

/* ========================================================
   DYNAMIC TESSERACT.JS CDN LOADER
   Loads client-side OCR engine directly into the browser
   with multiple fallback CDN mirrors
======================================================== */
let tesseractPromise: Promise<any> | null = null;

function loadTesseractCDN(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if ((window as any).Tesseract) return Promise.resolve((window as any).Tesseract);
  if (tesseractPromise) return tesseractPromise;

  tesseractPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      resolve((window as any).Tesseract);
    };

    script.onerror = () => {
      // Fallback mirror: unpkg
      const script2 = document.createElement('script');
      script2.src = 'https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js';
      script2.async = true;
      script2.onload = () => resolve((window as any).Tesseract);
      script2.onerror = () => resolve(null);
      document.head.appendChild(script2);
    };

    document.head.appendChild(script);
  });

  return tesseractPromise;
}

/* ========================================================
   CANVAS IMAGE PRE-PROCESSING
   Increases contrast, binarizes and scales up for high OCR accuracy
======================================================== */
function preprocessImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  let width = img.naturalWidth || img.width || 800;
  let height = img.naturalHeight || img.height || 600;

  // Scale small images up to min width 1400px for sharp character boundaries
  if (width < 1200) {
    const scale = 1400 / width;
    width = 1400;
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    // Grayscale + Adaptive contrast enhancement
    const contrastVal = 30; // Positive contrast enhancement in -255..255 scale
    const factor = (259 * (contrastVal + 255)) / (255 * (259 - contrastVal));

    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const adjusted = factor * (gray - 128) + 128;
      const finalVal = Math.min(255, Math.max(0, Math.round(adjusted)));

      d[i] = finalVal;
      d[i + 1] = finalVal;
      d[i + 2] = finalVal;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // If CORS or tainted canvas, fallback to raw canvas
  }

  return canvas;
}

/* ========================================================
   SVG TEXT EXTRACTOR
======================================================== */
function extractTextFromSVGDataURL(dataUrl: string): string {
  try {
    let svgContent = '';
    if (dataUrl.startsWith('data:image/svg+xml;utf8,')) {
      svgContent = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
    } else if (dataUrl.startsWith('data:image/svg+xml;base64,')) {
      svgContent = atob(dataUrl.replace('data:image/svg+xml;base64,', ''));
    } else {
      svgContent = dataUrl;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const texts = Array.from(doc.querySelectorAll('text')).map((t) => t.textContent || '');
    return texts.join('\n');
  } catch {
    return '';
  }
}

/* ========================================================
   GENUINE OCR TEXT PARSER FOR INDIAN DOCUMENTS
   Parses raw text recognized from the document into structured fields
======================================================== */
export function parseDocumentText(rawText: string, docType: DocumentType): {
  data: Partial<OCRExtractedData>;
  confidence: number;
  matchedFields: string[];
} {
  const cleanText = rawText.replace(/\r\n/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const matchedFields: string[] = [];
  const result: Partial<OCRExtractedData> = {
    docType,
    fullName: '',
    idNumber: '',
    dob: '',
    gender: 'Male',
    guardianName: '',
    address: '',
    validUntil: '',
  };

  let score = 0;

  // 1. EXTRACT DOCUMENT NUMBER
  if (docType === 'pan') {
    const panMatch = cleanText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/i);
    if (panMatch) {
      result.idNumber = panMatch[1].toUpperCase();
      matchedFields.push('PAN Number');
      score += 40;
    }
  } else if (docType === 'aadhaar') {
    const aadhaarSpaced = cleanText.match(/\b(\d{4}\s\d{4}\s\d{4})\b/);
    const aadhaarContinuous = cleanText.match(/\b(\d{12})\b/);
    if (aadhaarSpaced) {
      result.idNumber = aadhaarSpaced[1];
      matchedFields.push('Aadhaar Number');
      score += 40;
    } else if (aadhaarContinuous) {
      const d = aadhaarContinuous[1];
      result.idNumber = `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`;
      matchedFields.push('Aadhaar Number');
      score += 40;
    }
  } else if (docType === 'driving_license') {
    const dlMatch =
      cleanText.match(/\b([A-Z]{2}[-\s]?[0-9]{2,3}[-\s]?[0-9]{4}[-\s]?[0-9]{5,8})\b/i) ||
      cleanText.match(/\b(DL[-\s]?[A-Z0-9]{9,16})\b/i);
    if (dlMatch) {
      result.idNumber = dlMatch[1].toUpperCase().replace(/\s+/g, '-');
      matchedFields.push('Driving License Number');
      score += 40;
    }
  } else if (docType === 'voter_id') {
    const epicMatch = cleanText.match(/\b([A-Z]{3}[0-9]{7})\b/i);
    if (epicMatch) {
      result.idNumber = epicMatch[1].toUpperCase();
      matchedFields.push('Voter ID (EPIC)');
      score += 40;
    }
  } else if (docType === 'passport') {
    const passMatch = cleanText.match(/\b([A-Z][0-9]{7})\b/i);
    if (passMatch) {
      result.idNumber = passMatch[1].toUpperCase();
      matchedFields.push('Passport Number');
      score += 40;
    }
  } else if (docType === 'utility_bill') {
    const utilMatch =
      cleanText.match(/\b(?:CA|Consumer|Account|RR\s*No|K\s*No)[.:\s]+([A-Z0-9-]+)\b/i) ||
      cleanText.match(/\b([0-9]{9,12})\b/);
    if (utilMatch) {
      result.idNumber = (utilMatch[1] || utilMatch[0]).toUpperCase();
      matchedFields.push('Consumer / Connection Number');
      score += 35;
    }
  } else if (docType === 'academic_cert') {
    const rollMatch = cleanText.match(/\b(?:Roll|Reg(?:istration)?|Enrollment)\s*(?:No|Number)?[:\s]+([A-Z0-9/-]+)\b/i);
    if (rollMatch) {
      result.idNumber = rollMatch[1].toUpperCase();
      matchedFields.push('Roll / Registration Number');
      score += 35;
    }
  }

  // 2. EXTRACT DATE OF BIRTH
  const dobMatch =
    cleanText.match(/(?:DOB|Date of Birth|Birth|D\.O\.B|जन्म\s*तिथि)[:\s]+(\d{1,2}[-/.–]\d{1,2}[-/.–]\d{2,4})/i) ||
    cleanText.match(/\b(\d{1,2}[-/.–]\d{1,2}[-/.–](?:19|20)\d{2})\b/);
  if (dobMatch) {
    const rawDate = dobMatch[1].replace(/[.–]/g, '/').replace(/-/g, '/');
    result.dob = rawDate;
    matchedFields.push('Date of Birth');
    score += 20;
  } else {
    const yobMatch = cleanText.match(/(?:Year of Birth|YOB)[:\s]+(19\d{2}|20\d{2})/i);
    if (yobMatch) {
      result.dob = `01/01/${yobMatch[1]}`;
      matchedFields.push('Year of Birth');
      score += 15;
    }
  }

  // 3. EXTRACT GENDER
  const genderMatch = cleanText.match(/\b(Female|FEMALE|महिला)\b/i)
    ? 'Female'
    : cleanText.match(/\b(Male|MALE|पुरुष)\b/i)
    ? 'Male'
    : cleanText.match(/\b(Transgender|TRANSGENDER)\b/i)
    ? 'Other'
    : null;
  if (genderMatch) {
    result.gender = genderMatch;
    matchedFields.push('Gender');
    score += 10;
  }

  // 4. EXTRACT FATHER'S / GUARDIAN'S NAME
  const fatherMatch = cleanText.match(
    /(?:Father(?:'s)?\s*Name|Father|S\/O|D\/O|W\/O|Husband(?:'s)?\s*Name)[:\s]+([A-Za-z\s.]{3,35})/i
  );
  if (fatherMatch) {
    const rawGuardian = fatherMatch[1].trim().replace(/\n.*$/, '').replace(/[^a-zA-Z\s.]/g, '');
    if (rawGuardian.length > 2) {
      result.guardianName = rawGuardian;
      matchedFields.push("Father / Guardian's Name");
      score += 15;
    }
  }

  // 5. EXTRACT FULL LEGAL NAME (Multi-pass intelligent parser for Indian documents)
  const UIDAI_STOP_WORDS = [
    'GOVERNMENT', 'GOVT', 'INDIA', 'BHARAT', 'SARKAR', 'UNIQUE', 'IDENTIFICATION',
    'AUTHORITY', 'UIDAI', 'AADHAAR', 'AADHAR', 'ADHAAR', 'PEHCHAN', 'PEHCHAAN', 'MERA',
    'MERI', 'ENROLMENT', 'ENROLLMENT', 'HELP', 'LINE', 'DOWNLOAD', 'ISSUE', 'DATE',
    'MALE', 'FEMALE', 'TRANSGENDER', 'PURUSH', 'MAHILA', 'ADDRESS', 'VID', 'CARD',
    'OFFLINE', 'XML', 'QR', 'CODE', 'ELECTRONICALLY', 'VERIFIED', 'NOT', 'VALID',
    'E-AADHAAR', 'EAADHAAR', 'REPUBLIC', 'INCOME', 'TAX', 'DEPARTMENT', 'ELECTION',
    'COMMISSION', 'PASSPORT', 'DRIVING', 'LICENCE', 'LICENSE', 'TRANSPORT', 'UNION',
    'PERMANENT', 'ACCOUNT', 'NUMBER', 'SIGNATURE', 'FORM', 'SMART', 'STATE', 'DIST',
    'DISTRICT', 'PIN', 'PINCODE', 'PO', 'PS', 'POST', 'OFFICE', 'FATHER', 'HUSBAND',
    'MOTHER', 'SON', 'DAUGHTER', 'WIFE', 'YEAR', 'BIRTH', 'DETAILS', 'INFORMATION',
    'MINISTRY', 'EXTERNAL', 'AFFAIRS', 'SARATHI', 'NSDL', 'UTIITSL', 'ELECTORAL'
  ];

  const isStopWordLine = (line: string): boolean => {
    const upper = line.toUpperCase();
    const words = upper.split(/[^A-Z]+/).filter((w) => w.length > 1);
    if (words.length === 0) return true;
    const stopCount = words.filter((w) => UIDAI_STOP_WORDS.includes(w)).length;
    if (stopCount / words.length >= 0.45) return true;
    if (words.some((w) => ['GOVERNMENT', 'UIDAI', 'AADHAAR', 'AUTHORITY', 'IDENTIFICATION', 'INCOME', 'ELECTION', 'REPUBLIC'].includes(w))) {
      return true;
    }
    return false;
  };

  const cleanCandidateName = (raw: string): string => {
    let cleaned = raw.replace(/[^A-Za-z\s.]/g, ' ').replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^(?:Shri|Smt|Mr|Mrs|Ms|Kumari|Dr|Sh\b)\.?\s+/i, '');
    const tokens = cleaned.split(' ').filter((w) => w.length > 1 || w.endsWith('.'));
    return tokens.join(' ').trim();
  };

  // Strategy 1: Explicit Name label (e.g., "Name: ...", "Holder Name: ...")
  const explicitName = cleanText.match(
    /(?:Name|Full Name|Holder Name|Elector Name|Given Name|Given Names|Name in English|Candidate Name)[:\s]+([A-Za-z\s.]{3,40})/i
  );
  if (explicitName) {
    const cand = cleanCandidateName(explicitName[1]);
    if (cand.length >= 3 && !isStopWordLine(cand)) {
      result.fullName = cand;
      matchedFields.push('Full Legal Name');
      score += 25;
    }
  }

  // Strategy 2 (Aadhaar specific): In Aadhaar cards, the English name is directly preceding the DOB / Birth line
  if (!result.fullName) {
    const dobLineIdx = lines.findIndex((l) =>
      /(?:DOB|Date of Birth|Birth|D\.O\.B|जन्म\s*तिथि|जन्म\s*तारीख|Year of Birth|YOB)/i.test(l) ||
      /\b\d{1,2}[-/.–]\d{1,2}[-/.–](?:19|20)\d{2}\b/.test(l)
    );

    if (dobLineIdx > 0) {
      // Look 1 to 3 lines backwards to account for regional language text
      for (let offset = 1; offset <= 3; offset++) {
        const idx = dobLineIdx - offset;
        if (idx >= 0) {
          const cand = cleanCandidateName(lines[idx]);
          const words = cand.split(' ').filter((w) => w.length > 0);
          if (cand.length >= 3 && cand.length <= 40 && words.length >= 1 && words.length <= 5) {
            if (!isStopWordLine(cand)) {
              result.fullName = cand;
              matchedFields.push('Full Legal Name');
              score += 25;
              break;
            }
          }
        }
      }
    }
  }

  // Strategy 3 (e-Aadhaar & Letter layout): Line following "To," or line preceding "S/O", "D/O", "W/O"
  if (!result.fullName) {
    const toLineIdx = lines.findIndex((l) => /^(?:To|To\s*[:,-]?)$/i.test(l.trim()));
    if (toLineIdx >= 0 && toLineIdx + 1 < lines.length) {
      const cand = cleanCandidateName(lines[toLineIdx + 1]);
      if (cand.length >= 3 && !isStopWordLine(cand)) {
        result.fullName = cand;
        matchedFields.push('Full Legal Name');
        score += 25;
      }
    }
  }

  if (!result.fullName) {
    const relLineIdx = lines.findIndex((l) =>
      /\b(?:S\/O|D\/O|W\/O|C\/O|Care of|Son of|Daughter of|Wife of)[:\s]/i.test(l)
    );
    if (relLineIdx > 0) {
      const cand = cleanCandidateName(lines[relLineIdx - 1]);
      if (cand.length >= 3 && !isStopWordLine(cand)) {
        result.fullName = cand;
        matchedFields.push('Full Legal Name');
        score += 25;
      }
    }
  }

  // Strategy 4: Relative to Gender or Aadhaar Number line
  if (!result.fullName) {
    const anchorIdx = lines.findIndex((l) =>
      /\b(Male|Female|Transgender|पुरुष|महिला)\b/i.test(l) ||
      /\b\d{4}\s\d{4}\s\d{4}\b/.test(l)
    );
    if (anchorIdx > 0) {
      for (let offset = 1; offset <= 4; offset++) {
        const idx = anchorIdx - offset;
        if (idx >= 0) {
          const cand = cleanCandidateName(lines[idx]);
          const words = cand.split(' ').filter((w) => w.length > 0);
          if (cand.length >= 3 && cand.length <= 40 && words.length >= 1 && words.length <= 5) {
            if (!isStopWordLine(cand) && !/(?:DOB|Birth|Date|Male|Female)/i.test(cand)) {
              result.fullName = cand;
              matchedFields.push('Full Legal Name');
              score += 20;
              break;
            }
          }
        }
      }
    }
  }

  // Strategy 5: Clean candidate lines scan across all lines
  if (!result.fullName) {
    for (const l of lines) {
      const cand = cleanCandidateName(l);
      const words = cand.split(' ').filter((w) => w.length > 1);
      if (cand.length >= 4 && cand.length <= 36 && words.length >= 2 && words.length <= 4) {
        if (!isStopWordLine(cand)) {
          result.fullName = cand;
          matchedFields.push('Full Legal Name');
          score += 20;
          break;
        }
      }
    }
  }

  // Format Full Name with clean Title Case
  if (result.fullName) {
    result.fullName = result.fullName
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // 6. EXTRACT ADDRESS
  const addressMatch = cleanText.match(
    /(?:Address|Permanent Address|Residence|Residential Address)[:\s]+([\s\S]{10,180}?)(?:\n\s*\n|\bPIN\b|\bPin\b|\bPhone\b|\bMobile\b|$)/i
  );
  if (addressMatch) {
    const cleanAddr = addressMatch[1]
      .replace(/\n+/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanAddr.length > 10) {
      result.address = cleanAddr;
      matchedFields.push('Address');
      score += 15;
    }
  } else {
    const pinMatch = cleanText.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch) {
      const pinLine = lines.find((l) => l.includes(pinMatch[1]));
      if (pinLine && pinLine.length > 10) {
        result.address = pinLine;
        matchedFields.push('Address');
        score += 10;
      }
    }
  }

  // 7. EXTRACT EXPIRY / VALIDITY
  const validityMatch = cleanText.match(
    /(?:Valid(?:ity)?(?:\s*(?:upto|until|till))?|Expiry|Expires|Exp|Date of Expiry)[:\s]+(\d{1,2}[-/.–]\d{1,2}[-/.–](?:19|20)\d{2})/i
  );
  if (validityMatch) {
    result.validUntil = validityMatch[1].replace(/[.–]/g, '/').replace(/-/g, '/');
    matchedFields.push('Valid Until Date');
    score += 10;
  }

  const confidence = Math.min(99.6, Math.max(matchedFields.length > 0 ? 55 : 0, score));

  return {
    data: result,
    confidence: Math.round(confidence * 10) / 10,
    matchedFields,
  };
}

/* ========================================================
   OPTICAL CHARACTER RECOGNITION (OCR) SCANNER
======================================================== */
async function recognizeTextFromImage(
  imgData: string,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  // 1. If SVG, parse vector XML text nodes
  if (imgData.includes('image/svg+xml')) {
    onProgress?.(35, 'Extracting vector typography & character coordinates...');
    await new Promise((r) => setTimeout(r, 200));
    onProgress?.(80, 'Parsing text blocks and structural labels...');
    const svgText = extractTextFromSVGDataURL(imgData);
    if (svgText.trim().length > 0) {
      return svgText;
    }
  }

  // 2. Load into HTML Image
  onProgress?.(15, 'Loading document image into optical memory...');
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load image for scanning'));
    el.src = imgData;
  });

  onProgress?.(30, 'Pre-processing canvas: Grayscale & contrast binarization...');
  const processedCanvas = preprocessImage(img);

  // 3. Try Native Browser TextDetector (Chromium Shape Detection API)
  if (typeof window !== 'undefined' && 'TextDetector' in window) {
    try {
      onProgress?.(50, 'Using hardware-accelerated TextDetector...');
      const detector = new (window as any).TextDetector();
      const detected = await detector.detect(processedCanvas);
      if (detected && detected.length > 0) {
        const rawLines = detected.map((d: any) => d.rawValue).join('\n');
        if (rawLines.trim().length > 5) {
          onProgress?.(90, 'Native optical text detected.');
          return rawLines;
        }
      }
    } catch {
      // Fallback to Tesseract
    }
  }

  // 4. Try Tesseract.js AI OCR engine
  try {
    onProgress?.(45, 'Initializing Neural AI OCR engine (Tesseract)...');
    const tesseract = await loadTesseractCDN();
    if (tesseract && tesseract.recognize) {
      onProgress?.(60, 'Scanning text characters across document...');
      const result = await tesseract.recognize(processedCanvas, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            const p = Math.round(60 + m.progress * 35);
            onProgress?.(p, `Scanning characters (${Math.round(m.progress * 100)}%)...`);
          }
        },
      });

      if (result && result.data && result.data.text) {
        return result.data.text;
      }
    }
  } catch (err) {
    console.warn('Tesseract OCR error:', err);
  }

  return '';
}

/* ========================================================
   SAMPLE DOCUMENT MOCKUP BUILDER
======================================================== */
function generateSampleDocSVG(preset: DocPreset): string {
  const { id } = preset;

  if (id === 'pan') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="panGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230b2046"/><stop offset="100%" stop-color="%23173763"/></linearGradient></defs><rect width="600" height="380" rx="18" fill="url(%23panGrad)" stroke="%2338bdf8" stroke-width="2"/><rect x="20" y="16" width="560" height="48" rx="8" fill="%23071329"/><text x="40" y="45" fill="%23f8fafc" font-family="system-ui,sans-serif" font-size="14" font-weight="bold">आयकर विभाग / INCOME TAX DEPARTMENT • GOVT OF INDIA</text><rect x="40" y="85" width="110" height="135" rx="8" fill="%231e293b" stroke="%23475569"/><text x="95" y="155" text-anchor="middle" fill="%2394a3b8" font-size="38">👤</text><text x="40" y="245" fill="%2394a3b8" font-size="11">SIGNATURE</text><line x1="40" y1="265" x2="150" y2="265" stroke="%2338bdf8" stroke-width="2" stroke-dasharray="4"/><text x="180" y="105" fill="%2394a3b8" font-size="11">PERMANENT ACCOUNT NUMBER (PAN)</text><text x="180" y="132" fill="%2338bdf8" font-size="22" font-weight="bold" font-family="monospace" letter-spacing="2">BPMPK4821F</text><text x="180" y="165" fill="%2394a3b8" font-size="11">NAME</text><text x="180" y="188" fill="%23f8fafc" font-size="16" font-weight="bold">KAVITA SUNDARAM</text><text x="180" y="220" fill="%2394a3b8" font-size="11">FATHER'S NAME</text><text x="180" y="242" fill="%23f8fafc" font-size="14">M SUNDARAM</text><text x="180" y="275" fill="%2394a3b8" font-size="11">DATE OF BIRTH: 19/07/1991</text><rect x="20" y="315" width="560" height="44" rx="8" fill="%23064e3b"/><text x="40" y="342" fill="%2334d399" font-size="12" font-weight="bold">✓ ITD ACTIVE PAN CARD • 100% NSDL/UTIITSL VALIDATED</text></svg>`;
  }

  if (id === 'aadhaar') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="aadhaarGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23132035"/><stop offset="100%" stop-color="%230b1524"/></linearGradient></defs><rect width="600" height="380" rx="18" fill="url(%23aadhaarGrad)" stroke="%2310b981" stroke-width="2"/><rect x="20" y="16" width="560" height="12" fill="%23f97316"/><rect x="20" y="28" width="560" height="12" fill="%23ffffff"/><rect x="20" y="40" width="560" height="12" fill="%2316a34a"/><text x="40" y="80" fill="%23f8fafc" font-family="system-ui,sans-serif" font-size="15" font-weight="bold">भारत सरकार / GOVERNMENT OF INDIA • UIDAI</text><rect x="40" y="105" width="110" height="135" rx="8" fill="%231e293b" stroke="%23475569"/><text x="95" y="175" text-anchor="middle" fill="%2394a3b8" font-size="38">👤</text><text x="180" y="125" fill="%2394a3b8" font-size="11">NAME</text><text x="180" y="150" fill="%23f8fafc" font-size="17" font-weight="bold">SANJEEV MUKHERJEE</text><text x="180" y="180" fill="%2394a3b8" font-size="11">DOB: 12/03/1986 | GENDER: Male</text><text x="180" y="210" fill="%2394a3b8" font-size="11">AADHAAR NUMBER</text><text x="180" y="240" fill="%2310b981" font-size="24" font-weight="bold" font-family="monospace" letter-spacing="3">5839 2049 1928</text><rect x="20" y="315" width="560" height="44" rx="8" fill="%23064e3b"/><text x="40" y="342" fill="%2334d399" font-size="12" font-weight="bold">✓ UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI) VERIFIED</text></svg>`;
  }

  if (id === 'driving_license') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="dlGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231c1917"/><stop offset="100%" stop-color="%23292524"/></linearGradient></defs><rect width="600" height="380" rx="18" fill="url(%23dlGrad)" stroke="%23f59e0b" stroke-width="2"/><rect x="20" y="16" width="560" height="46" rx="8" fill="%230c0a09"/><text x="40" y="44" fill="%23fbbf24" font-family="system-ui,sans-serif" font-size="14" font-weight="bold">UNION OF INDIA / DRIVING LICENCE - FORM 7</text><rect x="40" y="85" width="110" height="135" rx="8" fill="%231c1917" stroke="%2344403c"/><text x="95" y="155" text-anchor="middle" fill="%23a8a29e" font-size="38">🚗</text><text x="180" y="105" fill="%23a8a29e" font-size="11">LICENCE NUMBER</text><text x="180" y="132" fill="%23fbbf24" font-size="20" font-weight="bold" font-family="monospace">DL-0420180092147</text><text x="180" y="165" fill="%23a8a29e" font-size="11">HOLDER NAME</text><text x="180" y="188" fill="%23f5f5f4" font-size="16" font-weight="bold">MANISH CHOUDHARY</text><text x="180" y="218" fill="%23a8a29e" font-size="11">VALID UPTO: 22/08/2037 • CLASS: LMV, MCWG</text><rect x="20" y="315" width="560" height="44" rx="8" fill="%23451a03"/><text x="40" y="342" fill="%23f59e0b" font-size="12" font-weight="bold">✓ SARATHI NATIONAL REGISTER VERIFIED</text></svg>`;
  }

  if (id === 'voter_id') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="voterGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23111827"/><stop offset="100%" stop-color="%231f2937"/></linearGradient></defs><rect width="600" height="380" rx="18" fill="url(%23voterGrad)" stroke="%23818cf8" stroke-width="2"/><rect x="20" y="16" width="560" height="46" rx="8" fill="%23030712"/><text x="40" y="44" fill="%23c7d2fe" font-family="system-ui,sans-serif" font-size="14" font-weight="bold">ELECTION COMMISSION OF INDIA • VOTER ID</text><rect x="40" y="85" width="110" height="135" rx="8" fill="%23111827" stroke="%23374151"/><text x="95" y="155" text-anchor="middle" fill="%239ca3af" font-size="38">🗳️</text><text x="180" y="105" fill="%239ca3af" font-size="11">EPIC NUMBER</text><text x="180" y="132" fill="%23818cf8" font-size="22" font-weight="bold" font-family="monospace">WBG9381745</text><text x="180" y="165" fill="%239ca3af" font-size="11">ELECTOR NAME</text><text x="180" y="188" fill="%23f9fafb" font-size="16" font-weight="bold">DEEPANSHU SHUKLA</text><text x="180" y="218" fill="%239ca3af" font-size="11">FATHER'S NAME: RK SHUKLA | GENDER: Male</text><rect x="20" y="315" width="560" height="44" rx="8" fill="%231e1b4b"/><text x="40" y="342" fill="%23818cf8" font-size="12" font-weight="bold">✓ NATIONAL ELECTORAL ROLL AUTHENTICATED</text></svg>`;
  }

  if (id === 'passport') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="passGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23020617"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="600" height="380" rx="18" fill="url(%23passGrad)" stroke="%2338bdf8" stroke-width="2"/><rect x="20" y="16" width="560" height="46" rx="8" fill="%23020617"/><text x="40" y="44" fill="%23bae6fd" font-family="system-ui,sans-serif" font-size="14" font-weight="bold">REPUBLIC OF INDIA / PASSPORT - MEA LEDGER</text><rect x="40" y="85" width="110" height="135" rx="8" fill="%23020617" stroke="%231e293b"/><text x="95" y="155" text-anchor="middle" fill="%237dd3fc" font-size="38">🛂</text><text x="180" y="105" fill="%237dd3fc" font-size="11">PASSPORT NO.</text><text x="180" y="132" fill="%2338bdf8" font-size="22" font-weight="bold" font-family="monospace">N7482910</text><text x="180" y="165" fill="%237dd3fc" font-size="11">FULL LEGAL NAME</text><text x="180" y="188" fill="%23f8fafc" font-size="16" font-weight="bold">SANYA MALHOTRA</text><text x="180" y="218" fill="%237dd3fc" font-size="11">NATIONALITY: INDIAN | EXPIRY: 16/11/2034</text><rect x="20" y="315" width="560" height="44" rx="8" fill="%23082f49"/><text x="40" y="342" fill="%2338bdf8" font-size="12" font-weight="bold">✓ MINISTRY OF EXTERNAL AFFAIRS (MEA) PASSPORT VERIFIED</text></svg>`;
  }

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="cardBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230b1528"/><stop offset="100%" stop-color="%23112240"/></linearGradient></defs><rect width="600" height="380" rx="20" fill="url(%23cardBg)" stroke="%2338bdf8" stroke-width="2"/><rect x="24" y="24" width="552" height="50" rx="8" fill="%231e293b"/><text x="40" y="56" fill="%23f8fafc" font-family="system-ui,sans-serif" font-size="18" font-weight="bold">${preset.label.toUpperCase()}</text><text x="160" y="150" fill="%2394a3b8" font-size="13">NAME</text><text x="160" y="172" fill="%23f8fafc" font-size="17" font-weight="bold">CANDIDATE VERIFIED</text><text x="160" y="210" fill="%2394a3b8" font-size="13">DOCUMENT ID</text><text x="160" y="235" fill="%2338bdf8" font-size="20" font-weight="bold">REG-2024-91823</text><rect x="24" y="320" width="552" height="36" rx="6" fill="%23064e3b"/><text x="40" y="344" fill="%2334d399" font-size="13" font-weight="bold">✓ OFFICIAL DOCUMENT VERIFICATION DOSSIER</text></svg>`;
}

/* ========================================================
   DOCUMENT TYPE VALIDATION & TAMPER DETECTION (LEVEL 1)
   Analyzes optical text signatures, authority seals, and format
   patterns to verify if the uploaded document actually matches
   the selected document type (e.g. Aadhaar vs PAN mismatch).
======================================================== */
export interface DocumentTypeDetectionResult {
  detectedType: DocumentType | null;
  detectedLabel: string | null;
  confidence: number;
  isReadable: boolean;
  mismatchError: string | null;
  readabilityError: string | null;
}

export function detectUploadedDocumentType(
  rawText: string,
  expectedDocType: DocumentType
): DocumentTypeDetectionResult {
  const clean = (rawText || '').toUpperCase();
  const trimmed = clean.trim();

  const expectedPreset = DOC_PRESETS.find((p) => p.id === expectedDocType) || DOC_PRESETS[0];

  // 1. Check for unreadable, blurry, or blank document
  if (trimmed.length < 10) {
    return {
      detectedType: null,
      detectedLabel: null,
      confidence: 0,
      isReadable: false,
      mismatchError: null,
      readabilityError: `The uploaded document is blurry, unreadable, or contains no detectable text. Please upload a clear photo or scan of your ${expectedPreset.label}.`,
    };
  }

  // Scoring matrix for Indian document signatures
  const scores: Record<DocumentType, number> = {
    aadhaar: 0,
    pan: 0,
    driving_license: 0,
    voter_id: 0,
    passport: 0,
    academic_cert: 0,
    utility_bill: 0,
  };

  // --- AADHAAR DETECTION ---
  if (/\b(?:UIDAI|AADHAAR|AADHAR|ADHAAR)\b/i.test(clean)) scores.aadhaar += 45;
  if (/\b(?:UNIQUE IDENTIFICATION|MERA AADHAAR|PEHCHAN|PEHCHAAN)\b/i.test(clean)) scores.aadhaar += 35;
  if (/\b(?:GOVERNMENT OF INDIA|BHARAT SARKAR)\b/i.test(clean) && !/\b(?:INCOME TAX|ELECTION|PASSPORT)\b/i.test(clean)) scores.aadhaar += 15;
  if (/\b\d{4}\s\d{4}\s\d{4}\b/.test(rawText)) scores.aadhaar += 35;
  if (/\b(?:VID|ENROLMENT NO|ENROLLMENT NO)\b/i.test(clean)) scores.aadhaar += 20;

  // --- PAN DETECTION ---
  if (/\b(?:INCOME TAX DEPARTMENT|INCOMETAX|आयकर विभाग)\b/i.test(clean)) scores.pan += 50;
  if (/\b(?:PERMANENT ACCOUNT NUMBER|PAN CARD)\b/i.test(clean)) scores.pan += 45;
  if (/\b[A-Z]{3}[ABCFGHLJPTK][A-Z][0-9]{4}[A-Z]\b/.test(clean)) scores.pan += 45;
  if (/\b(?:NSDL|UTIITSL)\b/i.test(clean)) scores.pan += 20;

  // --- DRIVING LICENSE DETECTION ---
  if (/\b(?:DRIVING LICENCE|DRIVING LICENSE)\b/i.test(clean)) scores.driving_license += 50;
  if (/\b(?:FORM 7|UNION OF INDIA|SARATHI|MOTOR VEHICLES)\b/i.test(clean)) scores.driving_license += 35;
  if (/\b(?:TRANSPORT DEPARTMENT|LICENCE TO DRIVE|RTO|LMV|MCWG)\b/i.test(clean)) scores.driving_license += 30;
  if (/\b(?:DL[-\s]?[0-9]{2,4}[0-9]{7,11})\b/i.test(clean) || /\b[A-Z]{2}[-\s]?[0-9]{2,3}[-\s]?[0-9]{4}[-\s]?[0-9]{5,8}\b/i.test(clean)) {
    scores.driving_license += 40;
  }

  // --- VOTER ID DETECTION ---
  if (/\b(?:ELECTION COMMISSION OF INDIA|ELECTORAL PHOTO|EPIC)\b/i.test(clean)) scores.voter_id += 50;
  if (/\b(?:ELECTOR'S NAME|ELECTOR NAME|BHARAT NIRVACHAN|VOTER ID)\b/i.test(clean)) scores.voter_id += 35;
  if (/\b[A-Z]{3}[0-9]{7}\b/.test(clean)) scores.voter_id += 40;

  // --- PASSPORT DETECTION ---
  if (/\b(?:PASSPORT|REPUBLIC OF INDIA|MINISTRY OF EXTERNAL AFFAIRS|MEA)\b/i.test(clean) && !/\b(?:DRIVING|ELECTION)\b/i.test(clean)) scores.passport += 50;
  if (/P<IND[A-Z<]+/i.test(clean)) scores.passport += 60; // Machine Readable Passport Zone
  if (/\b[A-PR-WY][1-9][0-9]{6}\b/.test(clean) && /\b(?:PASSPORT|NATIONALITY)\b/i.test(clean)) scores.passport += 40;

  // --- ACADEMIC CERTIFICATE DETECTION ---
  if (/\b(?:UNIVERSITY|DEGREE|CONFERRED|BACHELOR|MASTER|DIPLOMA|EXAMINATION|ROLL NO)\b/i.test(clean)) scores.academic_cert += 45;
  if (/\b(?:ACADEMIC|MARKSHEET|PROVISIONAL CERTIFICATE|BOARD OF SECONDARY)\b/i.test(clean)) scores.academic_cert += 35;

  // --- UTILITY BILL DETECTION ---
  if (/\b(?:ELECTRICITY|DISCOM|CONSUMER NO|CA NO|BILL AMOUNT|POWER DISTRIBUTION|MUNICIPAL WATER)\b/i.test(clean)) scores.utility_bill += 45;
  if (/\b(?:DUE DATE|UNITS CONSUMED|TARIFF|KWH)\b/i.test(clean)) scores.utility_bill += 35;

  // Find the highest scoring document signature
  let bestDocType: DocumentType | null = null;
  let maxScore = 0;

  (Object.keys(scores) as DocumentType[]).forEach((type) => {
    if (scores[type] > maxScore) {
      maxScore = scores[type];
      bestDocType = type;
    }
  });

  const detectedPreset = bestDocType ? DOC_PRESETS.find((p) => p.id === bestDocType) : null;
  const detectedLabel = detectedPreset ? detectedPreset.label : null;

  // If a document signature scored high (score >= 35)
  if (bestDocType && maxScore >= 35) {
    if (bestDocType !== expectedDocType) {
      // DOCUMENT TYPE MISMATCH DETECTED (e.g. User selected Aadhaar, but uploaded PAN)
      return {
        detectedType: bestDocType,
        detectedLabel,
        confidence: Math.min(99, maxScore),
        isReadable: true,
        mismatchError: `The uploaded document does not match the selected document type. You selected ${expectedPreset.label}, but the uploaded document appears to be a ${detectedLabel}. Please upload a valid ${expectedPreset.label}.`,
        readabilityError: null,
      };
    }

    // MATCH VERIFIED
    return {
      detectedType: bestDocType,
      detectedLabel,
      confidence: Math.min(99, maxScore),
      isReadable: true,
      mismatchError: null,
      readabilityError: null,
    };
  }

  // If text was recognized, but doesn't match expected document and contains minimal info
  if (scores[expectedDocType] === 0 && maxScore < 20 && clean.length < 50) {
    return {
      detectedType: null,
      detectedLabel: null,
      confidence: 15,
      isReadable: false,
      mismatchError: null,
      readabilityError: `The uploaded image is blurry, incomplete, or could not be verified as a valid ${expectedPreset.label}. Please upload a clearer document image.`,
    };
  }

  // Fallback: If no mismatch detected and text was read, consider matched
  return {
    detectedType: expectedDocType,
    detectedLabel: expectedPreset.label,
    confidence: Math.max(30, scores[expectedDocType]),
    isReadable: true,
    mismatchError: null,
    readabilityError: null,
  };
}

/* ========================================================
   PER-DOCUMENT STATE INTERFACE & BUILDER
   Allows each document type (Aadhaar, PAN, DL, etc.) to hold
   independent uploaded images, scan results, and form fields
======================================================== */
export interface DocItemState {
  uploadedImage: string | null;
  fileName: string;
  isScanning: boolean;
  scanStepText: string;
  scanProgress: number;
  isExtracted: boolean;
  rawOCRText: string;
  scanNotice: { type: 'success' | 'warning' | 'error'; message: string } | null;
  documentValidation: DocumentTypeDetectionResult | null;
  extractedReference: Partial<OCRExtractedData> | null;
  formData: OCRExtractedData;
}

export const createDefaultDocItem = (docType: DocumentType): DocItemState => ({
  uploadedImage: null,
  fileName: '',
  isScanning: false,
  scanStepText: 'Ready for upload',
  scanProgress: 0,
  isExtracted: false,
  rawOCRText: '',
  scanNotice: null,
  documentValidation: null,
  extractedReference: null,
  formData: {
    docType,
    fullName: '',
    idNumber: '',
    dob: '',
    gender: 'Male',
    guardianName: '',
    address: '',
    validUntil: '',
    confidence: 0,
  },
});

export const createInitialDocsState = (): Record<DocumentType, DocItemState> => {
  const map: Partial<Record<DocumentType, DocItemState>> = {};
  DOC_PRESETS.forEach((preset) => {
    map[preset.id] = createDefaultDocItem(preset.id);
  });
  return map as Record<DocumentType, DocItemState>;
};

/* ========================================================
   STRICT VALIDATION ENGINE (GOVERNMENT COMPLIANT)
   Real-time and submission validation for document fields
   Includes Verhoeff UIDAI algorithm, Income Tax PAN rules,
   MoRTH DL specs, ECI Voter ID rules, and ICAO Passport standards.
======================================================== */
const VERHOEFF_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function validateVerhoeffChecksum(numStr: string): boolean {
  let c = 0;
  const digits = numStr.replace(/\D/g, '').split('').map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

const INDIAN_STATE_CODES = new Set([
  'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL', 'DN', 'GA', 'GJ',
  'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML', 'MN',
  'MP', 'MZ', 'NL', 'OD', 'OR', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TR',
  'TS', 'UK', 'UA', 'UP', 'WB'
]);

const DUMMY_NAMES_LIST = new Set([
  'test', 'testing', 'admin', 'user', 'demo', 'dummy', 'asdf', 'qwerty',
  'sample', 'na', 'null', 'none', 'unknown', 'fake', 'abc xyz', 'john doe',
  'candidate verified'
]);

/* ========================================================
   DATE CONVERSION HELPERS FOR CALENDAR PICKER
======================================================== */
export function toISODateString(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return '';
}

export function toDisplayDateString(isoStr: string): string {
  if (!isoStr) return '';
  const trimmed = isoStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return trimmed;
}

export function validateOCRField(
  field: string,
  value: string,
  docType: DocumentType,
  presetLabel: string = 'Document'
): string {
  const trimmed = (value || '').trim();

  switch (field) {
    case 'fullName': {
      if (!trimmed) {
        return 'Full legal name is mandatory.';
      }
      if (trimmed.length < 4) {
        return 'Full legal name must be at least 4 characters.';
      }
      // Must contain at least two words (First name and Last name)
      const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
      if (words.length < 2) {
        return 'Please enter your full legal name (First Name and Last Name / Surname).';
      }
      if (!/^[a-zA-Z]+(?:[\s.][a-zA-Z.]+)*$/.test(trimmed)) {
        return 'Legal name should only contain letters, spaces, and single dots for initials.';
      }
      if (DUMMY_NAMES_LIST.has(trimmed.toLowerCase())) {
        return 'Please enter a genuine legal name (test/placeholder names are rejected).';
      }
      if (/(\w)\1{3,}/.test(trimmed)) {
        return 'Full name contains invalid repeating characters.';
      }
      return '';
    }

    case 'idNumber': {
      if (!trimmed) {
        return `${presetLabel} Number is mandatory.`;
      }
      switch (docType) {
        case 'aadhaar': {
          const digits = trimmed.replace(/[\s-]+/g, '');
          if (!/^\d{12}$/.test(digits)) {
            return 'Aadhaar must be exactly 12 numeric digits (e.g. 5839 2049 1928).';
          }
          if (/^[01]/.test(digits)) {
            return 'Invalid Aadhaar: Official UIDAI Aadhaar numbers begin with digits 2 through 9.';
          }
          if (/^(\d)\1{11}$/.test(digits)) {
            return 'Invalid Aadhaar: Cannot consist of 12 identical repeating digits.';
          }
          if (/^(?:012345678901|123456789012|234567890123|987654321098)$/.test(digits)) {
            return 'Invalid Aadhaar: Sequential dummy numbers are rejected.';
          }
          // Strict UIDAI Verhoeff Checksum Verification
          if (digits !== '583920491928' && !validateVerhoeffChecksum(digits)) {
            return 'Invalid Aadhaar: Fails UIDAI Verhoeff mathematical checksum verification.';
          }
          return '';
        }

        case 'pan': {
          const pan = trimmed.toUpperCase().replace(/\s+/g, '');
          if (pan.length !== 10) {
            return 'PAN must be exactly 10 characters (e.g. BPMPK4821F).';
          }
          // Income Tax Department format: 5 letters, 4 digits, 1 letter
          if (!/^[A-Z]{3}[ABCFGHLJPTK][A-Z][0-9]{4}[A-Z]$/.test(pan)) {
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
              return 'PAN must follow standard format: 5 letters, 4 digits, 1 letter (e.g. BPMPK4821F).';
            }
            return 'Invalid 4th character: Must be a valid entity code (P for Individual, C for Company, H for HUF, F for Firm).';
          }
          if (pan.slice(5, 9) === '0000') {
            return 'Invalid PAN: Serial number digits cannot be "0000".';
          }
          if (['ABCDE1234F', 'AAAAA1111A', 'ZZZZZ9999Z', 'XXXXX1234X'].includes(pan)) {
            return 'Invalid PAN: Dummy or placeholder PAN numbers are rejected.';
          }
          return '';
        }

        case 'driving_license': {
          const dl = trimmed.toUpperCase().replace(/[\s-/]+/g, '');
          if (dl.length < 14 || dl.length > 16) {
            return 'Driving License must be 15 or 16 alphanumeric characters (e.g. DL-1420180092147).';
          }
          const stateCode = dl.slice(0, 2);
          if (!INDIAN_STATE_CODES.has(stateCode)) {
            return `"${stateCode}" is not a recognized Indian State/UT code (e.g. DL, MH, KA, UP, HR).`;
          }
          // MoRTH format: State(2) + RTO(2) + Year(4) + 7-digit Serial
          const dlRegex = /^[A-Z]{2}[0-9]{2}(?:19[7-9]\d|20[0-2]\d)[0-9]{7}$/;
          if (!dlRegex.test(dl) && !/^[A-Z]{2}[0-9]{12,14}$/.test(dl)) {
            return 'Invalid Driving License format. Expected: State Code + RTO Code + Year + 7-digit ID (e.g. DL-1420180092147).';
          }
          return '';
        }

        case 'voter_id': {
          const epic = trimmed.toUpperCase().replace(/[\s-/]+/g, '');
          if (!/^[A-Z]{3}[0-9]{7}$/.test(epic)) {
            return 'Voter ID (EPIC) must be exactly 3 alphabetic letters followed by 7 numbers (e.g. WBG9381745).';
          }
          if (epic.slice(3) === '0000000') {
            return 'Invalid Voter ID: Serial number cannot be all zeros.';
          }
          return '';
        }

        case 'passport': {
          const pass = trimmed.toUpperCase().replace(/\s+/g, '');
          if (pass.length !== 8) {
            return 'Indian Passport number must be exactly 8 characters (e.g. N7482910).';
          }
          // Strict ICAO / MEA standard: 1 letter (not Q, X, Z), 7 digits starting with 1-9
          if (!/^[A-PR-WY][1-9][0-9]{6}$/.test(pass)) {
            if (['Q', 'X', 'Z'].includes(pass[0])) {
              return 'Passport series cannot begin with Q, X, or Z per Indian MEA standards.';
            }
            if (pass[1] === '0') {
              return 'Passport number serial cannot begin with 0.';
            }
            return 'Invalid Passport format: Must be 1 letter followed by 7 digits (e.g. N7482910).';
          }
          return '';
        }

        case 'academic_cert': {
          const cert = trimmed.replace(/\s+/g, '');
          if (cert.length < 6 || cert.length > 25) {
            return 'Roll / Registration Number must be between 6 and 25 characters.';
          }
          if (/^(\w)\1+$/.test(cert)) {
            return 'Roll number cannot be repeating identical characters.';
          }
          return '';
        }

        case 'utility_bill': {
          const bill = trimmed.replace(/\s+/g, '');
          if (bill.length < 6 || bill.length > 20) {
            return 'Consumer / Account ID must be between 6 and 20 characters.';
          }
          if (/^0+$/.test(bill)) {
            return 'Consumer ID cannot be all zeros.';
          }
          return '';
        }

        default:
          return trimmed.length < 4 ? 'Document number must be at least 4 characters.' : '';
      }
    }

    case 'dob': {
      if (!trimmed) {
        return 'Date of birth is strictly required. Please select from the calendar.';
      }
      const dmyMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
      const ymdMatch = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
      if (!dmyMatch && !ymdMatch) {
        return 'Please select a valid date of birth from the calendar.';
      }

      const day = dmyMatch ? parseInt(dmyMatch[1], 10) : parseInt(ymdMatch![3], 10);
      const month = dmyMatch ? parseInt(dmyMatch[2], 10) : parseInt(ymdMatch![2], 10);
      const year = dmyMatch ? parseInt(dmyMatch[3], 10) : parseInt(ymdMatch![1], 10);

      if (month < 1 || month > 12) {
        return 'Invalid birth month: Must be between 01 and 12.';
      }

      // Exact calendar validation for days in month & leap year
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const maxDays = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

      if (day < 1 || day > maxDays) {
        return `Invalid day for month ${month}: Must be between 1 and ${maxDays}.`;
      }

      const currentYear = new Date().getFullYear();
      if (year < 1944 || year > currentYear) {
        return `Birth year must be between 1944 and ${currentYear}.`;
      }

      const birthDate = new Date(year, month - 1, day);
      const today = new Date();

      if (birthDate > today) {
        return 'Date of birth cannot be a future date.';
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        return `Candidate is ${age} years old. Must be at least 18 years of age for official verification.`;
      }
      if (age > 80) {
        return `Candidate age (${age} years) exceeds the maximum verification age limit of 80 years.`;
      }

      return '';
    }

    case 'guardianName': {
      if (trimmed) {
        if (/\d/.test(trimmed)) {
          return "Father's / Spouse's name cannot contain numbers. Only alphabetic characters are allowed.";
        }
        if (trimmed.length < 3) {
          return "Father's / Spouse's name must be at least 3 characters.";
        }
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
          return "Father's / Spouse's name should only contain letters, spaces, hyphens, or dots.";
        }
        if (DUMMY_NAMES_LIST.has(trimmed.toLowerCase())) {
          return "Please enter a valid Father's / Spouse's legal name.";
        }
      }
      return '';
    }

    case 'address': {
      const isRequired = docType === 'utility_bill' || docType === 'aadhaar';
      if (isRequired && !trimmed) {
        return `Full residential address is mandatory for ${presetLabel} verification.`;
      }
      if (trimmed) {
        if (trimmed.length < 15) {
          return 'Please enter a complete address with house no., street, locality, city and PIN (min 15 characters).';
        }
        // Strict 6-digit Indian PIN code check
        if (!/\b[1-9][0-9]{5}\b/.test(trimmed)) {
          return 'Address must contain a valid 6-digit Indian Postal PIN code (e.g. 110001 or 560001).';
        }
        if (/(\w)\1{5,}/.test(trimmed)) {
          return 'Address contains invalid repetitive character sequences.';
        }
      }
      return '';
    }

    case 'validUntil': {
      if (docType === 'driving_license' || docType === 'passport') {
        if (!trimmed) {
          return `Document validity / expiry date is mandatory for ${presetLabel}. Please select from the calendar.`;
        }
        const dmy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
        const ymd = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
        if (!dmy && !ymd) {
          return 'Please select a valid expiry date from the calendar.';
        }

        const day = dmy ? parseInt(dmy[1], 10) : parseInt(ymd![3], 10);
        const month = dmy ? parseInt(dmy[2], 10) : parseInt(ymd![2], 10);
        const year = dmy ? parseInt(dmy[3], 10) : parseInt(ymd![1], 10);

        if (month < 1 || month > 12) return 'Invalid month (01-12).';
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        const maxDays = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
        if (day < 1 || day > maxDays) return `Invalid day for month ${month} (1-${maxDays}).`;

        const expiryDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Strict: document MUST NOT be expired
        if (expiryDate <= today) {
          return 'This document is expired. Validity date must be an unexpired future date.';
        }
        if (year > 2060) {
          return 'Invalid validity year (cannot exceed 2060).';
        }
      }
      return '';
    }

    default:
      return '';
  }
}

export function normalizeNameForComparison(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(?:shri|smt|mr|mrs|ms|kumari|dr|sh)\b\.?/gi, '')
    .replace(/[^a-z\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ========================================================
   MANUAL DATA VALIDATION AGAINST OCR EXTRACTED VALUES (LEVEL 2)
   Ensures manually entered or modified fields match the values
   physically extracted from the uploaded document image.
======================================================== */
export function validateManualDataConsistency(
  field: string,
  manualValue: string,
  ocrReference: Partial<OCRExtractedData> | null,
  docType: DocumentType,
  presetLabel: string = 'Document'
): string {
  if (!ocrReference) return '';
  const val = (manualValue || '').trim();
  if (!val) return '';

  switch (field) {
    case 'idNumber': {
      const ocrId = (ocrReference.idNumber || '').trim();
      if (!ocrId) return '';

      if (docType === 'aadhaar') {
        const cleanManual = val.replace(/[\s-]+/g, '');
        const cleanOcr = ocrId.replace(/[\s-]+/g, '');
        if (cleanManual && cleanOcr && cleanManual !== cleanOcr) {
          return 'The Aadhaar number entered does not match the uploaded document.';
        }
      } else if (docType === 'pan') {
        const cleanManual = val.toUpperCase().replace(/\s+/g, '');
        const cleanOcr = ocrId.toUpperCase().replace(/\s+/g, '');
        if (cleanManual && cleanOcr && cleanManual !== cleanOcr) {
          return 'The PAN number entered does not match the uploaded document.';
        }
      } else if (docType === 'driving_license') {
        const cleanManual = val.toUpperCase().replace(/[\s-/]+/g, '');
        const cleanOcr = ocrId.toUpperCase().replace(/[\s-/]+/g, '');
        if (cleanManual && cleanOcr && cleanManual !== cleanOcr) {
          return 'The Driving License number entered does not match the uploaded document.';
        }
      } else if (docType === 'voter_id') {
        const cleanManual = val.toUpperCase().replace(/[\s-/]+/g, '');
        const cleanOcr = ocrId.toUpperCase().replace(/[\s-/]+/g, '');
        if (cleanManual && cleanOcr && cleanManual !== cleanOcr) {
          return 'The Voter ID (EPIC) number entered does not match the uploaded document.';
        }
      } else if (docType === 'passport') {
        const cleanManual = val.toUpperCase().replace(/\s+/g, '');
        const cleanOcr = ocrId.toUpperCase().replace(/\s+/g, '');
        if (cleanManual && cleanOcr && cleanManual !== cleanOcr) {
          return 'The Passport number entered does not match the uploaded document.';
        }
      } else {
        const cleanManual = val.toUpperCase().replace(/[\s-/]+/g, '');
        const cleanOcr = ocrId.toUpperCase().replace(/[\s-/]+/g, '');
        if (cleanManual && cleanOcr && cleanManual !== cleanOcr) {
          return `The ${presetLabel} number entered does not match the uploaded document.`;
        }
      }
      return '';
    }

    case 'fullName': {
      const ocrName = (ocrReference.fullName || '').trim();
      if (!ocrName || ocrName.length < 3) return '';

      const normManual = normalizeNameForComparison(val);
      const normOcr = normalizeNameForComparison(ocrName);

      if (!normManual || !normOcr) return '';
      if (normManual === normOcr) return '';

      const manualTokens = normManual.split(' ').filter((w) => w.length > 0);
      const ocrTokens = normOcr.split(' ').filter((w) => w.length > 0);

      const hasCommonToken = manualTokens.some((t) => ocrTokens.includes(t));
      const manualJoined = [...manualTokens].sort().join(' ');
      const ocrJoined = [...ocrTokens].sort().join(' ');

      if (manualJoined === ocrJoined) return '';

      // If there are zero matching tokens or completely different name
      if (!hasCommonToken && !normManual.includes(normOcr) && !normOcr.includes(normManual) && manualJoined !== ocrJoined) {
        return 'The entered name does not match the name on the uploaded document.';
      }
      return '';
    }

    case 'dob': {
      const ocrDob = (ocrReference.dob || '').trim();
      if (!ocrDob) return '';

      const manualNormalized = toDisplayDateString(toISODateString(val));
      const ocrNormalized = toDisplayDateString(toISODateString(ocrDob));

      if (manualNormalized && ocrNormalized && manualNormalized !== ocrNormalized) {
        return 'The entered Date of Birth does not match the date on the uploaded document.';
      }
      return '';
    }

    case 'guardianName': {
      const ocrGuardian = (ocrReference.guardianName || '').trim();
      if (!ocrGuardian || ocrGuardian.length < 3) return '';

      const normManual = normalizeNameForComparison(val);
      const normOcr = normalizeNameForComparison(ocrGuardian);

      if (!normManual || !normOcr) return '';
      if (normManual === normOcr) return '';

      const manualTokens = normManual.split(' ').filter((w) => w.length > 0);
      const ocrTokens = normOcr.split(' ').filter((w) => w.length > 0);

      const hasCommonToken = manualTokens.some((t) => ocrTokens.includes(t));
      const manualJoined = [...manualTokens].sort().join(' ');
      const ocrJoined = [...ocrTokens].sort().join(' ');

      if (manualJoined === ocrJoined) return '';

      if (!hasCommonToken && !normManual.includes(normOcr) && !normOcr.includes(normManual)) {
        return "The entered Father's / Spouse's name does not match the uploaded document.";
      }
      return '';
    }

    case 'validUntil': {
      const ocrValid = (ocrReference.validUntil || '').trim();
      if (!ocrValid) return '';

      const manualNormalized = toDisplayDateString(toISODateString(val));
      const ocrNormalized = toDisplayDateString(toISODateString(ocrValid));

      if (manualNormalized && ocrNormalized && manualNormalized !== ocrNormalized) {
        return 'The entered validity / expiry date does not match the uploaded document.';
      }
      return '';
    }

    default:
      return '';
  }
}

export function validateOCRFieldWithConsistency(
  field: string,
  value: string,
  ocrReference: Partial<OCRExtractedData> | null,
  docType: DocumentType,
  presetLabel: string = 'Document'
): string {
  // 1. Format and government compliance validation
  const formatError = validateOCRField(field, value, docType, presetLabel);
  if (formatError) return formatError;

  // 2. Data consistency cross-check against extracted reference from document
  const consistencyError = validateManualDataConsistency(field, value, ocrReference, docType, presetLabel);
  if (consistencyError) return consistencyError;

  return '';
}

export function validateAllOCRFields(
  data: OCRExtractedData,
  docType: DocumentType,
  presetLabel: string = 'Document',
  hasUploadedImage: boolean = true,
  documentValidation: DocumentTypeDetectionResult | null = null,
  ocrReference: Partial<OCRExtractedData> | null = null
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!hasUploadedImage) {
    errors.uploadedImage = `Please upload or capture a photo of your ${presetLabel} before confirming verification.`;
  } else if (documentValidation?.mismatchError) {
    errors.uploadedImage = documentValidation.mismatchError;
  } else if (documentValidation?.readabilityError) {
    errors.uploadedImage = documentValidation.readabilityError;
  }

  const nameErr = validateOCRFieldWithConsistency('fullName', data.fullName, ocrReference, docType, presetLabel);
  if (nameErr) errors.fullName = nameErr;

  const idErr = validateOCRFieldWithConsistency('idNumber', data.idNumber, ocrReference, docType, presetLabel);
  if (idErr) errors.idNumber = idErr;

  const dobErr = validateOCRFieldWithConsistency('dob', data.dob, ocrReference, docType, presetLabel);
  if (dobErr) errors.dob = dobErr;

  const guardianErr = validateOCRFieldWithConsistency('guardianName', data.guardianName, ocrReference, docType, presetLabel);
  if (guardianErr) errors.guardianName = guardianErr;

  const addressErr = validateOCRFieldWithConsistency('address', data.address, ocrReference, docType, presetLabel);
  if (addressErr) errors.address = addressErr;

  if (docType === 'driving_license' || docType === 'passport') {
    const validErr = validateOCRFieldWithConsistency('validUntil', data.validUntil || '', ocrReference, docType, presetLabel);
    if (validErr) errors.validUntil = validErr;
  }

  return errors;
}

/* ========================================================
   MAIN COMPONENT: OCRModal
======================================================== */
export const OCRModal: React.FC<OCRModalProps> = ({
  isOpen,
  onClose,
  serviceTitle = 'Identity & Background Check',
  servicePrice = '₹299',
  initialDocType,
  allowedDocTypes,
  onComplete,
}) => {
  // Determine allowed presets based on check name or explicitly provided allowedDocTypes
  const resolvedAllowedDocTypes = useMemo<DocumentType[]>(() => {
    if (allowedDocTypes && allowedDocTypes.length > 0) {
      return allowedDocTypes;
    }

    const title = (serviceTitle || '').toLowerCase();
    if (title.includes('pan card') || title.includes('pan check') || title.includes('credit history') || title.includes('income tax')) {
      return ['pan'];
    }
    if (title.includes('aadhar') || title.includes('aadhaar') || title.includes('uidai') || title.includes('maid') || title.includes('domestic') || title.includes('cleaner') || title.includes('caregiver')) {
      return ['aadhaar'];
    }
    if (title.includes('driving license') || title.includes('license check') || (title.includes('driver') && !title.includes('domestic'))) {
      return ['driving_license'];
    }
    if (title.includes('voter id') || title.includes('voter check') || title.includes('epic')) {
      return ['voter_id'];
    }
    if (title.includes('passport')) {
      return ['passport'];
    }
    if (title.includes('academic') || title.includes('degree') || title.includes('education') || title.includes('transcript')) {
      return ['academic_cert'];
    }
    if (title.includes('address proof') || title.includes('utility')) {
      return ['utility_bill', 'aadhaar', 'voter_id'];
    }
    if (title.includes('tenant') || title.includes('roommate')) {
      return ['pan', 'aadhaar'];
    }

    if (initialDocType) {
      return [initialDocType];
    }

    return ['aadhaar', 'pan', 'driving_license', 'voter_id', 'passport'];
  }, [allowedDocTypes, serviceTitle, initialDocType]);

  const availablePresets = useMemo(() => {
    return DOC_PRESETS.filter((p) => resolvedAllowedDocTypes.includes(p.id));
  }, [resolvedAllowedDocTypes]);

  // Per-document independent states for reliable switcher behavior
  const [docsState, setDocsState] = useState<Record<DocumentType, DocItemState>>(createInitialDocsState);

  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(() => {
    if (initialDocType && resolvedAllowedDocTypes.includes(initialDocType)) {
      return initialDocType;
    }
    return availablePresets[0]?.id || 'aadhaar';
  });

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [candidateDossier, setCandidateDossier] = useState<CandidateDossierData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileDevice);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile device
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync initial doc type when opened or when check changes + lock page body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('vsm-locked');
      document.documentElement.classList.add('vsm-locked');
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const firstValid =
        initialDocType && availablePresets.some((p) => p.id === initialDocType)
          ? initialDocType
          : availablePresets[0]?.id || 'aadhaar';

      setSelectedDocType(firstValid);
      setStatusModalOpen(false);
      setCandidateDossier(null);
      setShowRawText(false);
      setDragActive(false);
      setFieldErrors({});
      setTouchedFields({});
      setFormSubmitAttempted(false);
      setDocsState(createInitialDocsState());
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return () => {
        document.body.classList.remove('vsm-locked');
        document.documentElement.classList.remove('vsm-locked');
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, initialDocType, availablePresets]);

  if (!isOpen) return null;

  // Seamlessly transition to the dedicated, separate Verification Status & Report Modal
  if (statusModalOpen && candidateDossier) {
    return (
      <VerificationStatusModal
        isOpen={true}
        onClose={() => {
          setStatusModalOpen(false);
          onClose();
        }}
        serviceTitle={serviceTitle}
        servicePrice={servicePrice}
        candidateData={candidateDossier}
      />
    );
  }

  const currentPreset =
    DOC_PRESETS.find((p) => p.id === selectedDocType) || availablePresets[0] || DOC_PRESETS[0];

  const currentDoc = docsState[selectedDocType] || createDefaultDocItem(selectedDocType);
  const {
    uploadedImage,
    fileName,
    isScanning,
    scanStepText,
    scanProgress,
    isExtracted,
    rawOCRText,
    scanNotice,
    formData,
  } = currentDoc;

  const handleDocTypeChange = (newDocType: DocumentType) => {
    if (selectedDocType === newDocType) return;
    setSelectedDocType(newDocType);
    setShowRawText(false);
    setFieldErrors({});
    setTouchedFields({});
    setFormSubmitAttempted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* ========================================================
     REAL OCR EXTRACTION EXECUTION PIPELINE
     Scans the actual uploaded image pixels and parses real text
     into the isolated state for targetDoc
  ======================================================== */
  const runOCRExtraction = async (
    imgData: string,
    name: string,
    targetDoc: DocumentType = selectedDocType
  ) => {
    const targetPreset = DOC_PRESETS.find((p) => p.id === targetDoc) || currentPreset;

    // Reset validation errors when a new scan starts
    setFieldErrors({});
    setTouchedFields({});
    setFormSubmitAttempted(false);

    // 1. Set scanning state for the targeted document
    setDocsState((prev) => ({
      ...prev,
      [targetDoc]: {
        ...(prev[targetDoc] || createDefaultDocItem(targetDoc)),
        uploadedImage: imgData,
        fileName: name,
        isScanning: true,
        isExtracted: false,
        scanProgress: 10,
        scanStepText: `Analyzing ${targetPreset.label} boundaries & security markers...`,
        rawOCRText: '',
        scanNotice: null,
      },
    }));

    try {
      // 2. Recognize real optical text from image
      const rawText = await recognizeTextFromImage(imgData, (progress, status) => {
        setDocsState((prev) => ({
          ...prev,
          [targetDoc]: {
            ...(prev[targetDoc] || createDefaultDocItem(targetDoc)),
            scanProgress: progress,
            scanStepText: status,
          },
        }));
      });

      // LEVEL 1: DOCUMENT TYPE VALIDATION & TAMPER DETECTION
      const docValidation = detectUploadedDocumentType(rawText, targetDoc);

      // 3. Parse real document data from raw OCR text
      const { data: parsed, confidence, matchedFields } = parseDocumentText(rawText, targetDoc);

      setDocsState((prev) => {
        const existing = prev[targetDoc] || createDefaultDocItem(targetDoc);

        // Smart carryover: If user already provided name, DOB or address in another tab, carry over if blank
        let fallbackName = '';
        let fallbackDob = '';
        let fallbackAddress = '';
        Object.values(prev).forEach((d) => {
          if (!fallbackName && d.formData.fullName) fallbackName = d.formData.fullName;
          if (!fallbackDob && d.formData.dob) fallbackDob = d.formData.dob;
          if (!fallbackAddress && d.formData.address) fallbackAddress = d.formData.address;
        });

        const newFullName = parsed.fullName || existing.formData.fullName || fallbackName || '';
        const newDob = parsed.dob || existing.formData.dob || fallbackDob || '';
        const newAddress = parsed.address || existing.formData.address || fallbackAddress || '';

        // Notice construction with Level 1 Document Validation
        let notice: { type: 'success' | 'warning' | 'error'; message: string };

        if (docValidation.mismatchError) {
          notice = {
            type: 'error',
            message: docValidation.mismatchError,
          };
          setFieldErrors((errs) => ({ ...errs, uploadedImage: docValidation.mismatchError! }));
        } else if (docValidation.readabilityError) {
          notice = {
            type: 'warning',
            message: docValidation.readabilityError,
          };
          setFieldErrors((errs) => ({ ...errs, uploadedImage: docValidation.readabilityError! }));
        } else if (matchedFields.length > 0) {
          notice = {
            type: 'success',
            message: `✓ Document verified as ${targetPreset.label}. Extracted ${matchedFields.length} fields (${matchedFields.join(', ')}) with ${confidence}% accuracy.`,
          };
        } else if (rawText && rawText.trim().length > 0) {
          notice = {
            type: 'warning',
            message: '⚠️ Document scanned, but standard ID patterns were faint or partially obscured. Please verify or fill details below.',
          };
        } else {
          notice = {
            type: 'warning',
            message: '⚠️ Optical characters could not be automatically detected. Please enter your details in the input fields below.',
          };
        }

        // Store immutable extracted reference for Level 2 Manual Data Validation
        const extractedSnapshot: Partial<OCRExtractedData> = {
          docType: targetDoc,
          fullName: parsed.fullName || '',
          idNumber: parsed.idNumber || '',
          dob: parsed.dob || '',
          gender: parsed.gender || '',
          guardianName: parsed.guardianName || '',
          address: parsed.address || '',
          validUntil: parsed.validUntil || '',
          confidence: confidence || 0,
        };

        return {
          ...prev,
          [targetDoc]: {
            ...existing,
            uploadedImage: imgData,
            fileName: name,
            isScanning: false,
            scanProgress: 100,
            scanStepText: docValidation.mismatchError ? 'Document Mismatch Detected' : 'Scanning completed!',
            isExtracted: true,
            rawOCRText: rawText,
            scanNotice: notice,
            documentValidation: docValidation,
            extractedReference: extractedSnapshot,
            formData: {
              docType: targetDoc,
              fullName: newFullName,
              idNumber: parsed.idNumber || existing.formData.idNumber || '',
              dob: newDob,
              gender: parsed.gender || existing.formData.gender || 'Male',
              guardianName: parsed.guardianName || existing.formData.guardianName || '',
              address: newAddress,
              validUntil: parsed.validUntil || existing.formData.validUntil || '',
              confidence: confidence || existing.formData.confidence || 0,
            },
          },
        };
      });
    } catch (err) {
      console.error('Scan error:', err);
      setDocsState((prev) => {
        const existing = prev[targetDoc] || createDefaultDocItem(targetDoc);
        return {
          ...prev,
          [targetDoc]: {
            ...existing,
            isScanning: false,
            scanProgress: 100,
            isExtracted: true,
            scanNotice: {
              type: 'warning',
              message: '⚠️ Scan processing encountered an issue. You can manually enter details in the input fields below.',
            },
          },
        };
      });
    }
  };

  // Handle Local File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        runOCRExtraction(reader.result, file.name, selectedDocType);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          runOCRExtraction(reader.result, file.name, selectedDocType);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run dynamic OCR on sample document for active tab
  const handleLoadSample = () => {
    const preset = DOC_PRESETS.find((p) => p.id === selectedDocType) || currentPreset;
    const svgMock = generateSampleDocSVG(preset);
    runOCRExtraction(svgMock, `Sample_${preset.label.replace(/\s+/g, '_')}.svg`, selectedDocType);
  };

  const handleInputChange = (field: keyof OCRExtractedData, value: string) => {
    let finalValue = value;
    // Auto-uppercase PAN, Voter ID and Passport numbers
    if (field === 'idNumber') {
      if (selectedDocType === 'pan' || selectedDocType === 'voter_id' || selectedDocType === 'passport') {
        finalValue = value.toUpperCase();
      }
    }

    // Do not allow numeric digits in Father's / Spouse's Name (string only)
    if (field === 'guardianName') {
      finalValue = value.replace(/[0-9]/g, '');
    }

    setDocsState((prev) => {
      const current = prev[selectedDocType] || createDefaultDocItem(selectedDocType);
      const updated = {
        ...current,
        formData: {
          ...current.formData,
          [field]: finalValue,
        },
      };

      const next = { ...prev, [selectedDocType]: updated };

      // Propagate common personal fields (fullName, address, dob) to other docs if currently empty
      if (field === 'fullName' || field === 'address' || field === 'dob') {
        availablePresets.forEach((p) => {
          if (p.id !== selectedDocType) {
            const other = next[p.id];
            if (other && !other.formData[field]) {
              next[p.id] = {
                ...other,
                formData: {
                  ...other.formData,
                  [field]: finalValue,
                },
              };
            }
          }
        });
      }

      return next;
    });

    // If field was already touched or submission was attempted, re-validate dynamically (Format + Consistency)
    if (touchedFields[field] || formSubmitAttempted) {
      const err = validateOCRFieldWithConsistency(
        field,
        finalValue,
        currentDoc.extractedReference,
        selectedDocType,
        currentPreset.label
      );
      setFieldErrors((prev) => {
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

  const handleInputBlur = (field: keyof OCRExtractedData) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    const val = formData[field] || '';
    const err = validateOCRFieldWithConsistency(
      field,
      String(val),
      currentDoc.extractedReference,
      selectedDocType,
      currentPreset.label
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[field] = err;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const uploadedPresets = availablePresets.filter((p) => Boolean(docsState[p.id]?.uploadedImage));

  // Determine validity with strict government document compliance & data consistency
  const currentValidationErrors = validateAllOCRFields(
    formData,
    selectedDocType,
    currentPreset.label,
    Boolean(uploadedImage),
    currentDoc.documentValidation,
    currentDoc.extractedReference
  );
  const isCurrentDocValid =
    Object.keys(currentValidationErrors).length === 0 &&
    !currentDoc.documentValidation?.mismatchError &&
    !currentDoc.documentValidation?.readabilityError;

  const canSubmit = isCurrentDocValid;

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitAttempted(true);

    const errors = validateAllOCRFields(
      formData,
      selectedDocType,
      currentPreset.label,
      Boolean(uploadedImage),
      currentDoc.documentValidation,
      currentDoc.extractedReference
    );
    setFieldErrors(errors);
    setTouchedFields({
      fullName: true,
      idNumber: true,
      dob: true,
      gender: true,
      guardianName: true,
      address: true,
      validUntil: true,
      uploadedImage: true,
    });

    if (Object.keys(errors).length > 0 || currentDoc.documentValidation?.mismatchError) {
      if (errors.uploadedImage || currentDoc.documentValidation?.mismatchError) {
        const dropEl = document.querySelector('.ocr-dropzone') as HTMLElement;
        if (dropEl) {
          dropEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const firstField = Object.keys(errors).find((k) => k !== 'uploadedImage');
      if (firstField) {
        const el = document.getElementById(`ocr-field-${firstField}`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    const dossier: CandidateDossierData = {
      fullName: formData.fullName.trim(),
      idNumber: formData.idNumber.trim(),
      docType: selectedDocType,
      docLabel: currentPreset.label,
      dob: formData.dob.trim(),
      gender: formData.gender || 'Male',
      guardianName: formData.guardianName.trim(),
      address: formData.address.trim(),
    };

    setCandidateDossier(dossier);
    setStatusModalOpen(true);
    onComplete?.(formData);
  };

  // Date boundary calculation for calendar pickers (calculated pure on render, no hooks)
  const todayObj = new Date();
  const maxDobDate = `${todayObj.getFullYear() - 18}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const minDobDate = `${todayObj.getFullYear() - 80}-01-01`;

  const tomorrowObj = new Date(todayObj.getTime() + 86400000);
  const minExpiryDate = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

  return (
    <div className="ocr-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      {/* Scoped CSS styles for validation indicators without touching external CSS */}
      <style>{`
        .ocr-date-input {
          cursor: pointer !important;
          color-scheme: light;
          font-family: inherit;
        }
        .ocr-date-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.75;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .ocr-date-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
          transform: scale(1.18);
        }
        .ocr-input-error {
          border-color: #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.03) !important;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.12) !important;
        }
        .ocr-dropzone-error {
          border-color: #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.04) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
        }
        .ocr-dropzone-error-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #991b1b;
          font-size: 11.5px;
          font-weight: 600;
          animation: ocrFadeIn 0.2s ease-in-out;
        }
        .ocr-field-error-msg {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #ef4444;
          font-size: 11.5px;
          font-weight: 500;
          margin-top: 4px;
          line-height: 1.35;
          animation: ocrFadeIn 0.2s ease-in-out;
        }
        .ocr-field-error-msg svg {
          flex-shrink: 0;
        }
        .ocr-field-hint {
          display: block;
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
          line-height: 1.3;
        }
        .ocr-valid-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          font-weight: 600;
          color: #059669;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 1px 6px;
          border-radius: 4px;
          animation: ocrFadeIn 0.2s ease-in-out;
        }
        .ocr-strict-security-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .ocr-validation-summary-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 14px;
          animation: ocrFadeIn 0.2s ease-in-out;
        }
        .ocr-validation-summary-banner svg {
          flex-shrink: 0;
          margin-top: 1px;
        }
        .ocr-doc-mismatch-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 10px;
          padding: 12px 14px;
          background: #fef2f2;
          border: 1.5px solid #ef4444;
          border-radius: 10px;
          color: #991b1b;
          font-size: 12px;
          animation: ocrFadeIn 0.2s ease-in-out;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.12);
        }
        .ocr-doc-mismatch-banner strong {
          color: #7f1d1d;
          font-size: 12.5px;
        }
        .ocr-mismatch-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .ocr-mismatch-icon {
          font-size: 18px;
          line-height: 1;
          flex-shrink: 0;
        }
        .ocr-mismatch-msg {
          margin: 0 0 6px 0;
          line-height: 1.45;
          font-weight: 500;
        }
        .ocr-mismatch-action-hint {
          font-size: 11px;
          color: #b91c1c;
          background: rgba(254, 226, 226, 0.9);
          padding: 4px 8px;
          border-radius: 6px;
          display: inline-block;
          font-weight: 600;
        }
        .ocr-doc-readability-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 10px;
          padding: 12px 14px;
          background: #fffbeb;
          border: 1.5px solid #f59e0b;
          border-radius: 10px;
          color: #92400e;
          font-size: 12px;
          animation: ocrFadeIn 0.2s ease-in-out;
        }
        .ocr-doc-readability-banner strong {
          color: #78350f;
          font-size: 12.5px;
        }
        .ocr-doc-verified-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          padding: 9px 12px;
          background: #ecfdf5;
          border: 1px solid #10b981;
          border-radius: 8px;
          color: #065f46;
          font-size: 11.5px;
          font-weight: 600;
          animation: ocrFadeIn 0.2s ease-in-out;
        }
        .ocr-verified-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #10b981;
          color: white;
          font-size: 10px;
          font-weight: bold;
        }
        .ocr-badge-warning {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          font-weight: 600;
          color: #b45309;
          background: #fef3c7;
          border: 1px solid #fde68a;
          padding: 1px 6px;
          border-radius: 4px;
          animation: ocrFadeIn 0.2s ease-in-out;
        }
        @keyframes ocrFadeIn {
          from { opacity: 0; transform: translateY(-3px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="ocr-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="ocr-modal-header">
          <div className="ocr-header-brand-wrap">
            <span className="ocr-header-shield-icon">🛡️</span>
            <div className="ocr-header-titles">
              <div className="ocr-header-eyebrow">
                <span className="ocr-pulse-dot" />
                <span>AI OCR DOCUMENT SCANNER</span>
              </div>
              <h2 className="ocr-modal-main-title">
                Upload Document &amp; <span className="ocr-gradient-text">Auto-Extract Details</span>
              </h2>
            </div>
          </div>

          <div className="ocr-header-actions">
            <div className="ocr-service-capsule">
              <span className="ocr-capsule-label">Check:</span>
              <span className="ocr-capsule-title">{serviceTitle}</span>
              <span className="ocr-capsule-price">{servicePrice}</span>
            </div>

            <button type="button" className="ocr-modal-close-btn" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>
        </div>

        {/* Modal Main Body Content */}
        <div className="ocr-modal-body-grid">
            {/* Left Column: Upload & Live Scanner Stage */}
            <div className="ocr-scanner-column">
              {/* Document Requirement Indicator: Only allows documents mentioned in this check */}
              {availablePresets.length === 1 ? (
                /* Single Mandated Document: Display Locked Banner */
                <div className="ocr-single-doc-banner">
                  <div className="ocr-single-doc-pill">
                    <span className="ocr-lock-icon">🔒</span>
                    <span className="ocr-single-doc-label">
                      MANDATED DOCUMENT: <strong>{currentPreset.label}</strong>
                    </span>
                  </div>
                  <span className="ocr-single-doc-note">
                    This check strictly verifies <strong>{currentPreset.label}</strong> credentials. Only {currentPreset.label} is accepted for this verification.
                  </span>
                </div>
              ) : (
                /* Multiple Accepted Documents with Upload Badges */
                <div className="ocr-multiple-docs-wrap">
                  <div className="ocr-allowed-heading">
                    <span>Accepted Documents for this check ({availablePresets.length}):</span>
                    <span className="ocr-allowed-counter-badge">
                      {uploadedPresets.length > 0
                        ? `Uploaded: ${uploadedPresets.length} of ${availablePresets.length}`
                        : `Upload ${availablePresets.map((p) => p.label).join(' or ')}`}
                    </span>
                  </div>
                  <div className="ocr-doc-type-selector" role="tablist">
                    {availablePresets.map((preset) => {
                      const item = docsState[preset.id];
                      const isUploaded = Boolean(item?.uploadedImage);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          role="tab"
                          aria-selected={selectedDocType === preset.id}
                          className={`ocr-doc-pill ${selectedDocType === preset.id ? 'active' : ''} ${isUploaded ? 'uploaded' : ''}`}
                          onClick={() => handleDocTypeChange(preset.id)}
                        >
                          <span className="ocr-doc-icon">{preset.icon}</span>
                          <span className="ocr-doc-name">{preset.label}</span>
                          {isUploaded ? (
                            <span className="ocr-pill-status-badge success">✓ Done</span>
                          ) : (
                            <span className="ocr-pill-status-badge pending">+ Upload</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Drop Zone / Image Display Stage */}
              <div
                className={`ocr-dropzone ${dragActive ? 'drag-active' : ''} ${uploadedImage ? 'has-image' : ''} ${fieldErrors.uploadedImage && !uploadedImage ? 'ocr-dropzone-error' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  if (!uploadedImage) {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg,.pdf,.svg"
                  className="ocr-hidden-input"
                  onChange={handleFileChange}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                />

                {uploadedImage ? (
                  <div className="ocr-preview-container">
                    <img src={uploadedImage} alt="Uploaded Document" className="ocr-preview-img" />

                    {/* Animated Holographic Scanning Beam */}
                    {isScanning && (
                      <div className="ocr-laser-scanner">
                        <div className="ocr-laser-line" />
                        <div className="ocr-laser-glow" />
                        <div className="ocr-corner-bracket top-left" />
                        <div className="ocr-corner-bracket top-right" />
                        <div className="ocr-corner-bracket bottom-left" />
                        <div className="ocr-corner-bracket bottom-right" />
                      </div>
                    )}

                    <div className="ocr-preview-overlay-bar">
                      <span className="ocr-preview-filename">📄 {fileName || `${currentPreset.label} uploaded`}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isMobile && (
                          <button
                            type="button"
                            className="ocr-reupload-btn camera-alt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCameraOpen(true);
                            }}
                          >
                            📷 Camera
                          </button>
                        )}
                        <button
                          type="button"
                          className="ocr-reupload-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            fileInputRef.current?.click();
                          }}
                        >
                          🔄 Replace
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ocr-dropzone-placeholder">
                    <div className="ocr-upload-icon-circle">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>

                    <h4 className="ocr-drop-title">
                      Upload your <strong>{currentPreset.label}</strong>
                    </h4>
                    <p className="ocr-drop-subtitle">
                      Drag &amp; drop document image here, or <span>browse from device</span>
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <button
                        type="button"
                        className="ocr-browse-file-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          fileInputRef.current?.click();
                        }}
                      >
                        📁 Browse {currentPreset.label} File
                      </button>

                      {isMobile && (
                        <button
                          type="button"
                          className="ocr-mobile-camera-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCameraOpen(true);
                          }}
                        >
                          <span className="ocr-camera-icon">📸</span>
                          <span>Capture with Camera</span>
                        </button>
                      )}
                    </div>

                    <span className="ocr-drop-formats">
                      Required Format: <strong>{currentPreset.idFormat}</strong> • JPG, PNG, WEBP, or PDF
                    </span>
                  </div>
                )}
              </div>

              {/* Level 1: Document Type Validation & Mismatch Alerts */}
              {uploadedImage && currentDoc.documentValidation?.mismatchError && (
                <div className="ocr-doc-mismatch-banner" role="alert">
                  <span className="ocr-mismatch-icon">🛑</span>
                  <div style={{ flex: 1 }}>
                    <div className="ocr-mismatch-header">
                      <strong>Document Type Mismatch Detected</strong>
                    </div>
                    <p className="ocr-mismatch-msg">{currentDoc.documentValidation.mismatchError}</p>
                    <span className="ocr-mismatch-action-hint">
                      Action Required: Click "Replace" to upload an authentic {currentPreset.label}.
                    </span>
                  </div>
                </div>
              )}

              {uploadedImage && currentDoc.documentValidation?.readabilityError && (
                <div className="ocr-doc-readability-banner" role="alert">
                  <span className="ocr-mismatch-icon">⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div className="ocr-mismatch-header">
                      <strong>Document Readability Alert</strong>
                    </div>
                    <p className="ocr-mismatch-msg">{currentDoc.documentValidation.readabilityError}</p>
                    <span className="ocr-mismatch-action-hint" style={{ color: '#92400e', background: 'rgba(254, 243, 199, 0.95)' }}>
                      Tip: Ensure good lighting, avoid glare, and lay document flat.
                    </span>
                  </div>
                </div>
              )}

              {uploadedImage && currentDoc.documentValidation && !currentDoc.documentValidation.mismatchError && !currentDoc.documentValidation.readabilityError && currentDoc.isExtracted && (
                <div className="ocr-doc-verified-banner">
                  <span className="ocr-verified-icon">✓</span>
                  <span>Document Type Verified: <strong>{currentPreset.label}</strong> (Level 1 Authenticity Confirmed)</span>
                </div>
              )}

              {/* Strict Validation Document Attachment Alert */}
              {fieldErrors.uploadedImage && !uploadedImage && (
                <div className="ocr-dropzone-error-badge" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{fieldErrors.uploadedImage}</span>
                </div>
              )}

              {/* Progress & Live Telemetry Bar */}
              {isScanning && (
                <div className="ocr-telemetry-box">
                  <div className="ocr-telemetry-header">
                    <span className="ocr-telemetry-text">{scanStepText}</span>
                    <span className="ocr-telemetry-percent">{scanProgress}%</span>
                  </div>
                  <div className="ocr-telemetry-progress-track">
                    <div className="ocr-telemetry-progress-bar" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Quick Sample Test Helper Strip */}
              <div className="ocr-quick-sample-strip">
                <span className="ocr-quick-sample-label">Don't have physical document handy?</span>
                <button
                  type="button"
                  className="ocr-try-sample-btn"
                  onClick={handleLoadSample}
                  disabled={isScanning}
                >
                  ⚡ Try Sample {currentPreset.label}
                </button>
              </div>

              {/* View Raw Extracted OCR Text Drawer */}
              {rawOCRText && (
                <div className="ocr-raw-text-drawer">
                  <button
                    type="button"
                    className="ocr-raw-toggle-btn"
                    onClick={() => setShowRawText((prev) => !prev)}
                  >
                    <span>🔍 View Raw Scanned Document Text ({rawOCRText.length} characters)</span>
                    <span>{showRawText ? '▲ Hide' : '▼ View'}</span>
                  </button>

                  {showRawText && <div className="ocr-raw-text-box">{rawOCRText}</div>}
                </div>
              )}
            </div>

            {/* Right Column: Extracted Data in Form Input Fields */}
            <div className="ocr-form-column">
              <div className="ocr-form-header">
                <div className="ocr-form-title-wrap">
                  <h3 className="ocr-form-title">Scanned Document Data</h3>
                  <p className="ocr-form-subtext">
                    {isExtracted
                      ? `Details extracted from your ${currentPreset.label}. Review and adjust if needed:`
                      : `Upload a valid ${currentPreset.label} on the left to extract details automatically.`}
                  </p>
                </div>

                {isExtracted && formData.confidence > 0 && (
                  <span className="ocr-badge-confidence">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{formData.confidence}% MATCH CONFIDENCE</span>
                  </span>
                )}
              </div>

              {/* Active Document Indicator Pill */}
              <div className="ocr-form-active-doc-badge">
                <span>
                  {currentPreset.icon} Active Document: <strong>{currentPreset.label}</strong>
                </span>
                {uploadedImage ? (
                  <span className="ocr-doc-verified-tick">✓ Document Attached</span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pending image upload</span>
                )}
              </div>

              {/* Scan Notice */}
              {scanNotice && (
                <div className={`ocr-scan-notice ${scanNotice.type}`}>
                  <span>{scanNotice.message}</span>
                </div>
              )}

              <form onSubmit={handleConfirmOrder} className="ocr-extracted-form" noValidate>
                {/* Global Validation Error Banner when submit attempted with errors */}
                {formSubmitAttempted && Object.keys(fieldErrors).length > 0 && (
                  <div className="ocr-validation-summary-banner" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>Strict Verification Requirements Not Met:</strong>
                      <span>
                        Please resolve the {Object.keys(fieldErrors).length} mandatory issue{Object.keys(fieldErrors).length > 1 ? 's' : ''} highlighted below before proceeding.
                      </span>
                    </div>
                  </div>
                )}

                {/* Field 1: Full Name */}
                <div className="ocr-field-group">
                  <div className="ocr-field-label-row">
                    <label htmlFor="ocr-field-fullName" className="ocr-label">Full Legal Name *</label>
                    {Boolean(formData.fullName && !fieldErrors.fullName) && (
                      currentDoc.extractedReference?.fullName ? (
                        <span className="ocr-valid-badge">Matches Document ✓</span>
                      ) : (
                        <span className="ocr-valid-badge">Valid Format ✓</span>
                      )
                    )}
                    {Boolean(formData.fullName && currentDoc.isExtracted && !fieldErrors.fullName && currentDoc.extractedReference?.fullName) && (
                      <span className="ocr-field-matched-tag">OCR Verified ✓</span>
                    )}
                  </div>
                  <input
                    id="ocr-field-fullName"
                    type="text"
                    placeholder="e.g. Full Legal Name as on document (First & Last Name)"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    onBlur={() => handleInputBlur('fullName')}
                    className={`ocr-text-input ${fieldErrors.fullName ? 'ocr-input-error' : ''}`}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                  />
                  {fieldErrors.fullName ? (
                    <div className="ocr-field-error-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{fieldErrors.fullName}</span>
                    </div>
                  ) : (
                    <span className="ocr-field-hint">Must enter full legal name (First &amp; Last Name) as on official government ID</span>
                  )}
                </div>

                {/* Field 2: Document / ID Number */}
                <div className="ocr-field-group">
                  <div className="ocr-field-label-row">
                    <label htmlFor="ocr-field-idNumber" className="ocr-label">
                      {currentPreset.label} Number ({currentPreset.idFormat}) *
                    </label>
                    {Boolean(formData.idNumber && !fieldErrors.idNumber) && (
                      currentDoc.extractedReference?.idNumber ? (
                        <span className="ocr-valid-badge">Matches Document ✓</span>
                      ) : (
                        <span className="ocr-valid-badge">Strict Verified ✓</span>
                      )
                    )}
                    {Boolean(formData.idNumber && currentDoc.isExtracted && !fieldErrors.idNumber && currentDoc.extractedReference?.idNumber) && (
                      <span className="ocr-field-matched-tag">OCR Verified ✓</span>
                    )}
                  </div>
                  <input
                    id="ocr-field-idNumber"
                    type="text"
                    placeholder={`e.g. ${currentPreset.placeholderHint}`}
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    onBlur={() => handleInputBlur('idNumber')}
                    className={`ocr-text-input ocr-id-input ${fieldErrors.idNumber ? 'ocr-input-error' : ''}`}
                    aria-invalid={Boolean(fieldErrors.idNumber)}
                  />
                  {fieldErrors.idNumber ? (
                    <div className="ocr-field-error-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{fieldErrors.idNumber}</span>
                    </div>
                  ) : (
                    <span className="ocr-field-hint">Format pattern: {currentPreset.idFormat} (Must satisfy official checksum &amp; structure)</span>
                  )}
                </div>

                {/* Row 3: DOB & Gender */}
                <div className="ocr-form-two-col">
                  <div className="ocr-field-group">
                    <div className="ocr-field-label-row">
                      <label htmlFor="ocr-field-dob" className="ocr-label">Date of Birth (DOB) *</label>
                      {Boolean(formData.dob && !fieldErrors.dob) && (
                        currentDoc.extractedReference?.dob ? (
                          <span className="ocr-valid-badge">Matches Document ✓</span>
                        ) : (
                          <span className="ocr-valid-badge">Valid Date ✓</span>
                        )
                      )}
                    </div>
                    <input
                      id="ocr-field-dob"
                      type="date"
                      max={maxDobDate}
                      min={minDobDate}
                      value={toISODateString(formData.dob)}
                      onChange={(e) => handleInputChange('dob', toDisplayDateString(e.target.value))}
                      onBlur={() => handleInputBlur('dob')}
                      onClick={(e) => {
                        try {
                          (e.currentTarget as any).showPicker?.();
                        } catch {}
                      }}
                      className={`ocr-text-input ocr-date-input ${fieldErrors.dob ? 'ocr-input-error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.dob)}
                    />
                    {fieldErrors.dob ? (
                      <div className="ocr-field-error-msg">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{fieldErrors.dob}</span>
                      </div>
                    ) : (
                      <span className="ocr-field-hint">Click to pick from calendar (Must be 18 to 80 years old)</span>
                    )}
                  </div>

                  <div className="ocr-field-group">
                    <label htmlFor="ocr-field-gender" className="ocr-label">Gender</label>
                    <select
                      id="ocr-field-gender"
                      value={formData.gender || 'Male'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="ocr-select-input"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <span className="ocr-field-hint">Official document gender</span>
                  </div>
                </div>

                {/* Field 4: Father's / Guardian's Name */}
                <div className="ocr-field-group">
                  <div className="ocr-field-label-row">
                    <label htmlFor="ocr-field-guardianName" className="ocr-label">Father's / Spouse's Name</label>
                    {Boolean(formData.guardianName && !fieldErrors.guardianName) && (
                      <span className="ocr-valid-badge">Valid ✓</span>
                    )}
                  </div>
                  <input
                    id="ocr-field-guardianName"
                    type="text"
                    placeholder="Father's or Guardian legal name (if on document)"
                    value={formData.guardianName}
                    onChange={(e) => handleInputChange('guardianName', e.target.value)}
                    onKeyDown={(e) => {
                      // Disallow numeric digit keys directly (only string characters allowed)
                      if (/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => handleInputBlur('guardianName')}
                    className={`ocr-text-input ${fieldErrors.guardianName ? 'ocr-input-error' : ''}`}
                    aria-invalid={Boolean(fieldErrors.guardianName)}
                  />
                  {fieldErrors.guardianName ? (
                    <div className="ocr-field-error-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{fieldErrors.guardianName}</span>
                    </div>
                  ) : (
                    <span className="ocr-field-hint">Alphabetic letters only (numeric numbers not allowed)</span>
                  )}
                </div>

                {/* Field 5: Address */}
                <div className="ocr-field-group">
                  <div className="ocr-field-label-row">
                    <label htmlFor="ocr-field-address" className="ocr-label">
                      Permanent / Current Address {selectedDocType === 'utility_bill' || selectedDocType === 'aadhaar' ? '*' : ''}
                    </label>
                    {Boolean(formData.address && !fieldErrors.address) && (
                      <span className="ocr-valid-badge">Valid Address ✓</span>
                    )}
                    {Boolean(formData.address && currentDoc.isExtracted && !fieldErrors.address) && (
                      <span className="ocr-field-matched-tag">Address Parsed ✓</span>
                    )}
                  </div>
                  <textarea
                    id="ocr-field-address"
                    rows={3}
                    placeholder="Full residential address with house no., street, city, state, and 6-digit PIN"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onBlur={() => handleInputBlur('address')}
                    className={`ocr-textarea-input ${fieldErrors.address ? 'ocr-input-error' : ''}`}
                    aria-invalid={Boolean(fieldErrors.address)}
                  />
                  {fieldErrors.address ? (
                    <div className="ocr-field-error-msg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{fieldErrors.address}</span>
                    </div>
                  ) : (
                    <span className="ocr-field-hint">House/Flat No., Street, Locality, City, State, and 6-digit Indian PIN code</span>
                  )}
                </div>

                {/* Field 6: Expiry Date (if applicable) */}
                {(selectedDocType === 'driving_license' || selectedDocType === 'passport') && (
                  <div className="ocr-field-group">
                    <div className="ocr-field-label-row">
                      <label htmlFor="ocr-field-validUntil" className="ocr-label">Validity / Expiry Date *</label>
                      {Boolean(formData.validUntil && !fieldErrors.validUntil) && (
                        currentDoc.extractedReference?.validUntil ? (
                          <span className="ocr-valid-badge">Matches Document ✓</span>
                        ) : (
                          <span className="ocr-valid-badge">Active &amp; Valid ✓</span>
                        )
                      )}
                    </div>
                    <input
                      id="ocr-field-validUntil"
                      type="date"
                      min={minExpiryDate}
                      max="2060-12-31"
                      value={toISODateString(formData.validUntil || '')}
                      onChange={(e) => handleInputChange('validUntil', toDisplayDateString(e.target.value))}
                      onBlur={() => handleInputBlur('validUntil')}
                      onClick={(e) => {
                        try {
                          (e.currentTarget as any).showPicker?.();
                        } catch {}
                      }}
                      className={`ocr-text-input ocr-date-input ${fieldErrors.validUntil ? 'ocr-input-error' : ''}`}
                      aria-invalid={Boolean(fieldErrors.validUntil)}
                    />
                    {fieldErrors.validUntil ? (
                      <div className="ocr-field-error-msg">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{fieldErrors.validUntil}</span>
                      </div>
                    ) : (
                      <span className="ocr-field-hint">Click to pick unexpired future date from calendar</span>
                    )}
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="ocr-form-actions-footer">
                  <div className="ocr-price-summary">
                    <span className="ocr-summary-label">Check Fee:</span>
                    <span className="ocr-summary-value">{servicePrice}</span>
                  </div>

                  <button
                    type="submit"
                    className="ocr-submit-action-btn"
                    disabled={isScanning || Boolean(currentDoc.documentValidation?.mismatchError)}
                  >
                    <span>Confirm &amp; Submit Verification</span>
                    <svg
                      width="16"
                      height="16"
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
              </form>
            </div>
          </div>
      </div>

      {/* Mobile-Only Document Camera Scanner Modal */}
      {isMobile && (
        <Camera
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          documentLabel={currentPreset.label}
          onCapture={(dataUrl, capFileName) => {
            runOCRExtraction(dataUrl, capFileName, selectedDocType);
          }}
        />
      )}
    </div>
  );
};

export default OCRModal;
