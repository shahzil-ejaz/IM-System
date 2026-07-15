import { useEffect, useCallback, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export function useBarcodeScanner({ onScan, enabled = false, onClose }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  
  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const shouldStopRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  // Sync refs to avoid re-triggering effect on prop changes
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const stopCamera = useCallback(async () => {
    shouldStopRef.current = true;
    if (html5QrCodeRef.current) {
      const scanner = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      try {
        await scanner.stop();
      } catch (err) {
        // ignore errors from stopping a non-running scanner
      }
    }
    setIsCameraActive(false);
    onCloseRef.current?.();
  }, []);

  const handleBarcodeDetected = useCallback((barcode) => {
    const normalizedBarcode = barcode?.toString().trim();
    if (!normalizedBarcode) return false;

    const scanned = onScanRef.current?.(normalizedBarcode);
    setLastScannedCode(normalizedBarcode);
    if (!scanned) {
      setCameraError('Product not found or out of stock.');
      setScanSuccess('');
    } else {
      setCameraError('');
      setScanSuccess(`Added ${normalizedBarcode} to cart`);
      window.setTimeout(() => setScanSuccess(''), 2200);
    }
    return scanned;
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      return;
    }

    let cancelled = false;
    let html5QrCode = null;

    const startCamera = async () => {
      try {
        const scannerElement = document.getElementById('pos-barcode-scanner');
        if (!scannerElement) {
          if (!cancelled) setTimeout(startCamera, 100);
          return;
        }

        html5QrCode = new Html5Qrcode('pos-barcode-scanner');
        html5QrCodeRef.current = html5QrCode;
        isScanningRef.current = false;
        shouldStopRef.current = false;

        const config = {
          fps: 10,
          qrbox: { width: 320, height: 220 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        setIsCameraActive(true);
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (cancelled || shouldStopRef.current) return;
            handleBarcodeDetected(decodedText);
            stopCamera();
          },
          (errorMessage) => {}
        );

        isScanningRef.current = true;

        if (cancelled || shouldStopRef.current) {
          isScanningRef.current = false;
          html5QrCodeRef.current = null;
          await html5QrCode.stop();
        }

      } catch (error) {
        console.error('Unable to start Html5Qrcode:', error);
        if (!cancelled) {
          setCameraError('Camera access was blocked. Please allow camera permission and try again.');
          setIsCameraActive(false);
          onCloseRef.current?.();
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      shouldStopRef.current = true;
      if (html5QrCode) {
        try {
          const stopPromise = html5QrCode.stop();
          if (stopPromise && stopPromise.catch) {
            stopPromise.catch(() => {});
          }
        } catch (err) {
          // ignore synchronous errors if it wasn't running
        }
      }
      setIsCameraActive(false);
    };
  }, [enabled]);

  return {
    isCameraActive,
    cameraError,
    lastScannedCode,
    scanSuccess,
    setCameraError,
    setIsCameraActive,
    stopCamera,
  };
}
