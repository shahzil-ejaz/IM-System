import React from 'react';
import { useLocation } from 'react-router-dom';

export function InteractiveBackground() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // A sleek, premium static mesh gradient using the new CSS variables
  // Made brighter and stronger as requested
  const staticGradient = `
    radial-gradient(circle at 15% 30%, var(--color-primary-100), transparent 55%),
    radial-gradient(circle at 85% 20%, var(--color-primary-200), transparent 50%),
    radial-gradient(circle at 50% 90%, var(--color-primary-100), transparent 60%),
    radial-gradient(circle at 20% 80%, var(--color-primary-50), transparent 40%),
    var(--color-canvas)
  `;

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-[-1]"
      style={{
        background: staticGradient,
        opacity: isLandingPage ? 1 : 0.95,
      }}
    />
  );
}
