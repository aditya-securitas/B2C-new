import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/camera.css';

/**
 * Mobile Device Detection Helper
 * Checks user agent and touch capabilities to restrict camera access exclusively to mobile/tablet devices
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 1024;

  return isMobileUA || (isTouchDevice && isSmallScreen);
};

export interface CameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, fileName: string) => void;
  documentLabel?: string;
}

export const Camera: React.FC<CameraProps> = ({
  isOpen,
  onClose,
  onCapture,
  documentLabel = 'Document',
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeFileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setStream(null);
    }
  }, [stream]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    stopStream();
    setErrorMsg(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access is not supported on this browser. Please use native upload.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check for torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {};
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      }

      // Check if multiple camera devices exist (front & back)
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. Please allow camera access in browser settings, or use device file capture.');
      } else {
        setErrorMsg('Unable to connect to camera. You can still capture a photo using your device native camera.');
      }
    }
  }, [facingMode, stopStream]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('vsm-locked');
      startCamera();
    } else {
      stopStream();
      setCapturedImage(null);
      setTorchOn(false);
      document.body.classList.remove('vsm-locked');
    }

    return () => {
      stopStream();
      document.body.classList.remove('vsm-locked');
    };
  }, [isOpen, startCamera, stopStream]);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!stream) return;
    const track: any = stream.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      try {
        const nextTorch = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      } catch (err) {
        console.warn('Failed to toggle torch:', err);
      }
    }
  };

  // Flip Camera (Front / Back)
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Take Snapshot from Video Stream
  const handleCapture = () => {
    if (!videoRef.current) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // Retake Photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Confirm & Send Photo to OCR Modal
  const handleConfirmPhoto = () => {
    if (!capturedImage) return;
    const cleanLabel = documentLabel.replace(/\s+/g, '_');
    const fileName = `Mobile_Capture_${cleanLabel}_${Date.now()}.jpg`;
    onCapture(capturedImage, fileName);
    onClose();
  };

  // Native Camera File Input Fallback (for mobile devices where getUserMedia is restricted)
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
        stopStream();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-camera-overlay" role="dialog" aria-modal="true">
      {/* Hidden Native Mobile Camera Input Fallback */}
      <input
        ref={nativeFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleNativeFileChange}
      />

      {/* Top Header Bar */}
      <div className="camera-top-bar">
        <button
          type="button"
          className="camera-close-btn"
          onClick={onClose}
          aria-label="Close camera"
        >
          ✕
        </button>

        <div className="camera-doc-title-pill">
          <span>📷</span>
          <span>Capture {documentLabel}</span>
        </div>

        <div className="camera-actions-top">
          {hasTorch && (
            <button
              type="button"
              className={`camera-tool-btn ${torchOn ? 'active' : ''}`}
              onClick={toggleTorch}
              title={torchOn ? 'Turn Flash Off' : 'Turn Flash On'}
            >
              {torchOn ? '⚡' : '💡'}
            </button>
          )}

          {hasMultipleCameras && (
            <button
              type="button"
              className="camera-tool-btn"
              onClick={flipCamera}
              title="Switch Front/Back Camera"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      {/* Camera Live Viewport */}
      <div className="camera-viewport">
        {/* Shutter Flash Effect */}
        {isFlashing && <div className="camera-flash-overlay" />}

        {/* Live Video */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`camera-video-stream ${facingMode === 'user' ? 'mirror' : ''}`}
        />

        {/* Document Alignment Reticle & Corner Brackets */}
        <div className="camera-reticle-wrap">
          <div className="camera-reticle-border" />
          <div className="camera-corner top-left" />
          <div className="camera-corner top-right" />
          <div className="camera-corner bottom-left" />
          <div className="camera-corner bottom-right" />
          <div className="camera-laser-scan-line" />
          <span className="camera-guideline-hint">
            Align <strong>{documentLabel}</strong> within the box
          </span>
        </div>

        {/* Error / Permission Fallback Screen */}
        {errorMsg && (
          <div className="camera-error-screen">
            <span className="camera-error-icon">📷</span>
            <h4 className="camera-error-title">Camera Unavailable</h4>
            <p className="camera-error-sub">{errorMsg}</p>
            <button
              type="button"
              className="camera-native-fallback-btn"
              onClick={() => nativeFileInputRef.current?.click()}
            >
              Take Photo with Device Camera 📸
            </button>
          </div>
        )}
      </div>

      {/* Review Screen (Confirm or Retake) */}
      {capturedImage && (
        <div className="camera-review-container">
          <div className="camera-review-img-wrap">
            <img src={capturedImage} alt="Captured Document" className="camera-review-img" />
          </div>

          <div className="camera-review-bottom-bar">
            <button
              type="button"
              className="camera-btn-retake"
              onClick={handleRetake}
            >
              <span>🔄 Retake</span>
            </button>

            <button
              type="button"
              className="camera-btn-confirm"
              onClick={handleConfirmPhoto}
            >
              <span>✓ Use Photo &amp; Scan</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Shutter Action Bar */}
      {!capturedImage && !errorMsg && (
        <div className="camera-bottom-bar">
          {/* Native Mobile Camera Alternate Button */}
          <button
            type="button"
            className="camera-fallback-btn"
            onClick={() => nativeFileInputRef.current?.click()}
          >
            <span className="camera-fallback-icon">📱</span>
            <span>Device Cam</span>
          </button>

          {/* Big Shutter Button */}
          <button
            type="button"
            className="camera-shutter-outer"
            onClick={handleCapture}
            aria-label="Capture document picture"
          >
            <span className="camera-shutter-inner">📸</span>
          </button>

          {/* Spacer to keep shutter centered */}
          <div style={{ width: '48px' }} />
        </div>
      )}
    </div>
  );
};

export default Camera;

