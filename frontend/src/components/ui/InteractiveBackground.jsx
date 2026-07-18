import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'motion/react';

export function InteractiveBackground() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // --- Particle Trailing Physics (The Cursor) ---
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  const spring1X = useSpring(mouseX, { damping: 20, stiffness: 300 });
  const spring1Y = useSpring(mouseY, { damping: 20, stiffness: 300 });
  const spring2X = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const spring2Y = useSpring(mouseY, { damping: 30, stiffness: 200 });
  const spring3X = useSpring(mouseX, { damping: 40, stiffness: 120 });
  const spring3Y = useSpring(mouseY, { damping: 40, stiffness: 120 });

  // Update Framer Motion mouse coordinates
  useEffect(() => {
    if (!isLandingPage) return;
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLandingPage, mouseX, mouseY]);

  // --- HTML5 Canvas Magnetic Vector Field ---
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isLandingPage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    let currentMouseX = -1000;
    let currentMouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const onCanvasMouseMove = (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener('mousemove', onCanvasMouseMove);

    const spacing = 42; // slightly larger spacing for icons

    // Path2D objects for various inventory management items
    const inventoryPaths = [
      new Path2D("M3 7.5L12 3L21 7.5M3 7.5L12 12M3 7.5V16.5L12 21M21 7.5L12 12M21 7.5V16.5L12 21M12 12V21"), // Cube / Box
      new Path2D("M7 7H7.01M10.828 2.515H4.5V8.843L14.757 19.1L21.121 12.736L10.828 2.515Z"), // Tag / Label
      new Path2D("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"), // Clipboard / Audit
      new Path2D("M3 5h2v14H3z M7 5h3v14H7z M12 5h2v14h-2z M16 5h1v14h-1z M19 5h2v14h-2z"), // Barcode
    ];

    const draw = () => {
      // Smooth mouse follow (lerp)
      currentMouseX += (targetMouseX - currentMouseX) * 0.15;
      currentMouseY += (targetMouseY - currentMouseY) * 0.15;

      ctx.clearRect(0, 0, width, height);

      // Draw grid of vectors
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          const dx = currentMouseX - x;
          const dy = currentMouseY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // By default, point perfectly horizontal
          let angle = 0;
          let alpha = 0.15;
          let scaleMultiplier = 0.5;

          const influenceRadius = 400;
          if (dist < influenceRadius) {
            const intensity = 1 - (dist / influenceRadius);
            // Interpolate from horizontal to pointing at mouse
            const targetAngle = Math.atan2(dy, dx);
            angle = targetAngle * intensity; // Smooth transition
            alpha = 0.15 + (intensity * 0.7);
            scaleMultiplier = 1 + (intensity * 0.3); // Slightly enlarge when active
          }

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          // Scale down the 24x24 icons so they fit well
          ctx.scale(0.5 * scaleMultiplier, 0.5 * scaleMultiplier);
          ctx.translate(-12, -12); // Center the 24x24 SVG

          if (dist < influenceRadius) {
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`; // Emerald when active
          } else {
            ctx.strokeStyle = `rgba(148, 163, 184, 0.15)`; // Slate when resting
          }

          ctx.lineWidth = 2.0; // Slightly thicker because we scaled down
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Pick an icon based on grid position
          const col = Math.floor(x / spacing);
          const row = Math.floor(y / spacing);
          const pathIndex = (col + row) % inventoryPaths.length;

          ctx.stroke(inventoryPaths[pathIndex]);

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onCanvasMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLandingPage]);

  // Static Gradient (for other pages)
  const staticGradient = `
    radial-gradient(circle at 15% 30%, var(--color-primary-100), transparent 55%),
    radial-gradient(circle at 85% 20%, var(--color-primary-200), transparent 50%),
    radial-gradient(circle at 50% 90%, var(--color-primary-100), transparent 60%),
    radial-gradient(circle at 20% 80%, var(--color-primary-50), transparent 40%),
    var(--color-canvas)
  `;

  if (isLandingPage) {
    return (
      <>
        {/* Solid Background Base */}
        <div className="fixed inset-0 z-[-2] bg-slate-50" />

        {/* Magnetic Vector Field Texture (z-[-1]) */}
        <canvas
          ref={canvasRef}
          className="fixed inset-0 z-[-1] pointer-events-none opacity-60"
        />

        {/* Trailing Particles layer: Underneath content (z-0) but above background */}
        <div className="pointer-events-none fixed inset-0 z-[0] overflow-hidden">
          {/* Tertiary Particle: Soft blurred shadow */}
          <motion.div
            className="absolute top-0 left-0 w-12 h-12 rounded-full bg-cyan-200/20 blur-xl"
            style={{ x: spring3X, y: spring3Y, translateX: '-50%', translateY: '-50%' }}
          />
          {/* Secondary Particle: Sleek glassmorphic ring */}
          <motion.div
            className="absolute top-0 left-0 w-8 h-8 rounded-full border border-teal-400/20 bg-teal-50/5 backdrop-blur-[1px]"
            style={{ x: spring2X, y: spring2Y, translateX: '-50%', translateY: '-50%' }}
          />
          {/* Primary Particle: Sharp cursor dot */}
          <motion.div
            className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
            style={{ x: spring1X, y: spring1Y, translateX: '-50%', translateY: '-50%' }}
          />
        </div>
      </>
    );
  }

  // Static for everywhere else
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1]"
      style={{ background: staticGradient, opacity: 0.95 }}
    />
  );
}
