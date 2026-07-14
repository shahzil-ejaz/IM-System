import { useEffect, useCallback, useRef } from 'react';

export function useScanner(onScan) {
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    // Ignore input if the user is typing in a text field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Hardware scanners typically end with an 'Enter' key
    if (e.key === 'Enter') {
      if (barcodeBuffer.current.length > 0) {
        onScan(barcodeBuffer.current);
        barcodeBuffer.current = '';
      }
      return;
    }

    // Ignore non-character keys (Shift, Control, etc.)
    if (e.key.length === 1) {
      barcodeBuffer.current += e.key;

      // Scanners type very fast, clear the buffer if input pauses (e.g. human typing vs scanner)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        barcodeBuffer.current = '';
      }, 50); // 50ms threshold is usually safe for USB HID scanners
    }
  }, [onScan]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleKeyDown]);
}
